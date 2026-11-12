"""Modèle V3 du service Data/IA : brief et réponses du profil vers brief structuré, roue, plateau, références et potentiel.

Le modèle combine :
  1. une analyse du brief par lexique (notes citées, familles, champs du brief avec leur citation) ;
  2. les poids des duels et des questions du profil ;
  3. une sélection de notes sous contraintes (engagements, format, étages, diversité des familles).
Par défaut, tout est déterministe : la même entrée donne toujours la même sortie, en quelques millisecondes.

Option `llm=True` (voir app/llm.py) : Mistral via Ollama (ADR 0008) complète l'analyse du brief dans des listes
fermées et reformule les explications d'Aurore. Les règles restent prioritaires, et sans réponse du modèle
on garde le résultat des règles. L'option est désactivée par défaut : sur un PC sans GPU, un modèle 7B
dépasse le seuil de 5 s (spike #50).
"""
from __future__ import annotations

import json
import math
import re
import time
import unicodedata
from collections import Counter
from functools import lru_cache
from pathlib import Path

from app import llm as _llm

VERSION = "3.1.0"
RACINE = Path(__file__).resolve().parents[1]
DATA = RACINE / "data" / "processed"
FAMILLES = ["hesperidee", "aromatique", "verte", "marine", "iodee", "boisee", "ambree", "musquee", "florale"]
AXES = ["fraicheur", "chaleur", "douceur", "boise", "intensite"]
QUOTAS = {"tete": 3, "coeur": 4, "fond": 3}
FORMATS_AROME = {"arome_boisson", "arome_alimentaire"}
FORMATS_PARFUM = {"parfum", "eau_de_toilette"}
LETTRE = "a-z0-9àâäçéèêëîïôöùûüÿœæ"


# ------------------------------------------------------------------ données
@lru_cache(maxsize=1)
def donnees() -> dict:
    def lire(nom):
        return json.loads((DATA / nom).read_text(encoding="utf-8"))
    notes = lire("notes.json")["notes"]
    d = {
        "notes": notes,
        "par_id": {n["id"]: n for n in notes},
        "familles": lire("familles.json"),
        "ambiances": lire("ambiances.json"),
        "questions": lire("questions.json"),
        "lexique": lire("lexique.json"),
        "duels": lire("duels.json"),
        "radar": lire("radar.json"),
        "modele_brief": lire("modele_brief.json"),
        "criteres": lire("criteres_potentiel.json"),
        "references": lire("banque_references.json"),
    }
    d["options"] = {o["id"]: o for q in d["questions"]["questions"] for o in q["options"]}
    d["options"].update({o["id"]: o for dl in d["duels"]["duels"] for o in dl["options"]})
    d["fam_par_id"] = {f["id"]: f for f in d["familles"]}
    global _LEX_FAMILLES
    _LEX_FAMILLES = list(d["lexique"]["familles"].values())
    d["motifs_notes"] = _motifs_notes(notes, d["lexique"]["synonymes_notes"])
    banque = DATA / "banque_parfums.json"
    d["banque"] = json.loads(banque.read_text(encoding="utf-8")) if banque.exists() else None
    return d


_LEX_FAMILLES: list = []


def donnees_lexique_familles():
    return _LEX_FAMILLES


def recharger():
    donnees.cache_clear()
    return donnees()


# ------------------------------------------------------------------ texte
def _norm(texte: str) -> str:
    t = unicodedata.normalize("NFC", texte or "").lower()
    return t.replace("’", "'").replace("œ", "oe")


@lru_cache(maxsize=4096)
def _regex(motif: str) -> re.Pattern:
    """Mot entier (pluriel accepté) ; un motif terminé par * est cherché comme début de mot."""
    prefixe = motif.endswith("*")
    m = re.escape(_norm(motif.rstrip("*")))
    fin = "" if prefixe else r"(?:s|x)?(?![" + LETTRE + "])"
    return re.compile(r"(?<![" + LETTRE + "])" + m + fin)


def _motifs_notes(notes, synonymes) -> list[tuple[re.Pattern, str, str]]:
    motifs = {}
    noms = {_norm(n["nom_fr"].split(" (")[0]) for n in notes}
    mots_familles = {_norm(m.rstrip("*")) for ms in donnees_lexique_familles() for m in ms}
    for n in notes:
        nom = _norm(n["nom_fr"].split(" (")[0])
        motifs[nom] = n["id"]
        premier = nom.split(" ")[0]
        # « menthe poivrée » se dit souvent « menthe » : on ajoute le premier mot s'il n'est pas ambigu
        if " " in nom and len(premier) >= 4 and premier not in noms and premier not in mots_familles:
            motifs.setdefault(premier, n["id"])
    for mot, nid in synonymes.items():
        motifs[_norm(mot)] = nid
    # les motifs les plus longs d'abord ("fleur d'oranger" avant "orange")
    return [(_regex(m), m, nid) for m, nid in sorted(motifs.items(), key=lambda x: -len(x[0]))]


def _phrases(texte: str) -> list[tuple[int, int, str]]:
    res, debut = [], 0
    for m in re.finditer(r"[.!?;\n]+", texte):
        res.append((debut, m.end(), texte[debut:m.end()].strip()))
        debut = m.end()
    if debut < len(texte):
        res.append((debut, len(texte), texte[debut:].strip()))
    return res


