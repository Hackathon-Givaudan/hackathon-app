"""Mesure du moteur ia-v3 sur un jeu qu'il n'a jamais vu : ia/evaluation/envies.json (écrit par l'équipe du service ia/).

Usage, depuis la racine du dépôt :
  git worktree add ../ia-v3-source feature/data-ia-v3
  python docs/livrable-data-g11/mesure_envies_independantes.py ../ia-v3-source/ia-v3 ia/evaluation/envies.json

Règle de réussite, la même que l'ADR 0008 : une envie est réussie si une des notes attendues est proposée.
Le moteur propose 10 notes ; on compte aussi les 6 meilleures, car ia/ en propose 6 au plus.
Aucune correction du moteur n'a été faite avant ou après cette mesure.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path


def slug(text: str) -> str:
    plain = unicodedata.normalize("NFD", text.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


def main(moteur_dir: str, envies_path: str) -> None:
    sys.path.insert(0, moteur_dir)
    from app import moteur  # noqa: E402

    notes = moteur.donnees()["notes"]
    vers_ia = {n["id"]: slug(re.sub(r"\s*\(.*?\)", "", n["nom_fr"])) for n in notes}
    connues = set(vers_ia.values())
    lignes = []
    for cas in json.loads(Path(envies_path).read_text(encoding="utf-8")):
        r = moteur.recommander(cas["wishes"], domaine="aromes" if cas["universe"] == "arome" else "fragrances")
        plateau = [vers_ia[p["id"]] for p in r["plateau"]]
        top6 = [vers_ia[p["id"]] for p in sorted(r["plateau"], key=lambda p: -p["score"])[:6]]
        attendu = cas["expected"]
        lignes.append({
            "univers": cas["universe"], "envie": cas["wishes"], "attendu": attendu,
            "attendu_dans_mon_referentiel": [a for a in attendu if a in connues],
            "top6": top6, "plateau": plateau,
            "reussi_top6": bool(set(attendu) & set(top6)), "reussi_plateau": bool(set(attendu) & set(plateau)),
            "aucun_mot_reconnu": not r["analyse"]["notes_citees"] and not r["analyse"]["familles_detectees"],
            "hors_sujet_refuse": False if not attendu else None,  # le moteur ia-v3 n'a pas de garde-fou
        })
    projets = [l for l in lignes if l["attendu"]]
    resume = {
        "envies_projet": len(projets),
        "reussies_top6": sum(l["reussi_top6"] for l in projets),
        "reussies_plateau_10": sum(l["reussi_plateau"] for l in projets),
        "attendu_atteignable": sum(bool(l["attendu_dans_mon_referentiel"]) for l in projets),
        "sans_aucun_mot_reconnu": sum(l["aucun_mot_reconnu"] for l in projets),
        "hors_sujet": len(lignes) - len(projets),
        "hors_sujet_refuses": 0,
        "version_moteur": moteur.VERSION,
    }
    sortie = Path(__file__).with_name("resultats_envies_independantes.json")
    sortie.write_text(json.dumps({"resume": resume, "cas": lignes}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(resume, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
