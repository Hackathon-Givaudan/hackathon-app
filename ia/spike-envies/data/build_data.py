"""Génère les données de travail du service Data/IA :
- referentiel_notes.json / .csv : notre référentiel de notes olfactives
- formules.json : formules existantes (notes + étage + pourcentage)

Données synthétiques mais réalistes, construites à partir de la terminologie
publique (SFP, roue de M. Edwards, IFRA FIG, Good Scents). Voir docs/sources.md.
Relancer : python data/build_data.py
"""
import csv
import json
import unicodedata
from pathlib import Path

HERE = Path(__file__).parent


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_").replace("__", "_")


# famille, facette, étage dominant (tete/coeur/fond), nature, mots-clés d'envie
# nature : naturel = matière première naturelle ; synthese = molécule ; accord = reconstitution
NOTES = [
    # --- Hespéridé (agrumes) ---
    ("Bergamote", "hesperide", "agrume", "tete", "naturel", "frais, pétillant, élégant, thé earl grey, lumineux, propre"),
    ("Citron", "hesperide", "agrume", "tete", "naturel", "zeste, acidulé, frais, été, propre, vivifiant"),
    ("Orange douce", "hesperide", "agrume", "tete", "naturel", "joyeux, solaire, jus d'orange, enfance, gai"),
    ("Mandarine", "hesperide", "agrume", "tete", "naturel", "sucré, juteux, doux, pétillant, Noël"),
    ("Pamplemousse", "hesperide", "agrume", "tete", "naturel", "amer, tonique, énergisant, sport, matin"),
    ("Citron vert", "hesperide", "agrume", "tete", "naturel", "mojito, cocktail, piquant, tropical, frais"),
    ("Yuzu", "hesperide", "agrume", "tete", "naturel", "japon, zen, acidulé, original, pétillant"),
    ("Petitgrain", "hesperide", "agrume vert", "tete", "naturel", "feuille, vert, amer, eau de Cologne, propre"),
    ("Néroli", "floral", "fleur blanche hespéridée", "tete", "naturel", "méditerranée, lumineux, savon, propre, printemps"),
    # --- Aromatique ---
    ("Lavande", "aromatique", "herbe aromatique", "tete", "naturel", "provence, propre, apaisant, linge, calme, barbier"),
    ("Romarin", "aromatique", "herbe aromatique", "tete", "naturel", "garrigue, herbes, cuisine, sud, camphré"),
    ("Menthe", "aromatique", "herbe fraîche", "tete", "naturel", "glacé, fraîcheur, mojito, chewing-gum, été"),
    ("Basilic", "aromatique", "herbe aromatique", "tete", "naturel", "italie, potager, vert, épicé, frais"),
    ("Sauge sclarée", "aromatique", "herbe aromatique", "coeur", "naturel", "herbacé, ambré, masculin, apaisant"),
    ("Thym", "aromatique", "herbe aromatique", "coeur", "naturel", "garrigue, sec, chaud, herbes de provence"),
    ("Armoise", "aromatique", "herbe amère", "coeur", "naturel", "amer, sauvage, herbe sèche, mystérieux"),
    # --- Vert ---
    ("Galbanum", "vert", "vert résineux", "tete", "naturel", "vert intense, tige, feuille écrasée, nature, sauvage"),
    ("Feuille de violette", "vert", "vert feuille", "tete", "naturel", "concombre, frais, feuille, aquatique, vert"),
    ("Herbe coupée", "vert", "vert herbe", "tete", "synthese", "pelouse, printemps, jardin, rosée, nature"),
    ("Thé vert", "vert", "vert thé", "coeur", "accord", "zen, léger, transparent, apaisant, propre"),
    ("Feuille de figuier", "vert", "vert lacté", "coeur", "accord", "méditerranée, vacances, lacté, vert, sud"),
    ("Bambou", "vert", "vert aqueux", "tete", "accord", "zen, aquatique, léger, spa, asie"),
    # --- Floral ---
    ("Rose", "floral", "rose", "coeur", "naturel", "romantique, féminin, classique, bouquet, pétale"),
    ("Jasmin", "floral", "fleur blanche", "coeur", "naturel", "sensuel, nuit d'été, opulent, capiteux, solaire"),
    ("Fleur d'oranger", "floral", "fleur blanche", "coeur", "naturel", "douceur, bébé, mariage, méditerranée, brioche"),
    ("Tubéreuse", "floral", "fleur blanche", "coeur", "naturel", "capiteux, crémeux, glamour, sensuel, intense"),
    ("Ylang-ylang", "floral", "fleur solaire", "coeur", "naturel", "exotique, solaire, crémeux, banane, tropical"),
    ("Iris", "floral", "poudré", "coeur", "naturel", "poudré, rouge à lèvres, chic, élégant, carotte, froid"),
    ("Violette", "floral", "poudré", "coeur", "accord", "bonbon, poudré, rétro, doux, mauve"),
    ("Muguet", "floral", "fleur fraîche", "coeur", "accord", "1er mai, printemps, frais, clochettes, propre"),
    ("Pivoine", "floral", "fleur fraîche", "coeur", "accord", "fraîche, rosée, jeune, printemps, léger"),
    ("Magnolia", "floral", "fleur fraîche", "coeur", "accord", "citronné, crémeux, lumineux, élégant"),
    ("Frangipanier", "floral", "fleur solaire", "coeur", "accord", "tropical, plage, monoï, vacances, île"),
    ("Mimosa", "floral", "fleur poudrée", "coeur", "naturel", "février, soleil d'hiver, poudré, miellé, côte d'azur"),
    ("Gardénia", "floral", "fleur blanche", "coeur", "accord", "crémeux, champignon, vert, fleur blanche, opulent"),
    ("Osmanthus", "floral", "fleur fruitée", "coeur", "naturel", "abricot, cuir, thé, asie, délicat"),
    ("Lilas", "floral", "fleur fraîche", "coeur", "accord", "printemps, jardin, nostalgie, doux, mauve"),
    ("Héliotrope", "floral", "fleur poudrée", "coeur", "accord", "pâte d'amande, poudré, cerise, réconfort, doux"),
    # --- Fruité ---
    ("Pêche", "fruite", "fruit à noyau", "coeur", "accord", "velouté, juteux, été, doux, peau"),
    ("Poire", "fruite", "fruit à pépins", "tete", "accord", "juteux, croquant, frais, gourmand léger"),
    ("Pomme", "fruite", "fruit à pépins", "tete", "accord", "croquant, verger, acidulé, frais, automne"),
    ("Cassis", "fruite", "fruit rouge", "tete", "naturel", "baie, acidulé, vert, bourgeon, mûr"),
    ("Framboise", "fruite", "fruit rouge", "tete", "accord", "baie, sucré, acidulé, gourmand, rose"),
    ("Fruits rouges", "fruite", "fruit rouge", "tete", "accord", "baies, fraise, cerise, gourmand, jeune"),
    ("Figue", "fruite", "fruit lacté", "coeur", "accord", "méditerranée, lacté, mûr, été, sud"),
    ("Noix de coco", "fruite", "fruit lacté", "coeur", "accord", "plage, crème solaire, tropical, lacté, vacances"),
    ("Ananas", "fruite", "fruit exotique", "tete", "accord", "tropical, juteux, cocktail, pétillant, fête"),
    ("Mangue", "fruite", "fruit exotique", "tete", "accord", "tropical, juteux, sucré, exotique, soleil"),
    # --- Épicé ---
    ("Poivre rose", "epice", "épice fraîche", "tete", "naturel", "pétillant, rosé, moderne, piquant léger"),
    ("Poivre noir", "epice", "épice chaude", "tete", "naturel", "piquant, sec, viril, cuisine, électrique"),
    ("Cardamome", "epice", "épice fraîche", "tete", "naturel", "café oriental, chaï, frais épicé, élégant"),
    ("Cannelle", "epice", "épice chaude", "coeur", "naturel", "noël, pain d'épices, chaud, réconfort, hiver"),
    ("Clou de girofle", "epice", "épice chaude", "coeur", "naturel", "vin chaud, piquant, dentiste, chaud, orient"),
    ("Gingembre", "epice", "épice fraîche", "tete", "naturel", "pétillant, tonique, citronné, piquant, énergie"),
    ("Safran", "epice", "épice cuirée", "coeur", "naturel", "luxe, orient, cuir, métallique, précieux"),
    ("Muscade", "epice", "épice chaude", "coeur", "naturel", "chaud, boisé, cuisine, hiver, doux épicé"),
    # --- Gourmand ---
    ("Vanille", "gourmand", "vanillé", "fond", "naturel", "douceur, réconfort, gâteau, sucré, chaleur, crème"),
    ("Fève tonka", "gourmand", "amandé", "fond", "naturel", "amande, foin, caramel, chaleur, réconfort"),
    ("Caramel", "gourmand", "sucré", "fond", "accord", "sucré, bonbon, crème brûlée, gourmand, enfance"),
    ("Praliné", "gourmand", "sucré", "fond", "accord", "noisette, pâtisserie, gourmand, chocolat, doux"),
    ("Café", "gourmand", "torréfié", "coeur", "naturel", "torréfié, matin, energie, amer, expresso"),
    ("Cacao", "gourmand", "torréfié", "fond", "naturel", "chocolat, amer, gourmand, sensuel, poudré"),
    ("Miel", "gourmand", "miellé", "fond", "accord", "doré, chaud, sucré, animal, cire"),
    ("Amande", "gourmand", "amandé", "coeur", "accord", "pâte d'amande, cerise, frangipane, doux, enfance"),
    ("Lait", "gourmand", "lacté", "fond", "accord", "lacté, doux, bébé, crémeux, cocooning"),
    # --- Boisé ---
    ("Cèdre", "boise", "bois sec", "fond", "naturel", "crayon, sec, forêt, droit, élégant, masculin"),
    ("Santal", "boise", "bois crémeux", "fond", "naturel", "crémeux, lacté, doux, méditation, inde, peau"),
    ("Vétiver", "boise", "bois terreux", "fond", "naturel", "terreux, fumé, racine, élégant, chic, vert"),
    ("Patchouli", "boise", "bois terreux", "fond", "naturel", "terreux, hippie, sous-bois, sombre, chocolaté"),
    ("Oud", "boise", "bois animal", "fond", "accord", "intense, orient, luxe, fumé, animal, sombre"),
    ("Gaïac", "boise", "bois fumé", "fond", "naturel", "fumé, feu de bois, doux, rose fumée"),
    ("Cyprès", "boise", "bois résineux", "coeur", "naturel", "toscane, résine, frais boisé, méditerranée"),
    ("Pin", "boise", "bois résineux", "coeur", "naturel", "forêt, sapin, montagne, résine, noël"),
    ("Ambroxan", "boise", "bois ambré", "fond", "synthese", "peau, minéral, salé, moderne, sillage, addictif"),
    ("Cachemire", "boise", "bois musqué", "fond", "synthese", "doux, pull, cocooning, moelleux, peau"),
    # --- Ambré / résineux ---
    ("Ambre", "ambre", "ambré", "fond", "accord", "chaud, orient, sensuel, résineux, soir, hiver"),
    ("Benjoin", "ambre", "baumier", "fond", "naturel", "vanillé, résine, chaud, encens doux, réconfort"),
    ("Labdanum", "ambre", "ambré cuiré", "fond", "naturel", "ambré, cuir, animal, résineux, chaud"),
    ("Encens", "ambre", "résineux", "fond", "naturel", "église, spirituel, fumée, méditation, mystique"),
    ("Myrrhe", "ambre", "résineux", "fond", "naturel", "sacré, amer, résine, mystique, orient"),
    ("Opoponax", "ambre", "baumier", "fond", "naturel", "doux, balsamique, chaud, orient"),
    # --- Musqué / poudré / aldéhydé ---
    ("Musc blanc", "musque", "musc propre", "fond", "synthese", "linge propre, peau, doux, coton, savon"),
    ("Ambrette", "musque", "musc végétal", "fond", "naturel", "peau, poire, musc naturel, sensuel, doux"),
    ("Aldéhydes", "musque", "aldéhydé", "tete", "synthese", "pétillant, champagne, classique, savon, années 50"),
    ("Accord poudré", "musque", "poudré", "fond", "accord", "poudre de riz, maquillage, rétro, doux, talc"),
    # --- Cuir / fumé ---
    ("Cuir", "cuir", "cuir", "fond", "accord", "sac en cuir, voiture, sauvage, intense, élégant"),
    ("Bouleau", "cuir", "cuir fumé", "fond", "naturel", "goudron, fumé, cuir russe, feu"),
    ("Daim", "cuir", "cuir doux", "fond", "accord", "doux, gant, peau, velours, poudré"),
    ("Tabac", "cuir", "tabac", "fond", "accord", "cigare, miel, foin, club, chaud, vieux livres"),
    # --- Marin / aquatique / minéral ---
    ("Accord marin", "marin", "aquatique", "tete", "accord", "mer, océan, vague, embruns, vacances, frais"),
    ("Sel", "marin", "minéral", "coeur", "accord", "peau salée, plage, minéral, été"),
    ("Accord ozonique", "marin", "aérien", "tete", "accord", "air, après la pluie, montagne, propre, aérien"),
    ("Pierre mouillée", "marin", "minéral", "coeur", "accord", "pluie, pierre, minéral, pétrichor, froid"),
    # --- Chypre / mousse ---
    ("Mousse de chêne", "chypre", "mousse", "fond", "naturel", "sous-bois, humide, chic, classique, terreux"),
]