def _citation(texte: str, pos: int) -> str:
    for a, b, p in _phrases(texte):
        if a <= pos < b:
            return p
    return texte.strip()


def _nie(texte_norm: str, pos: int, negations: list[str]) -> bool:
    avant = texte_norm[max(0, pos - 40):pos]
    clause = re.split(r"[,.;:!?]", avant)[-1]
    return any(_norm(n) in clause for n in negations)


# ------------------------------------------------------------------ 1. analyse du brief
def analyser_brief(texte: str, llm: bool = False) -> dict:
    d = donnees()
    lex = d["lexique"]
    t = _norm(texte)
    occupe = [False] * len(t)

    notes_citees, notes_rejetees = [], []
    for rx, motif, nid in d["motifs_notes"]:
        for m in rx.finditer(t):
            if any(occupe[m.start():m.end()]):
                continue
            for i in range(m.start(), m.end()):
                occupe[i] = True
            entree = {"id": nid, "nom": d["par_id"][nid]["nom_fr"], "citation": _citation(texte, m.start())}
            cible = notes_rejetees if _nie(t, m.start(), lex["negations"]) else notes_citees
            if nid not in {x["id"] for x in cible}:
                cible.append(entree)

    signaux = Counter()
    for fam, mots in lex["familles"].items():
        for mot in mots:
            for m in _regex(mot).finditer(t):
                signaux[fam] += -0.7 if _nie(t, m.start(), lex["negations"]) else 0.7

    deltas = Counter()
    for expr, delta in sorted(lex["modificateurs"].items(), key=lambda x: -len(x[0])):
        if _regex(expr).search(t):
            for axe, v in delta.items():
                if axe not in deltas:
                    deltas[axe] = v

    champs = {}
    multiples = set(lex.get("champs_multiples", []))
    priorites = lex.get("priorite_champs", {})
    for champ, valeurs in lex["champs"].items():
        trouves = []
        for valeur, mots in valeurs.items():
            for mot in mots:
                m = _regex(mot).search(t)
                if m:
                    trouves.append((m.start(), -len(mot), valeur, m.start()))
        if champ in multiples:
            vus = {}
            for pos, _, valeur, p in sorted(trouves):
                if valeur not in vus:
                    vus[valeur] = {"valeur": valeur, "citation": _citation(texte, p)}
            champs[champ] = list(vus.values())
        elif trouves:
            trouves.sort()
            if champ == "format" and any(v != "parfum" for _, _, v, _ in trouves):
                # « marque de parfum » décrit souvent la marque : un format plus précis l'emporte
                trouves = [x for x in trouves if x[2] != "parfum"]
            if champ in priorites:
                ordre = priorites[champ]
                trouves.sort(key=lambda x: (ordre.index(x[2]) if x[2] in ordre else 99, x[0]))
            pos, _, valeur, p = trouves[0]
            champs[champ] = {"valeur": valeur, "citation": _citation(texte, p), "statut": "Entendu"}
        else:
            champs[champ] = None
    champs.update(_nombres(texte, t))
    trace_llm = {"demande": False, "utilise": False}
    if llm and texte.strip():
        trace_llm = _llm.completer_analyse(texte, notes_citees, notes_rejetees, signaux, champs, d)
    fmt = (champs.get("format") or {}).get("valeur")
    if fmt in FORMATS_AROME or champs.get("domaine"):
        champs["domaine"] = {"valeur": "aromes", "citation": (champs.get("domaine") or champs["format"])["citation"], "statut": "Entendu"}
    elif fmt:
        champs["domaine"] = {"valeur": "fragrances", "citation": champs["format"]["citation"], "statut": "Déduit du format"}

    signaux_business = _signaux_business(t, champs, notes_citees)
    return {
        "brief": _brief_v3(texte, champs, signaux, notes_citees),
        "notes_citees": notes_citees,
        "notes_rejetees": notes_rejetees,
        "familles_detectees": {f: round(v, 2) for f, v in signaux.most_common() if v > 0},
        "modificateurs": dict(deltas),
        "champs": champs,
        "signaux_business": signaux_business,
        "llm": trace_llm,
    }


_NOMBRE = r"(\d{1,3}(?:[  \u202f]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)"


def _num(x: str) -> float:
    return float(re.sub(r"[  \u202f]", "", x).replace(",", "."))


def _nombres(texte: str, t: str) -> dict:
    """Budget au kilo et volume annuel, en ordre de grandeur (écran Brief de la V3)."""
    res = {"budget_kilo": None, "volume_annuel": None}
    m = re.search(_NOMBRE + r"\s*(?:€|euros?)\s*(?:/|le|par|au)\s*(?:kg|kilo)", t)
    if m:
        res["budget_kilo"] = {"valeur": _num(m.group(1)), "unite": "€/kg",
                              "citation": _citation(texte, m.start()), "statut": "Entendu"}
    m = re.search(_NOMBRE + r"\s*(kg|kilos?|tonnes?|t)\s*(?:par an|/\s*an|annuels?|chaque année)", t)
    if m:
        v = _num(m.group(1))
        if m.group(2).startswith("t"):
            v *= 1000
        res["volume_annuel"] = {"valeur": v, "unite": "kg/an", "citation": _citation(texte, m.start()), "statut": "Entendu"}
    return res


