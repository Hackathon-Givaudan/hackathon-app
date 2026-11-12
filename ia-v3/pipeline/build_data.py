"""Pipeline de préparation des données Data G11 (V2).

Lit data/sources/, nettoie et valide, puis écrit data/processed/ et un rapport qualité.
Usage : python pipeline/build_data.py
Sort avec un code d'erreur si une règle bloquante échoue.
"""
from __future__ import annotations

import csv
import json
import sys
import unicodedata
from collections import Counter
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
SRC = RACINE / "data" / "sources"
OUT = RACINE / "data" / "processed"

FAMILLES = ["hesperidee", "aromatique", "verte", "marine", "iodee", "boisee", "ambree", "musquee", "florale"]
ETAGES = {"tete": "courte", "coeur": "moyenne", "fond": "longue"}
USAGES = {"parfum", "arome", "les_deux"}
AXES = ["fraicheur", "chaleur", "douceur", "boise", "intensite"]
LICENCES = {"Public domain", "CC0", "CC BY 2.0", "CC BY 2.5", "CC BY 3.0", "CC BY 4.0",
            "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0", "CC BY 3.0 us", "CC BY-SA 3.0 au"}
STATUT_AXES = "estimation équipe Data, à faire valider par une personne externe"


def lire(nom: str):
    return json.loads((SRC / nom).read_text(encoding="utf-8"))


def propre(valeur):
    """Normalise les textes (Unicode NFC, espaces) récursivement."""
    if isinstance(valeur, str):
        return " ".join(unicodedata.normalize("NFC", valeur).split())
    if isinstance(valeur, list):
        return [propre(v) for v in valeur]
    if isinstance(valeur, dict):
        return {k: propre(v) for k, v in valeur.items()}
    return valeur


class Rapport:
    def __init__(self):
        self.bloquants: list[str] = []
        self.avertissements: list[str] = []

    def exiger(self, condition: bool, message: str):
        if not condition:
            self.bloquants.append(message)

    def signaler(self, condition: bool, message: str):
        if not condition:
            self.avertissements.append(message)


def statut_origine(e: dict) -> str:
    cles, conf = e.get("origine_cles", []), e.get("origine_confirmee_par_source", [])
    if not cles:
        return "accord ou synthèse : pas d'origine géographique"
    if set(conf) >= set(cles):
        return "confirmée par la source"
    return "confirmée en partie : lieux retrouvés dans la source : " + ", ".join(conf)


