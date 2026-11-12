from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)

def test_referentiel():
    assert c.get("/sante").json()["statut"] == "ok"
    assert len(c.get("/familles").json()) == 9
    assert c.get("/notes").json()["nombre"] == 72
    assert c.get("/notes", params={"famille": "marine"}).json()["nombre"] == 2
    f = c.get("/notes/bergamote").json()
    assert f["origine"].startswith("Calabre") and f["tenue"] == "courte" and f["image"]["licence"]
    assert c.get("/notes/inconnue").status_code == 404
    assert len(c.get("/questions").json()["questions"]) == 5
    assert len(c.get("/ambiances").json()) == 18
    assert c.get("/kit").json()["taille"] == 30

def test_recommandation_bout_en_bout():
    r = c.post("/recommandation", json={"brief": "Bougie iodée pour un restaurant en bord de mer, prix accessible.",
                                         "reponses": ["q1_cote", "q2_vagues"], "engagements": ["vegan"]})
    assert r.status_code == 200
    j = r.json()
    assert j["familles_classees"][0] in ("marine", "iodee")
    assert len(j["plateau"]) == 10 and len(j["pistes"]) == 3
    assert j["analyse"]["champs"]["positionnement"]["valeur"] == "accessible"

def test_validation_entrees():
    assert c.post("/recommandation", json={"engagements": ["bio"]}).status_code == 422
    assert c.post("/variation", json={"dosages": {"xx": 1}, "demande": "plus frais"}).status_code == 422

def test_profil_et_analyse():
    assert c.post("/profil", json={"reponses": ["q4_vanille"]}).json()["classement"][0] == "ambree"
    assert c.post("/analyse-brief", json={"brief": "Une eau de toilette légère"}).json()["champs"]["format"]["valeur"] == "eau_de_toilette"


def test_v3_brief_et_import():
    b = c.post("/brief", json={"brief": "Création d'une bougie, budget 40 € le kilo, 200 kg par an, vente en France."}).json()
    assert b["champs"]["budget_kilo"]["valeur"] == 40 and b["champs"]["volume_annuel"]["valeur"] == 200
    assert b["completude"].endswith("sur 11")
    m = c.get("/modele-brief").json()
    assert len(m["a_completer"]) == 11
    imp = c.post("/brief/import", json={"budget_kilo": "35", "type_projet": "creation", "pays_vente": ["france", "mars"]}).json()
    assert imp["champs"]["budget_kilo"]["valeur"] == 35 and imp["statut"] == "erreur de format"

def test_v3_duels_radar_references_potentiel():
    assert len(c.get("/duels").json()["duels"]) == 5
    p = c.post("/profil", json={"reponses": ["d1_a", "d4_a"], "ajustements": {"marin": 1}}).json()
    assert max(p["radar"], key=p["radar"].get) == "marin" and "commentaire" in p
    r = c.post("/recommandation", json={"brief": "Bougie marine et iodée pour un restaurant en bord de mer.", "domaine": "fragrances"}).json()
    assert len(r["references_proches"]) == 3 and r["references_proches"][0]["lien_au_projet"]
    assert len(r["potentiel"]["criteres"]) == 7
    assert c.post("/potentiel", json={"brief": "Lessive grand public"}).json()["potentiel"]["suggestion"]

def test_v3_domaine_aromes_et_allergenes():
    r = c.post("/recommandation", json={"brief": "Un arôme fruits rouges sans allergènes.", "domaine": "aromes"}).json()
    par = {n["id"]: n for n in c.get("/notes").json()["notes"]}
    assert all(par[p["id"]]["usage"] != "parfum" and not par[p["id"]]["allergenes_principaux"] for p in r["plateau"])
    assert all(x["id"].startswith("REF-A") for x in r["references_proches"])

def test_v3_formule_et_pourquoi():
    f = c.post("/formule", json={"avis": {"embruns": "aime", "bergamote": "aime", "algue": "un_peu", "musc": "pas_pour_moi"}}).json()
    assert f["compris"] and len(f["versions"]) == 2 and "musc" in f["notes_ecartees"]
    q = c.get("/notes/bergamote/pourquoi", params={"brief": "avec de la bergamote"}).json()
    assert "votre brief" in q["sources"]

def test_llm_option_et_repli(monkeypatch):
    from app import llm
    assert c.get("/sante").json()["llm"]["modele"] == llm.AI_MODEL
    assert set(c.get("/llm").json()) >= {"joignable", "modele", "message"}
    monkeypatch.setattr(llm, "_chat", lambda prompt: None)  # modèle muet : on garde les règles
    sans = c.post("/recommandation", json={"brief": "Bougie iodée, prix accessible."}).json()
    avec = c.post("/recommandation", json={"brief": "Bougie iodée, prix accessible.", "llm": True}).json()
    assert avec["llm"]["analyse"]["demande"] is True and avec["llm"]["analyse"]["utilise"] is False
    assert [p["id"] for p in avec["plateau"]] == [p["id"] for p in sans["plateau"]]
    monkeypatch.setattr(llm, "_chat", lambda prompt: {"reponse": "Une note lumineuse pour ouvrir votre parfum."})
    q = c.get("/notes/bergamote/pourquoi", params={"llm": True}).json()
    assert q["reponse_reformulee"] == "Une note lumineuse pour ouvrir votre parfum."