def _brief_v3(texte: str, champs: dict, signaux: Counter, notes_citees: list) -> dict:
    """Brief au format de l'écran Voix 05 : ce qu'Aurore a entendu, puis les 11 champs à compléter."""
    d = donnees()
    phrases = [p for _, _, p in _phrases(texte)]
    fam = [f for f, v in signaux.most_common() if v > 0]
    univers = next((p for p in phrases if any(_regex(m).search(_norm(p)) for f in fam[:2] for m in d["lexique"]["familles"][f])), None)
    entendu = {
        "produit": champs.get("format"),
        "univers": {"valeur": univers, "statut": "Entendu"} if univers else None,
        "emotions": {"valeur": ", ".join(d["fam_par_id"][f]["nom"].lower() for f in fam[:3]), "statut": "Déduit"} if fam else None,
        "usage": champs.get("moment"),
        "inspiration": {"valeur": ", ".join(n["nom"] for n in notes_citees), "statut": "Entendu"} if notes_citees else None,
    }
    remplis, a_completer = {}, []
    for c in d["modele_brief"]["a_completer"]:
        v = champs.get(c["id"])
        if v:
            remplis[c["id"]] = v
        else:
            a_completer.append({"id": c["id"], "libelle": c["libelle"]})
    total = len(d["modele_brief"]["a_completer"])
    return {"entendu": entendu, "champs": remplis, "a_completer": a_completer,
            "completude": f"{total - len(a_completer)} sur {total}"}


def importer_brief(document: dict) -> dict:
    """Lit un brief rempli à partir du modèle (GET /modele-brief) et dit ce qui manque ou ce qui est invalide."""
    d = donnees()
    remplis, invalides, a_completer = {}, [], []
    for c in d["modele_brief"]["a_completer"]:
        v = document.get(c["id"])
        if v in (None, "", []):
            a_completer.append({"id": c["id"], "libelle": c["libelle"]})
            continue
        if c["type"] == "nombre":
            try:
                remplis[c["id"]] = {"valeur": float(str(v).replace(",", ".")), "unite": c["unite"], "statut": "Importé"}
            except ValueError:
                invalides.append({"id": c["id"], "message": f"« {v} » n'est pas un nombre."})
        elif c["type"] == "choix":
            if v in c["valeurs"]:
                remplis[c["id"]] = {"valeur": v, "statut": "Importé"}
            else:
                invalides.append({"id": c["id"], "message": f"Valeur inconnue : {v}. Valeurs possibles : {', '.join(c['valeurs'])}."})
        else:
            vals = v if isinstance(v, list) else [v]
            ko = [x for x in vals if x not in c["valeurs"]]
            if ko:
                invalides.append({"id": c["id"], "message": f"Valeurs inconnues : {', '.join(ko)}."})
            remplis[c["id"]] = [{"valeur": x, "statut": "Importé"} for x in vals if x in c["valeurs"]]
    total = len(d["modele_brief"]["a_completer"])
    texte = " ".join(str(document.get(k, "")) for k in ("produit", "univers", "emotions", "usage", "inspiration", "description"))
    return {"champs": remplis, "invalides": invalides, "a_completer": a_completer,
            "completude": f"{total - len(a_completer)} sur {total}", "texte_libre": texte.strip(),
            "statut": "erreur de format" if invalides else "importé"}


def _signaux_business(t: str, champs: dict, notes_citees: list) -> dict:
    """Hypothèse à valider : aucun de ces signaux n'a encore été mesuré sur de vrais clients."""
    lex = donnees()["lexique"]["signaux_business"]
    s = {
        "brief_precis": len(notes_citees) >= 2,
        "gamme_prevue": any(_regex(m).search(t) for m in lex["gamme"]),
        "calendrier_date": any(_regex(m).search(t) for m in lex["calendrier"]),
        "positionnement_haut": bool(champs.get("positionnement")) and champs["positionnement"]["valeur"] in ("premium", "luxe"),
        "volume_annonce": any(_regex(m).search(t) for m in lex["volume"]),
    }
    poids = {"brief_precis": 25, "gamme_prevue": 20, "calendrier_date": 20, "positionnement_haut": 15, "volume_annonce": 20}
    score = sum(poids[k] for k, v in s.items() if v)
    return {"signaux": s, "score": score, "potentiel": "fort" if score >= 60 else "à qualifier",
            "statut": "hypothèse, non validée sur des clients réels"}