def construire() -> dict:
    r = Rapport()
    base = propre(lire("notes_base.json"))
    enr = propre(lire("enrichissement_v2.json"))
    fams = propre(lire("familles_v2.json"))
    med = propre(lire("medias.json"))
    ambs = propre(lire("ambiances.json"))
    questions = propre(lire("questions_profil.json"))
    lexique = propre(lire("lexique.json"))
    allergenes = propre(lire("allergenes.json"))
    references = propre(lire("banque_references_fictive.json"))
    duels = propre(lire("duels_v3.json"))
    radar = propre(lire("radar_v3.json"))
    modele_brief = propre(lire("modele_brief.json"))
    criteres = propre(lire("criteres_potentiel.json"))

    fam_par_id = {f["id"]: f for f in fams}
    r.exiger(sorted(fam_par_id) == sorted(FAMILLES), "les familles ne correspondent pas aux 9 familles de la V2")

    # ---- notes
    ids = [n["id"].strip().lower() for n in base]
    r.exiger(len(ids) == len(set(ids)), f"identifiants de notes en double : {[k for k, v in Counter(ids).items() if v > 1]}")
    ambiances_par_note: dict[str, list[str]] = {}
    for a in ambs:
        for nid in a["notes"]:
            ambiances_par_note.setdefault(nid, []).append(a["id"])

    notes = []
    for n in base:
        nid = n["id"]
        e = enr.get(nid)
        r.exiger(e is not None, f"{nid} : pas d'enrichissement V2")
        if e is None:
            continue
        img = med["images_notes"].get(nid)
        r.exiger(img is not None, f"{nid} : pas d'image")
        r.exiger(e["famille"] in FAMILLES, f"{nid} : famille inconnue {e['famille']}")
        r.exiger(n["etage"] in ETAGES, f"{nid} : étage inconnu {n['etage']}")
        r.exiger(n["usage"] in USAGES, f"{nid} : usage inconnu {n['usage']}")
        for a in AXES:
            r.exiger(isinstance(n[a], int) and 0 <= n[a] <= 5, f"{nid} : axe {a} hors de 0..5")
        r.exiger(n["source"].startswith("https://") and bool(n["date_source"]), f"{nid} : source ou date manquante")
        for acc in e["accords"]:
            r.exiger(acc in ids and acc != nid, f"{nid} : accord invalide {acc}")
        if img:
            r.exiger(img["licence"] in LICENCES, f"{nid} : licence d'image non libre ({img['licence']})")
            r.signaler(bool(img["auteur"]) and not img["auteur"].startswith("voir"), f"{nid} : auteur de l'image à compléter")
        r.signaler(nid in ambiances_par_note, f"{nid} : aucune ambiance liée")
        fam = fam_par_id[e["famille"]]
        notes.append({
            "id": nid, "nom_fr": n["nom_fr"], "nom_en": n["nom_en"],
            "famille": e["famille"], "famille_nom": fam["nom"], "facette": e["facette"],
            "couleur_token": fam["token"], "couleur": fam["couleur"],
            "etage": n["etage"], "tenue": ETAGES[n["etage"]], "tenue_statut": "déduite de l'étage",
            "usage": n["usage"], "descripteurs": n["descripteurs"],
            **{a: n[a] for a in AXES}, "statut_axes": STATUT_AXES,
            "description_client": e["description_client"], "matiere": n["matiere"],
            "origine": e["origine"], "origine_statut": statut_origine(e), "source_origine": e["source_origine"],
            "obtention": e["obtention"], "source_obtention": e["source_obtention"],
            "accords": e["accords"], "statut_accords": e["statut_accords"],
            "naturel": e["naturel"], "vegan": e["vegan"], "durable": e["vigilance"] == "",
            "vigilance": e["vigilance"], "source_vigilance": e["source_vigilance"],
            "allergenes_principaux": allergenes["allergenes_par_note"].get(nid, []),
            "image": img, "ambiances": ambiances_par_note.get(nid, []),
            "famille_v1": n.get("famille_v1"),
            "source": n["source"], "source_titre": n["source_titre"], "date_source": n["date_source"],
        })

    # ---- familles enrichies
    compte = Counter(n["famille"] for n in notes)
    familles = []
    for f in fams:
        img = med["images_familles"].get(f["image"])
        r.exiger(img is not None, f"famille {f['id']} : image manquante")
        r.signaler(compte[f["id"]] >= 3, f"famille {f['id']} : seulement {compte[f['id']]} note(s)")
        familles.append({**f, "image": img, "nombre_notes": compte[f["id"]],
                         "notes": [n["id"] for n in notes if n["famille"] == f["id"]]})

    # ---- ambiances
    par_id = {n["id"]: n for n in notes}
    ambiances = []
    for a in ambs:
        for nid in a["notes"]:
            r.exiger(nid in par_id, f"ambiance {a['id']} : note inconnue {nid}")
        img = med["images_ambiances"].get(a["image"])
        son = med["sons_ambiances"].get(a["son"])
        r.exiger(img is not None and son is not None, f"ambiance {a['id']} : image ou son manquant")
        if son:
            r.exiger(son["licence"] in LICENCES, f"ambiance {a['id']} : licence du son non libre")
        fam_amb = Counter(par_id[nid]["famille"] for nid in a["notes"] if nid in par_id)
        ambiances.append({**a, "familles": [f for f, _ in fam_amb.most_common()], "image": img, "son": son})

    # ---- questions
    for q in questions["questions"]:
        for o in q["options"]:
            for f in o["poids"]:
                r.exiger(f in FAMILLES, f"option {o['id']} : famille inconnue {f}")
            m = o.get("media")
            if m:
                ok = (m["type"] == "image_ambiance" and m["cle"] in med["images_ambiances"]) or \
                     (m["type"] == "son_ambiance" and m["cle"] in med["sons_ambiances"]) or \
                     (m["type"] == "image_note" and m["cle"] in par_id)
                r.exiger(ok, f"option {o['id']} : média introuvable {m}")
    couverture_q = Counter(f for q in questions["questions"] for o in q["options"] for f in o["poids"])
    for f in FAMILLES:
        r.signaler(couverture_q[f] >= 3, f"famille {f} : peu présente dans les questions ({couverture_q[f]})")

    # ---- lexique
    for f in lexique["familles"]:
        r.exiger(f in FAMILLES, f"lexique : famille inconnue {f}")
    for mot, nid in lexique["synonymes_notes"].items():
        r.exiger(nid in par_id, f"lexique : synonyme {mot} vers note inconnue {nid}")

    # ---- V3 : allergènes, radar, duels, banque de références
    for nid in allergenes["allergenes_par_note"]:
        r.exiger(nid in par_id, f"allergènes : note inconnue {nid}")
    for f in fams:
        r.exiger(f.get("axe_radar") in {a["id"] for a in radar["axes"]}, f"famille {f['id']} : axe radar manquant")
    for dl in duels["duels"]:
        r.exiger(len(dl["options"]) == 2, f"duel {dl['id']} : il faut 2 options")
        for o in dl["options"]:
            r.exiger(o["image"] in med["images_ambiances"] or o["image"] in med["images_familles"], f"option {o['id']} : image introuvable")
            r.exiger(o["son"] in med["sons_ambiances"], f"option {o['id']} : son introuvable")
            for f in o["poids"]:
                r.exiger(f in FAMILLES, f"option {o['id']} : famille inconnue {f}")
    ids_ref = [x["id"] for x in references]
    r.exiger(len(ids_ref) == len(set(ids_ref)), "banque de références : identifiants en double")
    refs = []
    for ref in references:
        toutes = [n for e in ("tete", "coeur", "fond") for n in ref["notes"][e]]
        for nid in toutes:
            r.exiger(nid in par_id, f"référence {ref['id']} : note inconnue {nid}")
            if ref["domaine"] == "aromes" and nid in par_id:
                r.exiger(par_id[nid]["usage"] != "parfum", f"référence {ref['id']} : {nid} est réservée à la parfumerie")
        r.exiger(ref["ambiance"] in {a["id"] for a in ambs}, f"référence {ref['id']} : ambiance inconnue")
        fam_ref = Counter(par_id[n]["famille"] for n in toutes if n in par_id)
        refs.append({**ref, "familles": dict(fam_ref), "famille_principale": fam_ref.most_common(1)[0][0] if fam_ref else None,
                     "vegan": all(par_id[n]["vegan"] for n in toutes if n in par_id),
                     "naturel": all(par_id[n]["naturel"] for n in toutes if n in par_id),
                     "durable": all(par_id[n]["durable"] for n in toutes if n in par_id),
                     "allergenes_connus": sorted({a for n in toutes if n in par_id for a in par_id[n]["allergenes_principaux"]})})

    OUT.mkdir(parents=True, exist_ok=True)
    ecrire_json("banque_references.json", refs)
    ecrire_json("duels.json", duels)
    ecrire_json("radar.json", radar)
    ecrire_json("modele_brief.json", modele_brief)
    ecrire_json("criteres_potentiel.json", criteres)
    ecrire_json("notes.json", {"version": "2.0", "nombre": len(notes), "notes": notes})
    ecrire_json("familles.json", familles)
    ecrire_json("ambiances.json", ambiances)
    ecrire_json("questions.json", questions)
    ecrire_json("lexique.json", lexique)
    ecrire_csv(notes)

    rapport = {
        "notes": len(notes), "familles": len(familles), "ambiances": len(ambiances),
        "notes_par_famille": dict(compte), "notes_par_etage": dict(Counter(n["etage"] for n in notes)),
        "notes_naturelles": sum(n["naturel"] for n in notes), "notes_non_vegan": [n["id"] for n in notes if not n["vegan"]],
        "notes_avec_vigilance": [n["id"] for n in notes if n["vigilance"]],
        "notes_avec_allergenes_connus": len([n for n in notes if n["allergenes_principaux"]]),
        "references_fictives": len(refs), "duels": len(duels["duels"]),
        "origines": dict(Counter(n["origine_statut"].split(" :")[0] for n in notes)),
        "bloquants": r.bloquants, "avertissements": r.avertissements,
    }
    ecrire_json("rapport_qualite.json", rapport)
    return rapport


