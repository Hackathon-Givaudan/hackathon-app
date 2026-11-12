"""Baseline V1 : règles simples, sert de point de comparaison pour le modèle V2.

Ce que fait V1 : noms de notes cités tels quels (sans synonymes ni négation), famille dominante = famille
la plus citée, plateau = notes citées puis notes de la famille dominante dans l'ordre de la base.
Ce que V1 ne fait pas : questions du profil, axes, engagements, format, champs du brief.
"""
from __future__ import annotations

import re
from collections import Counter

from app.moteur import FAMILLES, donnees, _norm


def recommander_v1(brief: str, reponses: list[str] | None = None, **_) -> dict:
    d = donnees()
    t = _norm(brief)
    citees = [n["id"] for n in d["notes"] if re.search(r"\b" + re.escape(_norm(n["nom_fr"].split(" (")[0])) + r"\b", t)]
    comptes = Counter(d["par_id"][c]["famille"] for c in citees)
    for f, mots in d["lexique"]["familles"].items():
        comptes[f] += sum(1 for m in mots if _norm(m) in t) * 0.5
    classement = [f for f, _ in comptes.most_common()] + [f for f in FAMILLES if f not in comptes]
    dominante = classement[0]
    plateau = list(citees)
    for n in d["notes"]:
        if len(plateau) >= 10:
            break
        if n["famille"] == dominante and n["id"] not in plateau:
            plateau.append(n["id"])
    for n in d["notes"]:
        if len(plateau) >= 10:
            break
        if n["id"] not in plateau:
            plateau.append(n["id"])
    total = sum(comptes.values()) or 1
    roue = {f: round(100 * comptes.get(f, 0) / total, 1) for f in FAMILLES}
    pistes = [{"famille_principale": f} for f in classement[:3]]
    return {"version_modele": "1.0-baseline", "roue": roue, "familles_classees": classement,
            "plateau": [{"id": x, "etage": d["par_id"][x]["etage"], "famille": d["par_id"][x]["famille"]} for x in plateau[:10]],
            "pistes": pistes, "analyse": {"champs": {"format": None, "positionnement": None, "intensite": None, "engagements": []}},
            "engagements_appliques": []}