# ------------------------------------------------------------------ 2. profil et roue
def calculer_roue(reponses: list[str], analyse: dict | None = None, ajustements: dict | None = None) -> dict:
    d = donnees()
    brut = Counter({f: 0.0 for f in FAMILLES})
    inconnues = []
    for rid in reponses or []:
        o = d["options"].get(rid)
        if not o:
            inconnues.append(rid)
            continue
        for f, p in o["poids"].items():
            brut[f] += p
    if analyse:
        for n in analyse["notes_citees"]:
            brut[d["par_id"][n["id"]]["famille"]] += 1.0
        for f, v in analyse["familles_detectees"].items():
            brut[f] += v
        for n in analyse["notes_rejetees"]:
            brut[d["par_id"][n["id"]]["famille"]] -= 0.5
    # ajustements à la main sur le radar (+1 / -1 par axe), répartis sur les familles de l'axe
    regroupement = d["radar"]["regroupement"]
    tot0 = sum(max(0.0, v) for v in brut.values()) or len(FAMILLES)
    for axe, delta in (ajustements or {}).items():
        membres = regroupement.get(axe, [])
        for f in membres:
            brut[f] += delta * 0.15 * tot0 / len(membres)
    brut = Counter({f: max(0.0, v) for f, v in brut.items()})
    total = sum(brut.values())
    if total == 0:
        roue = {f: round(100 / len(FAMILLES), 1) for f in FAMILLES}
    else:
        roue = {f: round(100 * brut[f] / total, 1) for f in FAMILLES}
    axes = {a: round(sum(roue[f] / 100 * d["fam_par_id"][f][a + "_defaut"] for f in FAMILLES), 2) for a in AXES}
    if analyse:
        for a, v in analyse["modificateurs"].items():
            axes[a] = round(min(5, max(0, axes[a] + v)), 2)
    classement = sorted(FAMILLES, key=lambda f: (-roue[f], FAMILLES.index(f)))
    radar = {a: round(sum(roue[f] for f in regroupement[a]), 1) for a in regroupement}
    lumiere = axes["fraicheur"] - (axes["chaleur"] + axes["douceur"]) / 2
    commentaire = ("Vous êtes plutôt lumière que velours." if lumiere > 0.5 else
                   "Vous êtes plutôt velours que lumière." if lumiere < -0.5 else "Vous êtes entre lumière et velours.")
    return {"roue": roue, "radar": radar, "classement": classement, "axes_cibles": axes,
            "commentaire": commentaire, "reponses_inconnues": inconnues}


# ------------------------------------------------------------------ 3. plateau de notes
def _autorisee(n: dict, engagements: set[str], fmt: str | None) -> str | None:
    if "vegan" in engagements and not n["vegan"]:
        return "pas vegan"
    if "naturel" in engagements and not n["naturel"]:
        return "pas d'origine naturelle (accord de synthèse)"
    if "matieres_durables" in engagements and not n["durable"]:
        return "point de vigilance durabilité"
    if "sans_allergenes" in engagements and n["allergenes_principaux"]:
        return "porteuse d'allergènes à déclarer (" + ", ".join(n["allergenes_principaux"]) + ")"
    if fmt in FORMATS_AROME and n["usage"] == "parfum":
        return "réservée à la parfumerie"
    if fmt in FORMATS_PARFUM and n["usage"] == "arome":
        return "réservée aux arômes"
    return None


def composer_plateau(profil: dict, analyse: dict | None, engagements: list[str], fmt: str | None,
                     taille: int = 10) -> dict:
    d = donnees()
    eng = set(engagements or [])
    citees = [n["id"] for n in (analyse or {}).get("notes_citees", [])]
    rejetees = {n["id"] for n in (analyse or {}).get("notes_rejetees", [])}
    accords_cites = Counter(a for c in citees for a in d["par_id"][c]["accords"])
    cible = profil["axes_cibles"]
    roue = profil["roue"]

    alertes, candidates = [], []
    for n in d["notes"]:
        raison = _autorisee(n, eng, fmt)
        if n["id"] in rejetees:
            raison = "écartée à la demande du client"
        if raison:
            if n["id"] in citees:
                alertes.append({"note": n["id"], "message": f"{n['nom_fr']} a été citée mais elle est {raison} : elle n'est pas proposée."})
            continue
        dist = sum(abs(n[a] - cible[a]) for a in AXES) / (5 * len(AXES))
        score = 2.0 * roue[n["famille"]] / 100 + 0.6 * (1 - dist) + 0.25 * min(accords_cites[n["id"]], 2)
        if n["id"] in citees:
            score += 1.5
        candidates.append((round(score, 4), n))
    candidates.sort(key=lambda x: (-x[0], x[1]["id"]))

    plafond = {f: max(1, round(taille * roue[f] / 100) + 1) for f in FAMILLES}
    quotas = {e: round(q * taille / 10) for e, q in QUOTAS.items()}
    choisies, par_fam, par_etage = [], Counter(), Counter()
    for passe in (1, 2):  # 2e passe : on relâche les quotas si une contrainte vide un étage
        for score, n in candidates:
            if len(choisies) >= taille:
                break
            if n in [c[1] for c in choisies]:
                continue
            if passe == 1 and (par_etage[n["etage"]] >= quotas[n["etage"]] or par_fam[n["famille"]] >= plafond[n["famille"]]) \
                    and n["id"] not in citees:
                continue
            choisies.append((score, n))
            par_fam[n["famille"]] += 1
            par_etage[n["etage"]] += 1

    ordre = {"tete": 0, "coeur": 1, "fond": 2}
    choisies.sort(key=lambda x: (ordre[x[1]["etage"]], -x[0]))
    plateau = [{"id": n["id"], "nom": n["nom_fr"], "famille": n["famille"], "etage": n["etage"],
                "score": s, "pourquoi": _pourquoi(n, citees, roue)} for s, n in choisies]
    for c in citees:
        if c not in [p["id"] for p in plateau] and not any(a["note"] == c for a in alertes):
            alertes.append({"note": c, "message": f"{d['par_id'][c]['nom_fr']} a été citée mais n'a pas trouvé de place dans le plateau."})
    return {"notes": plateau, "alertes": alertes}


def _pourquoi(n: dict, citees: list[str], roue: dict) -> str:
    fam = donnees()["fam_par_id"][n["famille"]]["nom"]
    if n["id"] in citees:
        return "Citée dans votre brief."
    if roue[n["famille"]] < 5:
        return f"Complète l'étage de {'cœur' if n['etage'] == 'coeur' else n['etage'].replace('tete', 'tête')} : proche du profil recherché."
    return f"Famille {fam.lower()} ({roue[n['famille']]:.0f} % de votre roue)."


