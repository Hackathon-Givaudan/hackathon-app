"""Spike : le modèle local traduit-il des envies en notes de notre référentiel ?

Sous-commandes :
  run    -> interroge le modèle (Ollama) sur data/envies_test.jsonl, mesure la latence,
            écrit une feuille de jugement CSV pour Yasmina et Brandon.
  score  -> lit la feuille remplie et donne le verdict (seuil 8/10, < 5 s).
  proches -> démo du calcul des formules les plus proches (route /v1/formules/proches).

Exemples :
  python spike/spike_envies.py run --model qwen2.5:7b
  python spike/spike_envies.py run --model qwen2.5:7b --libre     # sans contrainte d'enum
  python spike/spike_envies.py score spike/resultats_qwen2.5_7b.csv
  python spike/spike_envies.py proches citron accord_marin sel

Uniquement la bibliothèque standard Python. Ollama doit tourner (http://localhost:11434).
"""
import argparse
import csv
import json
import math
import statistics
import sys
import time
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DATA = RACINE / "data"
OLLAMA = "http://localhost:11434/api/chat"
SEUIL_JUSTESSE = 0.8
SEUIL_LATENCE_S = 5.0


def charger():
    notes = json.loads((DATA / "referentiel_notes.json").read_text(encoding="utf-8"))
    envies = [json.loads(l) for l in (DATA / "envies_test.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    ids = {n["id"] for n in notes}
    for e in envies:
        inconnues = set(e["notes_attendues"]) - ids
        if inconnues:
            sys.exit(f"{e['id']} : notes attendues hors référentiel {inconnues}")
    return notes, envies


def prompt_systeme(notes):
    lignes = [f"- {n['id']} : {n['nom']} ({n['famille']}, {n['etage']}) — {', '.join(n['mots_cles_envie'][:4])}" for n in notes]
    return (
        "Tu es un parfumeur conseil. Le client décrit une envie en texte libre. "
        "Choisis UNIQUEMENT parmi les notes du référentiel ci-dessous celles qui traduisent le mieux son envie. "
        "Respecte les exclusions exprimées par le client (ex. « pas sucré », « rien de floral »). "
        "Réponds en JSON : {\"notes\": [{\"id\": <id du référentiel>, \"score\": <0..1>, \"justification\": <courte, en français>}]}, "
        "triées de la plus à la moins pertinente.\n\nRéférentiel :\n" + "\n".join(lignes)
    )


def schema_reponse(notes, max_notes, libre, justification=True):
    id_schema = {"type": "string"} if libre else {"type": "string", "enum": [n["id"] for n in notes]}
    return {
        "type": "object",
        "properties": {
            "notes": {
                "type": "array",
                "maxItems": max_notes,
                "items": {
                    "type": "object",
                    "properties": {"id": id_schema, "score": {"type": "number"},
                                   **({"justification": {"type": "string"}} if justification else {})},
                    "required": ["id", "score"] + (["justification"] if justification else []),
                },
            }
        },
        "required": ["notes"],
    }


def appeler(model, systeme, texte, schema, max_notes, timeout=600):
    corps = {
        "model": model,
        "stream": False,
        "format": schema,
        "keep_alive": "30m",
        "options": {"temperature": 0, "seed": 42, "num_ctx": 8192},
        "messages": [
            {"role": "system", "content": systeme},
            {"role": "user", "content": f"Envie du client : « {texte} »\nDonne au plus {max_notes} notes."},
        ],
    }
    req = urllib.request.Request(OLLAMA, data=json.dumps(corps).encode(), headers={"Content-Type": "application/json"})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        rep = json.loads(r.read())
    dt = time.perf_counter() - t0
    return json.loads(rep["message"]["content"]), dt


def baseline_mots_cles(notes, texte, k):
    """Référence naïve sans IA : recouvrement des mots-clés. Sert à mesurer ce que le modèle apporte."""
    t = texte.lower()
    scores = []
    for n in notes:
        s = sum(1 for m in [n["nom"].lower(), *n["mots_cles_envie"]] if m and m.lower() in t)
        if s:
            scores.append((s, n["id"]))
    return [i for _, i in sorted(scores, reverse=True)[:k]]


def cmd_run(a):
    notes, envies = charger()
    par_id = {n["id"]: n for n in notes}
    systeme = prompt_systeme(notes)
    schema = schema_reponse(notes, a.max_notes, a.libre, not a.sans_justification)
    if a.limite_envies:
        envies = envies[: a.limite_envies]

    print(f"Chauffe du modèle {a.model} (non chronométrée)…")
    appeler(a.model, systeme, "un parfum frais", schema, a.max_notes)

    lignes, latences, hors_ref, ok_auto, ok_base, total, total_base = [], [], 0, 0, 0, 0, 0
    for e in envies:
        try:
            rep, dt = appeler(a.model, systeme, e["texte"], schema, a.max_notes)
        except Exception as exc:  # JSON invalide, timeout…
            print(f"{e['id']} ÉCHEC : {exc}")
            lignes.append([e["id"], e["texte"], "", "ECHEC", "", "", str(exc), "", "", "", ""])
            continue
        latences.append(dt)
        vus = []
        for rang, p in enumerate(rep.get("notes", [])[: a.max_notes], start=1):
            nid = p.get("id", "")
            if nid in vus:
                continue
            vus.append(nid)
            dans_ref = nid in par_id
            hors_ref += not dans_ref
            attendu = nid in e["notes_attendues"]
            ok_auto += attendu
            total += 1
            lignes.append([e["id"], e["texte"], rang, nid, par_id[nid]["nom"] if dans_ref else "HORS RÉFÉRENTIEL",
                           p.get("score", ""), p.get("justification", ""), round(dt, 2), "oui" if attendu else "non", "", ""])
        base = baseline_mots_cles(notes, e["texte"], a.max_notes)
        ok_base += len(set(base) & set(e["notes_attendues"]))
        total_base += len(base)
        print(f"{e['id']} {dt:5.2f}s  {', '.join(vus)}")

    nom = a.model.replace(":", "_").replace("/", "_") + ("_libre" if a.libre else "") + ("_court" if a.sans_justification else "")
    sortie = Path(a.out or RACINE / "spike" / f"resultats_{nom}.csv")
    with open(sortie, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["envie_id", "texte", "rang", "note_id", "note_nom", "score_modele", "justification",
                    "latence_s", "dans_attendues", "juste_yasmina (o/n)", "juste_brandon (o/n)"])
        w.writerows(lignes)

    if latences:
        lat = sorted(latences)
        p95 = lat[min(len(lat) - 1, math.ceil(0.95 * len(lat)) - 1)]
        print("\n=== Résumé automatique (à confirmer par Yasmina et Brandon) ===")
        print(f"Modèle               : {a.model}{' (sans enum)' if a.libre else ''}")
        print(f"Latence p50 / p95 / max : {statistics.median(lat):.2f} / {p95:.2f} / {lat[-1]:.2f} s  (seuil {SEUIL_LATENCE_S} s)")
        print(f"Notes hors référentiel : {hors_ref}")
        print(f"Précision vs notes attendues : {ok_auto}/{total} = {ok_auto / max(total, 1):.0%}")
        print(f"Baseline mots-clés      : {ok_base}/{total_base} = {ok_base / max(total_base, 1):.0%}")
        print(f"Feuille de jugement     : {sortie}")


def cmd_score(a):
    with open(a.fichier, encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f, delimiter=";") if r["note_id"] and r["note_id"] != "ECHEC"]
    juges = {"Yasmina": "juste_yasmina (o/n)", "Brandon": "juste_brandon (o/n)"}
    res = {}
    for nom, col in juges.items():
        notes = [r[col].strip().lower() for r in rows if r[col].strip()]
        if not notes:
            print(f"{nom} : pas encore de jugement.")
            continue
        res[nom] = sum(v.startswith("o") for v in notes) / len(notes)
        print(f"{nom} : {res[nom]:.0%} de notes justes ({len(notes)} jugées)")
    accord = [r for r in rows if r[juges["Yasmina"]].strip() and r[juges["Brandon"]].strip()]
    if accord:
        deux = sum(r[juges["Yasmina"]].lower().startswith("o") and r[juges["Brandon"]].lower().startswith("o") for r in accord) / len(accord)
        concord = sum(r[juges["Yasmina"]].lower()[:1] == r[juges["Brandon"]].lower()[:1] for r in accord) / len(accord)
        print(f"Justes pour les deux : {deux:.0%} — accord entre juges : {concord:.0%}")
        res["les deux"] = deux
    lat = sorted({(r["envie_id"], float(r["latence_s"])) for r in rows if r["latence_s"]}, key=lambda x: x[1])
    lat_ok = lat and lat[min(len(lat) - 1, math.ceil(0.95 * len(lat)) - 1)][1] < SEUIL_LATENCE_S
    if "les deux" in res:
        ok = res["les deux"] >= SEUIL_JUSTESSE and lat_ok
        print(f"\nVERDICT : {'GO' if ok else 'NO-GO'} (seuil {SEUIL_JUSTESSE:.0%} justes pour les deux juges, p95 < {SEUIL_LATENCE_S} s)")


def cmd_fusion(a):
    """Regroupe les feuilles renvoyées par Yasmina et Brandon dans la feuille de résultats."""
    def lire(p):
        with open(p, encoding="utf-8-sig") as f:
            return {(r["envie_id"], r["note_id"]): r["juste (o/n)"].strip() for r in csv.DictReader(f, delimiter=";")}
    y, b = lire(a.yasmina), lire(a.brandon)
    with open(a.resultats, encoding="utf-8-sig") as f:
        lecteur = csv.DictReader(f, delimiter=";")
        champs, rows = lecteur.fieldnames, list(lecteur)
    for r in rows:
        cle = (r["envie_id"], r["note_id"])
        r["juste_yasmina (o/n)"] = y.get(cle, "")
        r["juste_brandon (o/n)"] = b.get(cle, "")
    sortie = a.out or a.resultats.replace(".csv", "_juge.csv")
    with open(sortie, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=champs, delimiter=";")
        w.writeheader()
        w.writerows(rows)
    print(f"Feuille fusionnée : {sortie}\n")
    a.fichier = sortie
    cmd_score(a)


def proches(notes_validees, formules, limite=3):
    """Similarité cosinus entre notes validées (poids) et formules (pourcentages)."""
    q = notes_validees
    nq = math.sqrt(sum(v * v for v in q.values()))
    out = []
    for f in formules:
        v = {l["note_id"]: l["pourcentage"] for l in f["notes"]}
        nv = math.sqrt(sum(x * x for x in v.values()))
        sim = sum(q[k] * v.get(k, 0) for k in q) / (nq * nv) if nq and nv else 0
        out.append({"formule": f["id"], "nom": f["nom"], "similarite": round(sim, 3),
                    "notes_communes": sorted(set(q) & set(v)), "notes_manquantes": sorted(set(q) - set(v))})
    return sorted(out, key=lambda x: -x["similarite"])[:limite]


def cmd_proches(a):
    notes, _ = charger()
    ids = {n["id"] for n in notes}
    inconnues = set(a.notes) - ids
    if inconnues:
        sys.exit(f"NOTE_INCONNUE : {sorted(inconnues)}")
    formules = json.loads((DATA / "formules.json").read_text(encoding="utf-8"))
    print(json.dumps(proches({n: 1.0 for n in a.notes}, formules, a.limite), ensure_ascii=False, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("run")
    r.add_argument("--model", default="qwen2.5:7b")
    r.add_argument("--max-notes", type=int, default=5)
    r.add_argument("--libre", action="store_true", help="ne pas contraindre les id par enum (mesure les hallucinations)")
    r.add_argument("--sans-justification", action="store_true", help="sortie plus courte, donc plus rapide")
    r.add_argument("--limite-envies", type=int, help="ne traiter que les N premières envies")
    r.add_argument("--out")
    r.set_defaults(f=cmd_run)
    s = sp.add_parser("score")
    s.add_argument("fichier")
    s.set_defaults(f=cmd_score)
    fu = sp.add_parser("fusion", help="regroupe les feuilles de Yasmina et Brandon puis donne le verdict")
    fu.add_argument("yasmina")
    fu.add_argument("brandon")
    fu.add_argument("--resultats", default=str(RACINE / "spike" / "resultats_qwen2.5_7b_court.csv"))
    fu.add_argument("--out")
    fu.set_defaults(f=cmd_fusion)
    c = sp.add_parser("proches")
    c.add_argument("notes", nargs="+")
    c.add_argument("--limite", type=int, default=3)
    c.set_defaults(f=cmd_proches)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