def ecrire_json(nom: str, data):
    (OUT / nom).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def ecrire_csv(notes: list[dict]):
    cols = ["id", "nom_fr", "nom_en", "famille", "facette", "couleur_token", "etage", "tenue", "usage", "descripteurs",
            *AXES, "description_client", "matiere", "origine", "origine_statut", "source_origine", "obtention",
            "accords", "naturel", "vegan", "durable", "vigilance", "source_vigilance", "allergenes_principaux", "image_url", "image_auteur",
            "image_licence", "ambiances", "source", "date_source"]
    with (OUT / "notes.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for n in notes:
            w.writerow({**{c: n.get(c, "") for c in cols},
                        "descripteurs": "|".join(n["descripteurs"]), "accords": "|".join(n["accords"]), "allergenes_principaux": "|".join(n["allergenes_principaux"]),
                        "ambiances": "|".join(n["ambiances"]), "image_url": n["image"]["url_image"],
                        "image_auteur": n["image"]["auteur"], "image_licence": n["image"]["licence"]})


if __name__ == "__main__":
    rap = construire()
    print(json.dumps({k: v for k, v in rap.items() if k not in ("avertissements",)}, ensure_ascii=False, indent=1))
    print(f"{len(rap['avertissements'])} avertissement(s)")
    for a in rap["avertissements"]:
        print("  -", a)
    if rap["bloquants"]:
        print("ERREUR : règles bloquantes non respectées")
        sys.exit(1)
    # étape 2 : produits dérivés calculés par le moteur (kit atelier)
    sys.path.insert(0, str(RACINE))
    from app import moteur  # noqa: E402
    moteur.recharger()
    ecrire_json("kit_atelier.json", moteur.kit_atelier())
    print("kit_atelier.json écrit")