# ------------------------------------------------------------------ 4. trois pistes
def proposer_pistes(plateau: list[dict], profil: dict) -> list[dict]:
    d = donnees()
    fams = [f for f in profil["classement"] if profil["roue"][f] > 0][:3] or profil["classement"][:3]
    while len(fams) < 3:
        fams.append(profil["classement"][len(fams)])
    titres = ["Signature", "Variation", "Contraste"]
    pistes = []
    for i, (titre, f) in enumerate(zip(titres, fams)):
        second = fams[0] if i > 0 else fams[1]
        notes = {}
        for etage in ("tete", "coeur", "fond"):
            du_plateau = [p for p in plateau if p["etage"] == etage]
            du_plateau.sort(key=lambda p: (p["famille"] != f, p["famille"] != second, -p["score"]))
            notes[etage] = [p["id"] for p in du_plateau[:2 if etage == "coeur" else 1]]
        pistes.append({
            "titre": titre, "famille_principale": f, "famille_nom": d["fam_par_id"][f]["nom"],
            "notes": notes,
            "description": f"Une piste {d['fam_par_id'][f]['nom'].lower()}" + (
                f", soutenue par la famille {d['fam_par_id'][second]['nom'].lower()}." if second != f else "."),
        })
    return pistes


# ------------------------------------------------------------------ 5. parfums existants proches
def parfums_proches(roue: dict, n: int = 10) -> dict:
    """Compare la roue du client aux parfums de la banque (data/processed/banque_parfums.json).

    Format attendu de la banque : [{"id": ..., "nom": ..., "notes": [ids de notes]} ou "familles": {famille: %}].
    """
    d = donnees()
    if not d["banque"]:
        return {"disponible": False, "resultats": [],
                "message": "Banque de parfums existants non branchée : déposer banque_parfums.json dans data/processed."}
    v_client = [roue[f] for f in FAMILLES]
    res = []
    for p in d["banque"]:
        if "familles" in p:
            vec = [p["familles"].get(f, 0) for f in FAMILLES]
        else:
            c = Counter(d["par_id"][x]["famille"] for x in p.get("notes", []) if x in d["par_id"])
            vec = [c[f] for f in FAMILLES]
        res.append({"id": p["id"], "nom": p.get("nom", p["id"]), "similarite": round(_cos(v_client, vec), 3)})
    res.sort(key=lambda x: -x["similarite"])
    return {"disponible": True, "resultats": res[:n]}


def _cos(a, b) -> float:
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(x * x for x in b))
    return 0.0 if na == 0 or nb == 0 else sum(x * y for x, y in zip(a, b)) / (na * nb)


# ------------------------------------------------------------------ 6. kit atelier (30 notes de base)
def kit_atelier(taille: int = 30) -> dict:
    """Règle : notes les plus citées comme accords par les autres notes, sans point de vigilance,
    au moins 2 par famille, 10 par étage. Proposition à valider par Hamza et Product."""
    d = donnees()
    centralite = Counter(a for n in d["notes"] for a in n["accords"])
    ok = [n for n in d["notes"] if n["durable"] and n["vegan"]]
    ok.sort(key=lambda n: (-centralite[n["id"]], not n["naturel"], n["id"]))
    choisies, par_etage = [], Counter()
    for f in FAMILLES:
        for n in [x for x in ok if x["famille"] == f][:2]:
            choisies.append(n)
            par_etage[n["etage"]] += 1
    for n in ok:
        if len(choisies) >= taille:
            break
        if n in choisies or par_etage[n["etage"]] >= taille // 3:
            continue
        choisies.append(n)
        par_etage[n["etage"]] += 1
    for n in ok:
        if len(choisies) >= taille:
            break
        if n not in choisies:
            choisies.append(n)
    return {"version": VERSION, "taille": len(choisies),
            "regle": "notes les plus citées comme accords, sans vigilance, vegan, au moins 2 par famille, équilibre des étages",
            "statut": "proposition, à valider par Hamza et Product",
            "notes": [{"id": n["id"], "nom": n["nom_fr"], "famille": n["famille"], "etage": n["etage"],
                       "citee_comme_accord": centralite[n["id"]]} for n in choisies]}


