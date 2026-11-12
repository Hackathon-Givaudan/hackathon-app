"""Évaluation du modèle sur les 30 cas de référence, et comparaison V1 / V2.

Usage :
  python evaluation/evaluate.py                       # V1 et V2 en local (sans serveur)
  python evaluation/evaluate.py http://localhost:8000 # V2 via l'API qui tourne (mesure aussi le réseau)
Écrit evaluation/resultats.json et evaluation/resultats.md.
"""
from __future__ import annotations

import hashlib
import json
import math
import statistics
import sys
import time
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RACINE))

from app import moteur  # noqa: E402
from app.baseline_v1 import recommander_v1  # noqa: E402

FICHIER_CAS = RACINE / "evaluation" / "cas_reference.json"
FICHIER_CAS_V3 = RACINE / "evaluation" / "cas_reference_v3.json"
CHAMPS_V3 = ["domaine", "format", "budget_kilo", "volume_annuel", "pays_vente", "mise_en_concurrence", "relation",
             "type_projet", "cible", "objectif", "contraintes", "engagements"]
SEUIL_CHAMPS_V3 = 0.80
SEUIL_REFERENCES = 0.70
SEUILS = {  # fixés avant la première exécution (voir docs/protocole_validation.md)
    "famille_dominante_exacte": 0.60,
    "famille_dominante_top3": 0.85,
    "rappel_notes_plateau": 0.50,
    "bonne_direction_3_pistes": 0.85,
    "respect_contraintes": 1.00,
    "champ_format": 0.80,
    "champ_positionnement": 0.80,
    "champ_intensite": 0.80,
    "champ_engagements": 0.80,
}
SEUIL_LATENCE_MS = 5000


