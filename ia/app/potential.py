"""Le potentiel d'un brief pour le conseiller : 7 critères, chacun avec sa raison.

Les critères et les décisions viennent d'Ali (équipe Data) et de l'écran Business 05 de la maquette.
Ce sont des règles écrites, sans modèle : on peut les lire et les expliquer. Elles restent une
hypothèse à valider avec Givaudan, et c'est le conseiller qui décide.
"""

import json

from .references import DATA_DIR

RULES = json.loads((DATA_DIR / "criteres_potentiel.json").read_text(encoding="utf-8"))
BRIEF = json.loads((DATA_DIR / "modele_brief.json").read_text(encoding="utf-8"))

# Les valeurs permises de chaque champ du brief, avec leur libellé : « etats_unis » → « États-Unis »
CHOICES = {field["id"]: field["valeurs"] for field in BRIEF["a_completer"] if field.get("valeurs")}
EUROPE = {"france", "union_europeenne"}


def label(field: str, value: str) -> str:
    return CHOICES[field][value]


def evaluate(brief: dict) -> dict:
    """Un brief (champs facultatifs) donne 7 critères et une suggestion de décision."""
    target = brief.get("target")
    countries = brief.get("salesCountries") or []
    volume = brief.get("annualVolumeKg")
    budget = brief.get("budgetPerKg")
    competition = brief.get("competition")
    reference = brief.get("closestReference")
    outside = [country for country in countries if country not in EUROPE]

    found = {}
    if not target:
        found["cible"] = ("a_completer", "Cible non précisée.")
    else:
        status = "favorable" if target in ("grand_public", "hotellerie") else "a_verifier"
        found["cible"] = (status, f"Cible : {label('cible', target).lower()}.")

    if not countries:
        found["pays_vente"] = ("a_completer", "Pays de vente non précisés.")
    elif outside:
        names = ", ".join(label("pays_vente", country) for country in outside)
        found["pays_vente"] = ("a_verifier", f"Règles locales à vérifier : {names}.")
    else:
        found["pays_vente"] = ("favorable", "Vente en France ou dans l'Union européenne.")

    if volume is None:
        found["volume"] = ("a_completer", "Volume non précisé.")
    else:
        found["volume"] = ("a_verifier", f"{volume:.0f} kg par an, à comparer au seuil Givaudan [X].")

    if not competition:
        found["mise_en_concurrence"] = ("a_completer", "Non précisé.")
    else:
        status = "favorable" if competition == "seulement_givaudan" else "a_verifier"
        found["mise_en_concurrence"] = (status, f"{label('mise_en_concurrence', competition)}.")

    # Sans les pays de vente, on ne peut pas juger la réglementation
    checks = [f"vente hors Union européenne ({', '.join(label('pays_vente', c) for c in outside)})"] if outside else []
    if "sans_allergenes" in (brief.get("commitments") or []):
        checks.append("formule sans allergènes à vérifier par le parfumeur")
    if "reglementation" in (brief.get("constraints") or []):
        checks.append("contrainte réglementaire signalée par la marque")
    if checks:
        found["faisabilite_reglementaire"] = ("a_verifier", f"À vérifier : {' ; '.join(checks)}. Contrôle IFRA avant l'échantillon.")
    elif not countries:
        found["faisabilite_reglementaire"] = ("a_completer", "Pays de vente non précisés : réglementation à vérifier.")
    else:
        found["faisabilite_reglementaire"] = ("favorable", "Aucun point bloquant repéré. Contrôle IFRA avant l'échantillon.")

    delays = RULES["delais"]
    if reference:
        found["produits_similaires"] = ("favorable", f"Formule proche dans la banque : {reference} ({delays['banque']}).")
    else:
        found["produits_similaires"] = ("a_verifier", f"Aucune formule proche : sur-mesure ({delays['sur_mesure']}).")

    missing = [name for name, value in (("budget", budget), ("volume", volume)) if value is None]
    if missing:
        found["engagement_client"] = ("a_verifier", f"Non donné : {', '.join(missing)}.")
    else:
        found["engagement_client"] = ("favorable", "Budget et volume donnés.")

    criteria = [
        {"id": item["id"], "label": item["libelle"], "status": found[item["id"]][0], "reason": found[item["id"]][1]}
        for item in RULES["criteres"]
    ]
    favorable = sum(criterion["status"] == "favorable" for criterion in criteria)
    if favorable >= 5:
        suggestion = "prioriser"
    elif reference or favorable > 2:
        suggestion = "orienter_banque"
    else:
        suggestion = "mettre_en_attente"
    return {
        "criteria": criteria,
        "favorable": favorable,
        "suggestion": suggestion,
        "suggestionLabel": RULES["decisions"][suggestion],
        "note": "Hypothèse à valider avec Givaudan : le conseiller décide.",
    }