ETAGES_LIB = {"tete": "Note de tête", "coeur": "Note de cœur", "fond": "Note de fond"}


def build_notes():
    out = []
    for nom, famille, facette, etage, nature, mots in NOTES:
        out.append({
            "id": slug(nom),
            "nom": nom,
            "famille": famille,
            "facette": facette,
            "etage": etage,
            "nature": nature,
            "mots_cles_envie": [m.strip() for m in mots.split(",")],
        })
    ids = [n["id"] for n in out]
    assert len(ids) == len(set(ids)), "id de note en double"
    return out


# Formules : nom, description, [(note, poids)] — poids relatifs, normalisés à 100 %
FORMULES = [
    ("Zeste Matinal", "Cologne fraîche et pétillante", [("citron", 20), ("bergamote", 20), ("petitgrain", 10), ("neroli", 15), ("romarin", 10), ("musc_blanc", 25)]),
    ("Riviera", "Hespéridé aromatique méditerranéen", [("bergamote", 20), ("citron", 10), ("basilic", 10), ("feuille_de_figuier", 20), ("cypres", 15), ("cedre", 25)]),
    ("Linge au Soleil", "Musqué propre et lumineux", [("aldehydes", 10), ("bergamote", 10), ("muguet", 15), ("fleur_d_oranger", 15), ("musc_blanc", 35), ("cachemire", 15)]),
    ("Jardin après la Pluie", "Vert aérien", [("galbanum", 10), ("feuille_de_violette", 15), ("herbe_coupee", 15), ("accord_ozonique", 15), ("muguet", 15), ("pierre_mouillee", 10), ("vetiver", 20)]),
    ("Embruns", "Aquatique salé", [("accord_marin", 20), ("citron_vert", 10), ("sel", 15), ("sauge_sclaree", 10), ("ambroxan", 30), ("cedre", 15)]),
    ("Rose Velours", "Floral rose poudré", [("framboise", 10), ("poivre_rose", 10), ("rose", 35), ("iris", 10), ("violette", 10), ("musc_blanc", 15), ("patchouli", 10)]),
    ("Bouquet de Mai", "Floral frais printanier", [("poire", 10), ("muguet", 25), ("pivoine", 20), ("lilas", 15), ("magnolia", 10), ("musc_blanc", 20)]),
    ("Fleur Blanche Nocturne", "Floral blanc opulent", [("mandarine", 10), ("jasmin", 25), ("tubereuse", 25), ("ylang_ylang", 10), ("vanille", 15), ("santal", 15)]),
    ("Île Monoï", "Floral solaire tropical", [("ananas", 10), ("frangipanier", 25), ("noix_de_coco", 20), ("ylang_ylang", 15), ("vanille", 15), ("musc_blanc", 15)]),
    ("Poudre d'Iris", "Floral poudré chic", [("aldehydes", 5), ("iris", 30), ("violette", 15), ("heliotrope", 15), ("accord_poudre", 15), ("cedre", 10), ("musc_blanc", 10)]),
    ("Mimosa d'Hiver", "Floral poudré miellé", [("mandarine", 10), ("mimosa", 30), ("heliotrope", 15), ("miel", 10), ("feve_tonka", 15), ("musc_blanc", 20)]),
    ("Verger d'Été", "Fruité juteux", [("peche", 25), ("poire", 15), ("cassis", 10), ("osmanthus", 15), ("pivoine", 10), ("musc_blanc", 25)]),
    ("Baies Sauvages", "Fruité gourmand", [("fruits_rouges", 25), ("cassis", 15), ("framboise", 15), ("rose", 15), ("vanille", 15), ("patchouli", 15)]),
    ("Tropicalia", "Fruité exotique", [("mangue", 25), ("ananas", 15), ("citron_vert", 15), ("noix_de_coco", 15), ("frangipanier", 10), ("santal", 20)]),
    ("Crème Brûlée", "Gourmand sucré", [("caramel", 25), ("vanille", 25), ("feve_tonka", 15), ("lait", 10), ("amande", 10), ("musc_blanc", 15)]),
    ("Café des Artistes", "Gourmand torréfié", [("cardamome", 10), ("cafe", 30), ("cacao", 15), ("praline", 15), ("vanille", 15), ("patchouli", 15)]),
    ("Cocon", "Gourmand lacté doux", [("lait", 20), ("amande", 15), ("heliotrope", 15), ("vanille", 20), ("cachemire", 15), ("santal", 15)]),
    ("Pain d'Épices", "Ambré épicé hivernal", [("orange_douce", 10), ("cannelle", 20), ("clou_de_girofle", 10), ("muscade", 10), ("miel", 15), ("benjoin", 15), ("vanille", 20)]),
    ("Nuit d'Orient", "Ambré intense", [("safran", 10), ("rose", 15), ("oud", 25), ("ambre", 20), ("encens", 10), ("labdanum", 20)]),
    ("Cathédrale", "Ambré résineux", [("poivre_noir", 10), ("encens", 30), ("myrrhe", 15), ("opoponax", 15), ("cedre", 15), ("gaiac", 15)]),
    ("Ambre Doré", "Ambré doux", [("bergamote", 10), ("benjoin", 20), ("ambre", 25), ("vanille", 20), ("feve_tonka", 10), ("musc_blanc", 15)]),
    ("Forêt Profonde", "Boisé résineux", [("pin", 20), ("cypres", 15), ("poivre_noir", 10), ("cedre", 25), ("mousse_de_chene", 10), ("vetiver", 20)]),
    ("Santal Crémeux", "Boisé lacté", [("cardamome", 10), ("figue", 10), ("santal", 35), ("lait", 10), ("cachemire", 15), ("ambrette", 20)]),
    ("Vétiver Chic", "Boisé terreux", [("pamplemousse", 15), ("poivre_rose", 10), ("vetiver", 35), ("cedre", 15), ("mousse_de_chene", 10), ("musc_blanc", 15)]),
    ("Fougère Barbier", "Fougère aromatique", [("lavande", 30), ("bergamote", 15), ("sauge_sclaree", 10), ("rose", 5), ("feve_tonka", 20), ("mousse_de_chene", 20)]),
    ("Chypre Moderne", "Chypre fruité", [("bergamote", 20), ("cassis", 10), ("rose", 15), ("jasmin", 10), ("patchouli", 25), ("mousse_de_chene", 20)]),
    ("Cuir de Russie", "Cuir fumé", [("safran", 10), ("bouleau", 20), ("cuir", 25), ("labdanum", 15), ("tabac", 10), ("gaiac", 20)]),
    ("Club Tabac", "Cuir tabac miellé", [("cannelle", 10), ("tabac", 30), ("miel", 15), ("feve_tonka", 15), ("daim", 15), ("cedre", 15)]),
    ("Peau Douce", "Musqué peau", [("poire", 5), ("ambrette", 20), ("iris", 10), ("musc_blanc", 30), ("cachemire", 15), ("ambroxan", 20)]),
    ("Zen", "Vert thé apaisant", [("yuzu", 15), ("bambou", 15), ("the_vert", 25), ("muguet", 10), ("cedre", 15), ("musc_blanc", 20)]),
    ("Garrigue", "Aromatique méditerranéen", [("citron", 10), ("thym", 15), ("romarin", 20), ("lavande", 15), ("armoise", 10), ("cypres", 15), ("labdanum", 15)]),
    ("Mojito", "Hespéridé aromatique festif", [("citron_vert", 30), ("menthe", 25), ("gingembre", 10), ("herbe_coupee", 10), ("musc_blanc", 15), ("ambroxan", 10)]),
]


