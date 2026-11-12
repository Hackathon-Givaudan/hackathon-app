from app import moteur

def setup_module():
    moteur.recharger()

def test_contrainte_vegan_retire_le_miel_et_alerte():
    r = moteur.recommander("Savons vegan à la fleur d'oranger avec une note miellée.")
    ids = [p["id"] for p in r["plateau"]]
    assert "miel" not in ids and "ambre_gris" not in ids
    assert any(a["note"] == "miel" for a in r["alertes"])

def test_contrainte_durable_retire_les_vigilances():
    r = moteur.recommander("Bougie résineuse, encens et santal, avec des matières durables.")
    assert not {"encens", "santal", "oud", "cedre", "gaiac"} & {p["id"] for p in r["plateau"]}

def test_format_arome_exclut_les_notes_parfum_seul():
    r = moteur.recommander("Un arôme pour une limonade.")
    par_id = moteur.donnees()["par_id"]
    assert r["format"] == "arome_boisson"
    assert all(par_id[p["id"]]["usage"] != "parfum" for p in r["plateau"])

def test_negation():
    a = moteur.analyser_brief("Une bougie fraîche, pas de vanille.")
    assert [n["id"] for n in a["notes_rejetees"]] == ["vanille"]
    r = moteur.recommander("Une bougie fraîche, pas de vanille.")
    assert "vanille" not in [p["id"] for p in r["plateau"]]

def test_champs_avec_citation():
    a = moteur.analyser_brief("Maison de bougies de luxe. On veut un parfum intense.")
    assert a["champs"]["format"]["valeur"] == "bougie"
    assert a["champs"]["positionnement"]["valeur"] == "luxe"
    assert a["champs"]["intensite"]["valeur"] == "intense"
    assert "luxe" in a["champs"]["positionnement"]["citation"]

def test_roue_somme_100_et_deterministe():
    r1 = moteur.calculer_roue(["q1_cote", "q3_libre"])
    r2 = moteur.calculer_roue(["q1_cote", "q3_libre"])
    assert r1 == r2
    assert abs(sum(r1["roue"].values()) - 100) < 0.5
    assert r1["classement"][0] == "marine"

def test_roue_sans_entree_uniforme():
    r = moteur.calculer_roue([])
    assert len(set(r["roue"].values())) == 1

def test_plateau_10_notes_trois_etages():
    r = moteur.recommander("Parfum floral et boisé.", ["q1_roses", "q4_cedre"])
    assert len(r["plateau"]) == 10
    assert {p["etage"] for p in r["plateau"]} == {"tete", "coeur", "fond"}
    assert len(r["pistes"]) == 3

def test_variation_moins_boise():
    v = moteur.varier({"cedre": 30, "vetiver": 20, "bergamote": 20, "fleur_oranger": 30}, "moins boisé")
    assert v["compris"] and v["profil_apres"]["boise"] < v["profil_avant"]["boise"]
    assert abs(sum(v["dosages"].values()) - 100) < 0.5

def test_variation_inconnue():
    assert not moteur.varier({"cedre": 50}, "plus bleu")["compris"]

def test_kit_30_notes_sans_vigilance():
    k = moteur.kit_atelier()
    par_id = moteur.donnees()["par_id"]
    assert k["taille"] == 30
    assert all(par_id[n["id"]]["durable"] and par_id[n["id"]]["vegan"] for n in k["notes"])
    assert {n["famille"] for n in k["notes"]} == set(moteur.FAMILLES)

def test_parfums_proches_sans_banque():
    assert moteur.parfums_proches({f: 10 for f in moteur.FAMILLES})["disponible"] is False
