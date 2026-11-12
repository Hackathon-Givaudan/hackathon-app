"""Mistral en appui des règles : listes fermées, priorité aux règles, repli sans modèle.

Les tests n'ont pas besoin d'Ollama : un faux serveur compatible OpenAI répond à sa place.
"""
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from app import llm, moteur

BRIEF = "On ouvre un restaurant en bord de mer. On veut une bougie fraîche et iodée. Prix accessible."


class FauxOllama(BaseHTTPRequestHandler):
    reponse: dict = {}
    recus: list = []

    def log_message(self, *args):
        pass

    def _repondre(self, corps: dict):
        data = json.dumps(corps).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._repondre({"data": [{"id": "mistral:7b"}]})

    def do_POST(self):
        corps = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        FauxOllama.recus.append(corps)
        prompt = corps["messages"][0]["content"]
        contenu = FauxOllama.reponse["reformulation" if "Tu es Aurore" in prompt else "analyse"]
        self._repondre({"choices": [{"message": {"content": json.dumps(contenu, ensure_ascii=False)}}]})


@pytest.fixture
def faux_modele(monkeypatch):
    serveur = HTTPServer(("127.0.0.1", 0), FauxOllama)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    monkeypatch.setattr(llm, "AI_BASE_URL", f"http://127.0.0.1:{serveur.server_port}")
    FauxOllama.recus = []
    yield FauxOllama
    serveur.shutdown()


@pytest.fixture
def modele_eteint(monkeypatch):
    serveur = HTTPServer(("127.0.0.1", 0), FauxOllama)
    port = serveur.server_port
    serveur.server_close()  # port libre : personne ne répond
    monkeypatch.setattr(llm, "AI_BASE_URL", f"http://127.0.0.1:{port}")
    monkeypatch.setattr(llm, "AI_TIMEOUT", 2)


def test_sans_option_aucun_appel(monkeypatch):
    monkeypatch.setattr(llm, "_chat", lambda prompt: pytest.fail("le modèle ne doit pas être appelé"))
    r = moteur.recommander(BRIEF)
    assert r["llm"]["analyse"]["demande"] is False and r["commentaire_reformule"] is None


def test_modele_eteint_meme_resultat_que_les_regles(modele_eteint):
    regles = moteur.recommander(BRIEF)
    avec = moteur.recommander(BRIEF, llm=True)
    assert avec["llm"]["analyse"]["utilise"] is False
    assert [p["id"] for p in avec["plateau"]] == [p["id"] for p in regles["plateau"]]
    assert avec["brief"] == regles["brief"]
    assert llm.etat()["joignable"] is False


def test_listes_fermees_et_priorite_aux_regles(faux_modele):
    faux_modele.reponse = {
        "analyse": {"notes": ["algue", "note_inventee"], "notes_rejetees": ["musc"], "familles": ["marine", "famille_inventee"],
                    "champs": {"positionnement": "luxe", "cible": "hotellerie", "pays_vente": ["france", "mars"],
                               "format": "valeur_inventee"}},
        "reformulation": {},
    }
    a = moteur.analyser_brief(BRIEF, llm=True)
    ids = [n["id"] for n in a["notes_citees"]]
    assert "algue" in ids and "note_inventee" not in ids
    assert any(n["id"] == "musc" for n in a["notes_rejetees"])
    assert "famille_inventee" not in a["familles_detectees"]
    # « Prix accessible » est entendu par les règles : le modèle ne peut pas le remplacer par « luxe »
    assert a["champs"]["positionnement"]["valeur"] == "accessible"
    assert a["champs"]["cible"] == {"valeur": "hotellerie", "citation": "", "statut": llm.STATUT}
    assert [p["valeur"] for p in a["champs"]["pays_vente"]] == ["france"]
    assert a["champs"]["format"]["valeur"] == "bougie"
    assert a["llm"]["utilise"] is True and "note_inventee" not in json.dumps(a["llm"]["ajouts"])
    assert faux_modele.recus[0]["model"] == llm.AI_MODEL and faux_modele.recus[0]["temperature"] == 0


def test_reformulation_ajoutee_sans_toucher_aux_faits(faux_modele):
    faux_modele.reponse = {"analyse": {}, "reformulation": {"profil": "Votre projet respire l'air du large."}}
    regles = moteur.recommander(BRIEF)
    r = moteur.recommander(BRIEF, llm=True)
    assert r["commentaire_reformule"] == "Votre projet respire l'air du large."
    assert r["commentaire_profil"] == regles["commentaire_profil"]
    assert all(ref["lien_au_projet"] for ref in r["references_proches"])
    assert all("lien_reformule" in ref for ref in r["references_proches"])
    assert r["llm"]["reformulation"]["utilise"] is True


def test_pourquoi_reformule(faux_modele):
    faux_modele.reponse = {"analyse": {}, "reformulation": {"reponse": "La bergamote ouvre votre parfum avec éclat."}}
    r = moteur.expliquer_note("bergamote", "", llm=True)
    assert r["reponse_reformulee"] == "La bergamote ouvre votre parfum avec éclat."
    assert r["reponse"].startswith("Fraîche")


def test_reponse_qui_n_est_pas_du_json(monkeypatch):
    monkeypatch.setattr(llm, "_chat", lambda prompt: None)
    a = moteur.analyser_brief(BRIEF, llm=True)
    assert a["llm"]["utilise"] is False and a["champs"]["format"]["valeur"] == "bougie"