# ------------------------------------------------------------------ 7. variation « plus frais », « moins boisé »
def varier(notes_dosees: dict[str, float], demande: str) -> dict:
    """Applique la règle du README : une demande devient une cible sur un axe, puis on ajuste les dosages."""
    d = donnees()
    t = _norm(demande)
    deltas = {}
    for expr, delta in sorted(d["lexique"]["modificateurs"].items(), key=lambda x: -len(x[0])):
        if _regex(expr).search(t):
            for a, v in delta.items():
                deltas.setdefault(a, v * (2 if "beaucoup" in t else 1))
    if not deltas:
        return {"compris": False, "message": "Demande non reconnue. Exemples : « plus frais », « moins boisé ».",
                "dosages": notes_dosees}
    dos = {k: float(v) for k, v in notes_dosees.items() if k in d["par_id"]}

    def profil(x):
        tot = sum(x.values()) or 1
        return {a: sum(d["par_id"][k][a] * v for k, v in x.items()) / tot for a in AXES}

    avant = profil(dos)
    for _ in range(3):
        for axe, delta in deltas.items():
            if delta > 0:
                faibles = sorted(dos, key=lambda k: d["par_id"][k][axe])[:2]
                for k in faibles:
                    dos[k] *= 0.8
                fortes = [n for n in d["notes"] if n[axe] >= 4]
                deja = [k for k in dos if d["par_id"][k][axe] >= 4]
                cible = deja[0] if deja else sorted(fortes, key=lambda n: (n["famille"] not in ("hesperidee", "verte", "marine") if axe == "fraicheur" else False, n["id"]))[0]["id"]
                dos[cible] = dos.get(cible, 0) + sum(notes_dosees.values()) * 0.1
            else:
                fortes = [k for k in dos if d["par_id"][k][axe] >= 4]
                report = 0.0
                for k in fortes:
                    report += dos[k] * 0.3
                    dos[k] *= 0.7
                douces = [k for k in dos if d["par_id"][k][axe] <= 1 and d["par_id"][k]["etage"] == "coeur"] or \
                         [k for k in dos if d["par_id"][k][axe] <= 1]
                for k in douces:
                    dos[k] += report / max(1, len(douces))
        apres = profil(dos)
        if all((apres[a] - avant[a]) * v >= abs(v) * 0.5 for a, v in deltas.items()):
            break
    tot = sum(dos.values()) or 1
    dos = {k: round(100 * v / tot, 1) for k, v in dos.items()}
    return {"compris": True, "deltas": deltas, "profil_avant": {a: round(v, 2) for a, v in avant.items()},
            "profil_apres": {a: round(v, 2) for a, v in profil(dos).items()}, "dosages": dos}


# ------------------------------------------------------------------ point d'entrée principal
def recommander(brief: str, reponses: list[str] | None = None, engagements: list[str] | None = None,
                format_: str | None = None, taille: int = 10, domaine: str | None = None,
                ajustements: dict | None = None, llm: bool = False) -> dict:
    t0 = time.perf_counter()
    analyse = analyser_brief(brief or "", llm)
    eng = set(engagements or []) | {e["valeur"] for e in analyse["champs"]["engagements"]}
    fmt = format_ or (analyse["champs"]["format"] or {}).get("valeur")
    dom = domaine or (analyse["champs"].get("domaine") or {}).get("valeur")
    if dom == "aromes" and fmt not in FORMATS_AROME:
        fmt_filtre = "arome_alimentaire"
    else:
        fmt_filtre = fmt
    profil = calculer_roue(reponses or [], analyse, ajustements)
    plateau = composer_plateau(profil, analyse, sorted(eng), fmt_filtre, taille)
    pistes = proposer_pistes(plateau["notes"], profil)
    refs = references_proches(profil, plateau["notes"], analyse, dom, fmt, eng, 3)
    alertes = plateau["alertes"] + [{"note": None, "message": f"Réponse inconnue ignorée : {r}"} for r in profil["reponses_inconnues"]]
    commentaire_reformule, trace_reformulation = None, {"demande": False, "utilise": False}
    if llm:
        d = donnees()
        top = ", ".join(f"{d['fam_par_id'][f]['nom'].lower()} ({profil['roue'][f]:.0f} %)"
                        for f in profil["classement"][:3] if profil["roue"][f] > 0)
        faits = {"profil": f"{profil['commentaire']} Familles dominantes : {top}." if top else profil["commentaire"]}
        faits.update({r["id"]: " ".join(r["lien_au_projet"]) for r in refs})
        textes, trace_reformulation = _llm.reformuler(faits, brief or "")
        commentaire_reformule = textes.get("profil")
        for r in refs:
            r["lien_reformule"] = textes.get(r["id"])
    if "sans_allergenes" in eng:
        alertes.append({"note": None, "message": "Sans allergènes : les notes porteuses d'allergènes connus sont écartées ; "
                                                 "les autres doivent être vérifiées par le parfumeur (liste d'allergènes partielle)."})
    return {
        "version_modele": VERSION,
        "analyse": analyse,
        "brief": analyse["brief"],
        "engagements_appliques": sorted(eng),
        "domaine": dom,
        "format": fmt,
        "roue": profil["roue"],
        "radar": profil["radar"],
        "commentaire_profil": profil["commentaire"],
        "commentaire_reformule": commentaire_reformule,
        "familles_classees": profil["classement"],
        "axes_cibles": profil["axes_cibles"],
        "plateau": plateau["notes"],
        "alertes": alertes,
        "pistes": pistes,
        "references_proches": refs,
        "potentiel": evaluer_potentiel(analyse, refs, eng, plateau["notes"]),
        "parfums_proches": parfums_proches(profil["roue"]),
        "llm": {"analyse": analyse["llm"], "reformulation": trace_reformulation},
        "duree_ms": round((time.perf_counter() - t0) * 1000, 2),
    }


# ------------------------------------------------------------------ V3 : 3 références proches de la banque
def _vecteur_ref(ref: dict) -> list[float]:
    d = donnees()
    poids = {"tete": 1.0, "coeur": 1.2, "fond": 1.0}
    c = Counter()
    for e, ids in ref["notes"].items():
        for x in ids:
            c[d["par_id"][x]["famille"]] += poids[e]
    return [c[f] for f in FAMILLES]