def build_formules(notes):
    by_id = {n["id"]: n for n in notes}
    out = []
    for i, (nom, desc, compo) in enumerate(FORMULES, start=1):
        total = sum(p for _, p in compo)
        lignes = []
        for nid, p in compo:
            if nid not in by_id:
                raise SystemExit(f"Formule {nom}: note inconnue {nid}")
            lignes.append({
                "note_id": nid,
                "etage": by_id[nid]["etage"],
                "pourcentage": round(100 * p / total, 1),
            })
        out.append({"id": f"F{i:03d}", "nom": nom, "description": desc, "notes": lignes})
    return out


def main():
    notes = build_notes()
    formules = build_formules(notes)
    (HERE / "referentiel_notes.json").write_text(json.dumps(notes, ensure_ascii=False, indent=2), encoding="utf-8")
    with open(HERE / "referentiel_notes.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["id", "nom", "famille", "facette", "etage", "nature", "mots_cles_envie"])
        for n in notes:
            w.writerow([n["id"], n["nom"], n["famille"], n["facette"], n["etage"], n["nature"], ", ".join(n["mots_cles_envie"])])
    (HERE / "formules.json").write_text(json.dumps(formules, ensure_ascii=False, indent=2), encoding="utf-8")
    by_id = {n["id"]: n for n in notes}
    with open(HERE / "formules.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["formule_id", "formule_nom", "description", "note_id", "note_nom", "famille", "etage", "pourcentage"])
        for fo in formules:
            for l in fo["notes"]:
                n = by_id[l["note_id"]]
                w.writerow([fo["id"], fo["nom"], fo["description"], n["id"], n["nom"], n["famille"], l["etage"],
                            str(l["pourcentage"]).replace(".", ",")])
    print(f"{len(notes)} notes, {len(formules)} formules générées.")


if __name__ == "__main__":
    main()