def appel_api(url: str):
    def f(brief, reponses):
        corps = json.dumps({"brief": brief, "reponses": reponses}).encode()
        req = urllib.request.Request(url.rstrip("/") + "/recommandation", data=corps,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    return f


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return (round(max(0, c - m), 3), round(min(1, c + m), 3))


def viole(note: dict, engagements: list[str]) -> bool:
    return ("vegan" in engagements and not note["vegan"]) or ("naturel" in engagements and not note["naturel"]) or \
           ("matieres_durables" in engagements and not note["durable"])


def evaluer(recommander, nom: str) -> dict:
    d = moteur.donnees()
    cas = json.loads(FICHIER_CAS.read_text(encoding="utf-8"))["cas"]
    lignes, durees = [], []
    for c in cas:
        a = c["attendu"]
        t0 = time.perf_counter()
        r = recommander(c["brief"], c["reponses"])
        durees.append((time.perf_counter() - t0) * 1000)
        classement = r["familles_classees"]
        plateau = [p["id"] for p in r["plateau"]]
        champs = r["analyse"]["champs"]
        val = lambda ch: (champs.get(ch) or {}).get("valeur") if isinstance(champs.get(ch), dict) else None  # noqa: E731
        eng_detectes = sorted(e["valeur"] for e in (champs.get("engagements") or []))
        lignes.append({
            "id": c["id"],
            "famille_attendue": a["famille_dominante"], "famille_predite": classement[0],
            "famille_dominante_exacte": classement[0] == a["famille_dominante"],
            "famille_dominante_top3": a["famille_dominante"] in classement[:3],
            "rappel_notes_plateau": len(set(a["notes"]) & set(plateau)) / len(a["notes"]),
            "notes_manquantes": sorted(set(a["notes"]) - set(plateau)),
            "bonne_direction_3_pistes": a["famille_dominante"] in [p["famille_principale"] for p in r["pistes"]],
            "respect_contraintes": not any(viole(d["par_id"][x], a["engagements"]) for x in plateau),
            "champ_format": val("format") == a["format"],
            "champ_positionnement": val("positionnement") == a["positionnement"],
            "champ_intensite": val("intensite") == a["intensite"],
            "champ_engagements": eng_detectes == sorted(a["engagements"]),
        })
    n = len(lignes)
    metriques = {}
    for m in SEUILS:
        vals = [float(l[m]) for l in lignes]
        moy = sum(vals) / n
        k = sum(1 for v in vals if v == 1.0) if m != "rappel_notes_plateau" else None
        metriques[m] = {"valeur": round(moy, 3), "seuil": SEUILS[m], "atteint": moy >= SEUILS[m],
                        "ic95": wilson(k, n) if k is not None else None}
    durees_tri = sorted(durees)
    latence = {"mediane_ms": round(statistics.median(durees), 2), "p95_ms": round(durees_tri[int(0.95 * (n - 1))], 2),
               "seuil_ms": SEUIL_LATENCE_MS}
    latence["atteint"] = latence["p95_ms"] < SEUIL_LATENCE_MS
    return {"modele": nom, "cas": n, "metriques": metriques, "latence": latence, "detail": lignes}


def evaluer_v3(recommander) -> dict:
    """Champs du brief V3 et « bonne référence dans les 3 propositions » (banque fictive)."""
    from math import comb
    d = moteur.donnees()
    cas = json.loads(FICHIER_CAS_V3.read_text(encoding="utf-8"))["cas"]
    lignes = []
    for c in cas:
        a = c["attendu"]
        r = recommander(c["brief"], [])
        ch = r["analyse"]["champs"]
        detail = {"id": c["id"]}
        for champ in CHAMPS_V3:
            v = ch.get(champ)
            if isinstance(v, list):
                predit = sorted(x["valeur"] for x in v)
                ok = predit == sorted(a[champ])
            else:
                predit = v["valeur"] if isinstance(v, dict) else None
                ok = predit == a[champ] or (isinstance(predit, float) and a[champ] is not None and abs(predit - a[champ]) < 1e-6)
            detail[champ] = ok
            if not ok:
                detail.setdefault("erreurs", []).append(f"{champ} : attendu {a[champ]}, obtenu {predit}")
        refs = [x["id"] for x in r.get("references_proches", [])]
        detail["bonne_reference_top3"] = bool(set(refs) & set(a["references"]))
        detail["references_proposees"] = refs
        dom = a["domaine"]
        n = len([x for x in d["references"] if x["domaine"] == dom])
        bons = len(a["references"])
        detail["hasard_top3"] = 1 - comb(n - bons, 3) / comb(n, 3)
        lignes.append(detail)
    n = len(lignes)
    champs = {ch: round(sum(l[ch] for l in lignes) / n, 3) for ch in CHAMPS_V3}
    return {"cas": n, "empreinte_cas": hashlib.sha256(FICHIER_CAS_V3.read_bytes()).hexdigest()[:16],
            "champs": champs, "champs_moyenne": round(sum(champs.values()) / len(champs), 3),
            "bonne_reference_top3": round(sum(l["bonne_reference_top3"] for l in lignes) / n, 3),
            "bonne_reference_top3_ic95": wilson(sum(l["bonne_reference_top3"] for l in lignes), n),
            "hasard_top3": round(sum(l["hasard_top3"] for l in lignes) / n, 3), "detail": lignes}


def rapport_v3_md(v3: dict) -> str:
    l = ["", "## Cas V3 : champs du brief et 3 références proches", "",
         f"Cas : `evaluation/cas_reference_v3.json` (empreinte `{v3['empreinte_cas']}`), 10 cas.", "",
         "| Champ | Exact |", "|---|---|"]
    for ch, v in v3["champs"].items():
        l.append(f"| {ch} | {v:.0%} |")
    l += [f"| **Moyenne** (seuil {SEUIL_CHAMPS_V3:.0%}) | **{v3['champs_moyenne']:.0%}** |", "",
          f"Bonne référence dans les 3 propositions : **{v3['bonne_reference_top3']:.0%}** "
          f"(IC95 {v3['bonne_reference_top3_ic95'][0]:.0%} à {v3['bonne_reference_top3_ic95'][1]:.0%}, seuil {SEUIL_REFERENCES:.0%}) ; "
          f"3 références tirées au hasard : {v3['hasard_top3']:.0%}.", ""]
    err = [f"- {x['id']} : " + " ; ".join(x.get("erreurs", [])) + ("" if x["bonne_reference_top3"] else f" ; références proposées {x['references_proposees']}")
           for x in v3["detail"] if x.get("erreurs") or not x["bonne_reference_top3"]]
    if err:
        l += ["Erreurs :", ""] + err
    return "\n".join(l) + "\n"


def rapport_md(res: list[dict], empreinte: str) -> str:
    noms = {"famille_dominante_exacte": "Famille dominante exacte", "famille_dominante_top3": "Famille attendue dans le top 3 de la roue",
            "rappel_notes_plateau": "Notes attendues retrouvées dans le plateau de 10", "bonne_direction_3_pistes": "Bonne famille dans les 3 pistes",
            "respect_contraintes": "Plateaux sans note interdite (vegan, naturel, durable)", "champ_format": "Champ format exact",
            "champ_positionnement": "Champ positionnement exact", "champ_intensite": "Champ intensité exact", "champ_engagements": "Champ engagements exact"}
    l = ["# Résultats sur les 30 cas de référence", "",
         f"Cas : `evaluation/cas_reference.json` (empreinte SHA-256 `{empreinte}`). Date : {time.strftime('%d/%m/%Y %H:%M')}.", "",
         "| Métrique | Seuil | " + " | ".join(r["modele"] for r in res) + " |", "|---|---|" + "---|" * len(res)]
    for m in SEUILS:
        cellules = []
        for r in res:
            x = r["metriques"][m]
            ic = f" (IC95 {x['ic95'][0]:.0%} à {x['ic95'][1]:.0%})" if x["ic95"] else ""
            cellules.append(f"{x['valeur']:.0%}{ic} {'OK' if x['atteint'] else 'non atteint'}")
        l.append(f"| {noms[m]} | {SEUILS[m]:.0%} | " + " | ".join(cellules) + " |")
    l.append("| Latence p95 (ms) | < 5000 | " + " | ".join(f"{r['latence']['p95_ms']} (médiane {r['latence']['mediane_ms']})" for r in res) + " |")
    v2 = res[-1]
    l += ["", f"## Détail {v2['modele']} : cas en échec", "", "| Cas | Famille attendue | Famille prédite | Notes manquantes | Champs faux |", "|---|---|---|---|---|"]
    for x in v2["detail"]:
        faux = [k.replace("champ_", "") for k in x if k.startswith("champ_") and not x[k]]
        if not x["famille_dominante_exacte"] or x["notes_manquantes"] or faux or not x["respect_contraintes"]:
            l.append(f"| {x['id']} | {x['famille_attendue']} | {x['famille_predite']} | {', '.join(x['notes_manquantes']) or '-'} | {', '.join(faux) or '-'} |")
    return "\n".join(l) + "\n"


def main():
    empreinte = hashlib.sha256(FICHIER_CAS.read_bytes()).hexdigest()[:16]
    res = [evaluer(recommander_v1, "V1 baseline (règles simples)")]
    if len(sys.argv) > 1:
        res.append(evaluer(appel_api(sys.argv[1]), f"V2 via API ({sys.argv[1]})"))
    else:
        res.append(evaluer(lambda b, r: moteur.recommander(b, r), f"Modèle {moteur.VERSION}"))
    if len(sys.argv) > 1:
        v3 = evaluer_v3(appel_api(sys.argv[1]))
    else:
        v3 = evaluer_v3(lambda b, r: moteur.recommander(b, r))
    sortie = {"empreinte_cas": empreinte, "resultats": res, "v3": v3}
    (RACINE / "evaluation" / "resultats.json").write_text(json.dumps(sortie, ensure_ascii=False, indent=2), encoding="utf-8")
    md = rapport_md(res, empreinte) + rapport_v3_md(v3)
    (RACINE / "evaluation" / "resultats.md").write_text(md, encoding="utf-8")
    print(md)


if __name__ == "__main__":
    main()