def references_proches(profil: dict, plateau: list[dict], analyse: dict | None, domaine: str | None,
                       fmt: str | None, engagements: set[str], k: int = 3) -> list[dict]:
    """Moment décisif de la story map : 3 références de la banque, expliquées par leur lien au projet."""
    d = donnees()
    v_client = [profil["roue"][f] for f in FAMILLES]
    projet = {p["id"] for p in plateau}
    citees = {n["id"] for n in (analyse or {}).get("notes_citees", [])}
    resultats = []
    for ref in d["references"]:
        if domaine and ref["domaine"] != domaine:
            continue
        toutes = [x for ids in ref["notes"].values() for x in ids]
        sim = _cos(v_client, _vecteur_ref(ref))
        communes = [x for x in toutes if x in projet or x in citees]
        score = 0.55 * sim + 0.3 * len(communes) / len(toutes) + (0.15 if fmt and ref["produit"] == fmt else 0)
        a_adapter = []
        for x in toutes:
            raison = _autorisee(d["par_id"][x], engagements, None)
            if raison:
                a_adapter.append(f"{d['par_id'][x]['nom_fr']} ({raison})")
        if a_adapter:
            score -= 0.2
        fam = d["fam_par_id"][ref["famille_principale"]]["nom"].lower()
        part = profil["roue"][ref["famille_principale"]]
        liens = [f"Même univers que votre profil : famille {fam} ({part:.0f} % de votre roue)."] if part >= 15 else []
        cit = [d["par_id"][x]["nom_fr"] for x in toutes if x in citees]
        if cit:
            liens.append("Contient ce que vous avez cité : " + ", ".join(cit) + ".")
        autres = [d["par_id"][x]["nom_fr"] for x in communes if x not in citees]
        if autres:
            liens.append("Partage avec votre plateau : " + ", ".join(autres) + ".")
        if fmt and ref["produit"] == fmt:
            liens.append("Déjà déclinée dans votre format.")
        resultats.append({"id": ref["id"], "nom": ref["nom"], "produit": ref["produit"], "description": ref["description"],
                          "notes": ref["notes"], "score": round(score, 3), "similarite_profil": round(sim, 3),
                          "lien_au_projet": liens, "a_adapter": a_adapter, "ambiance": ref["ambiance"],
                          "chemin": "catalogue : " + d["criteres"]["delais"]["banque"], "statut": ref["statut"]})
    resultats.sort(key=lambda r: (-r["score"], r["id"]))
    return resultats[:k]


# ------------------------------------------------------------------ V3 : potentiel critère par critère
def evaluer_potentiel(analyse: dict, references: list[dict], engagements: set[str], plateau: list[dict]) -> dict:
    """Les 7 critères de l'écran Business 05. Hypothèse à valider avec Givaudan ; le commercial décide."""
    d = donnees()
    ch = analyse["champs"]
    val = lambda c: (ch.get(c) or {}).get("valeur") if isinstance(ch.get(c), dict) else None  # noqa: E731
    pays = [p["valeur"] for p in ch.get("pays_vente") or []]
    res = []

    def ajouter(cid, statut, raison):
        lib = next(c["libelle"] for c in d["criteres"]["criteres"] if c["id"] == cid)
        res.append({"id": cid, "libelle": lib, "statut": statut, "raison": raison})

    libelles = {c["id"]: c.get("valeurs", {}) for c in d["modele_brief"]["a_completer"]}
    cible = val("cible")
    ajouter("cible", "a_completer" if not cible else ("favorable" if cible in ("grand_public", "hotellerie") else "a_verifier"),
            "Cible non précisée." if not cible else f"Cible : {libelles['cible'][cible].lower()}.")
    if not pays:
        ajouter("pays_vente", "a_completer", "Pays de vente non précisés.")
    else:
        hors_ue = [p for p in pays if p in ("etats_unis", "asie", "royaume_uni")]
        ajouter("pays_vente", "a_verifier" if hors_ue else "favorable",
                ("Règles locales à vérifier : " + ", ".join(libelles["pays_vente"][p] for p in hors_ue) + ".") if hors_ue else "Vente en France ou dans l'Union européenne.")
    vol = val("volume_annuel")
    ajouter("volume", "a_completer" if vol is None else "a_verifier",
            "Volume non précisé." if vol is None else f"{vol:.0f} kg par an, à comparer au seuil Givaudan [X].")
    mc = val("mise_en_concurrence")
    ajouter("mise_en_concurrence", "a_completer" if not mc else ("favorable" if mc == "seulement_givaudan" else "a_verifier"),
            "Non précisé." if not mc else {"seulement_givaudan": "Seulement Givaudan.", "autres_fournisseurs": "D'autres fournisseurs sont consultés.",
                                           "pas_decide": "Pas encore décidé."}[mc])
    points = []
    if [p for p in pays if p != "france" and p != "union_europeenne"]:
        points.append("pays hors Union européenne")
    vig = [p["nom"] for p in plateau if d["par_id"][p["id"]]["vigilance"]]
    if vig:
        points.append("matières avec point de vigilance : " + ", ".join(vig))
    if "sans_allergenes" in engagements:
        points.append("formule sans allergènes à vérifier par le parfumeur")
    if any(c["valeur"] == "reglementation" for c in ch.get("contraintes") or []):
        points.append("contrainte réglementaire signalée par le client")
    ajouter("faisabilite_reglementaire", "a_verifier" if points else "favorable",
            ("À vérifier : " + " ; ".join(points) + ". Contrôle IFRA avant l'échantillon.") if points else "Aucun point bloquant repéré. Contrôle IFRA avant l'échantillon.")
    proche = references[0] if references else None
    if proche and proche["score"] >= 0.6 and not proche["a_adapter"]:
        ajouter("produits_similaires", "favorable", f"Formule proche dans la banque : {proche['nom']} ({d['criteres']['delais']['banque']}).")
    elif proche:
        ajouter("produits_similaires", "a_verifier", f"Référence la plus proche : {proche['nom']}, à adapter ; sinon sur-mesure ({d['criteres']['delais']['sur_mesure']}).")
    else:
        ajouter("produits_similaires", "a_verifier", f"Aucune référence dans ce domaine : sur-mesure ({d['criteres']['delais']['sur_mesure']}).")
    remplis = int(analyse["brief"]["completude"].split(" ")[0])
    ajouter("engagement_client", "favorable" if remplis >= 6 and val("budget_kilo") is not None else "a_verifier",
            f"Brief complété à {analyse['brief']['completude']}" + ("." if val("budget_kilo") is not None else ", budget non donné."))
    fav = sum(1 for r in res if r["statut"] == "favorable")
    if res[5]["statut"] == "favorable" and fav < 5:
        suggestion = "orienter_banque"
    elif fav >= 5:
        suggestion = "prioriser"
    else:
        suggestion = "mettre_en_attente" if fav <= 2 else "orienter_banque"
    return {"criteres": res, "favorables": fav, "suggestion": suggestion, "suggestion_libelle": d["criteres"]["decisions"][suggestion],
            "statut": "hypothèse : règles à valider avec Givaudan, le commercial décide", "seuils": d["criteres"]["seuils_inconnus"]}


# ------------------------------------------------------------------ V3 : formule en deux versions (étape 12)
def proposer_formule(avis: dict[str, str], domaine: str | None = None) -> dict:
    """À partir de ce que la marque a aimé en sentant les fioles, deux versions : plus fraîche et plus chaude.
    Sans dosage : les proportions sont fixées par le parfumeur."""
    d = donnees()
    gardees = [k for k, v in avis.items() if k in d["par_id"] and v in ("aime", "un_peu", "rappelle")]
    ecartees = [k for k, v in avis.items() if v == "pas_pour_moi"]
    if not gardees:
        return {"compris": False, "message": "Aucune note aimée : il faut au moins une note notée « j'aime » ou « un peu »."}

    def version(axe, titre):
        notes = sorted(gardees, key=lambda k: (-d["par_id"][k][axe], k))
        pyramide = {e: [k for k in notes if d["par_id"][k]["etage"] == e] for e in ("tete", "coeur", "fond")}
        for e, ids in pyramide.items():
            if not ids:  # étage vide : on complète avec un accord des notes aimées
                acc = [a for k in gardees for a in d["par_id"][k]["accords"] if d["par_id"][a]["etage"] == e and a not in ecartees]
                if acc:
                    pyramide[e] = [sorted(set(acc), key=lambda a: (-d["par_id"][a][axe], a))[0]]
        accent = [k for k in notes[:2]]
        return {"titre": titre, "pyramide": pyramide, "accent": accent,
                "pourquoi": f"Met en avant {', '.join(d['par_id'][k]['nom_fr'] for k in accent)}."}

    a = version("fraicheur", "Version A, plus fraîche")
    b = version("chaleur", "Version B, plus chaude")
    roue = Counter(d["par_id"][k]["famille"] for k in gardees)
    tot = sum(roue.values())
    profil = {"roue": {f: 100 * roue[f] / tot for f in FAMILLES}}
    refs = references_proches(profil, [{"id": k} for k in gardees], None, domaine, None, set(), 3)
    return {"compris": True, "notes_gardees": gardees, "notes_ecartees": ecartees, "versions": [a, b],
            "references_proches": refs, "dosages": "fixés par le parfumeur Givaudan, non calculés ici"}


# ------------------------------------------------------------------ V3 : aide (« Pourquoi cette note ? »)
def expliquer_note(note_id: str, brief: str = "", llm: bool = False) -> dict:
    d = donnees()
    n = d["par_id"][note_id]
    analyse = analyser_brief(brief) if brief else None
    sources = ["fiche matière de la banque Givaudan (données de l'équipe)"]
    phrases = [n["description_client"]]
    if analyse:
        cite = next((c for c in analyse["notes_citees"] if c["id"] == note_id), None)
        if cite:
            phrases.insert(0, f"Vous l'avez évoquée : « {cite['citation']} »" if cite["citation"] else "Vous l'avez évoquée.")
            sources.insert(0, "votre brief")
        else:
            fam = analyse["familles_detectees"]
            if n["famille"] in fam:
                phrases.insert(0, f"Votre brief va vers la famille {d['fam_par_id'][n['famille']]['nom'].lower()}.")
                sources.insert(0, "votre brief")
    phrases.append(f"Elle s'accorde avec {', '.join(d['par_id'][a]['nom_fr'] for a in n['accords'])}.")
    if n["origine_statut"].startswith("confirm"):
        phrases.append(f"Origine : {n['origine']}.")
    res = {"note": note_id, "reponse": " ".join(phrases), "sources": sources + ["votre conseiller pour toute précision"]}
    if llm:
        textes, trace = _llm.reformuler({"reponse": res["reponse"]}, brief)
        res["reponse_reformulee"] = textes.get("reponse")
        res["llm"] = trace
    return res
