"""API du service Data/IA (modèle V2). Lancer : uvicorn app.main:app --port 8000 ; documentation sur /docs."""
from __future__ import annotations

import json
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import moteur

Engagement = Literal["vegan", "naturel", "sans_allergenes", "matieres_durables"]
Domaine = Literal["fragrances", "aromes"]
Avis = Literal["aime", "un_peu", "pas_pour_moi", "rappelle", "ne_sait_pas"]
Format = Literal["parfum", "eau_de_toilette", "bougie", "diffuseur", "brume", "soin", "savon",
                 "produit_entretien", "arome_boisson", "arome_alimentaire"]

app = FastAPI(
    title="Givaudan L'Atelier : service Data/IA",
    version=moteur.VERSION,
    description="Modèle V3 : brief écrit ou importé et duels du profil vers brief structuré, radar à 6 axes (9 familles), "
                "plateau de 10 notes, 3 références proches expliquées, potentiel critère par critère et formule en deux versions. "
                "Données sourcées et datées, sans LLM (latence de l'ordre de la milliseconde).",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

EXEMPLE_BRIEF = ("On ouvre un restaurant en bord de mer. On veut une bougie fraîche et iodée, "
                 "qui rappelle l'air du large. Prix accessible.")


class BriefIn(BaseModel):
    brief: str = Field(..., examples=[EXEMPLE_BRIEF], description="Texte libre du client (transcription de la séance).")


class ProfilIn(BaseModel):
    reponses: list[str] = Field(default_factory=list, examples=[["d1_a", "d2_b", "d3_a", "d4_a", "d5_a"]],
                                description="Choix des duels (GET /duels) ou options des questions V2 (GET /questions).")
    brief: str = Field("", description="Brief facultatif : les notes et familles citées complètent la roue.")
    ajustements: dict[str, int] = Field(default_factory=dict, examples=[{"marin": 1, "boise": -1}],
                                        description="Réglage à la main du radar : +1 ou -1 par axe (hesperide, marin, aromatique, floral, boise, ambre).")


class RecommandationIn(ProfilIn):
    brief: str = Field("", examples=[EXEMPLE_BRIEF])
    engagements: list[Engagement] = Field(default_factory=list, description="S'ajoutent à ceux entendus dans le brief.")
    format: Optional[Format] = Field(None, description="Si absent, le format entendu dans le brief est utilisé.")
    domaine: Optional[Domaine] = Field(None, description="Fragrances ou Arômes, choisi à l'entrée. Si absent, déduit du brief.")
    taille: int = Field(10, ge=3, le=30, description="Nombre de notes du plateau.")


class VariationIn(BaseModel):
    dosages: dict[str, float] = Field(..., examples=[{"cedre": 30, "vetiver": 20, "bergamote": 20, "fleur_oranger": 30}])
    demande: str = Field(..., examples=["moins boisé"])


class FormuleIn(BaseModel):
    avis: dict[str, Avis] = Field(..., examples=[{"embruns": "aime", "bergamote": "aime", "algue": "un_peu", "musc": "pas_pour_moi", "cedre": "aime"}],
                                  description="Ce que la marque a dit de chaque fiole (étape « On sent ensemble »).")
    domaine: Optional[Domaine] = None


class RoueIn(BaseModel):
    roue: dict[str, float] = Field(..., description="Roue en pourcentage par famille (sortie de /profil).")
    n: int = Field(10, ge=1, le=50)


@app.get("/", tags=["service"])
def accueil():
    d = moteur.donnees()
    return {"service": "data-ia", "version_modele": moteur.VERSION, "notes": len(d["notes"]), "familles": len(d["familles"]),
            "ambiances": len(d["ambiances"]), "documentation": "/docs"}


@app.get("/sante", tags=["service"])
def sante():
    return {"statut": "ok", "version_modele": moteur.VERSION}


@app.get("/familles", tags=["référentiel"])
def familles():
    return moteur.donnees()["familles"]


@app.get("/notes", tags=["référentiel"])
def notes(famille: Optional[str] = None, etage: Optional[Literal["tete", "coeur", "fond"]] = None,
          vegan: Optional[bool] = None, naturel: Optional[bool] = None, durable: Optional[bool] = None,
          usage: Optional[Literal["parfum", "arome"]] = Query(None, description="Notes utilisables pour ce domaine")):
    res = moteur.donnees()["notes"]
    if famille:
        res = [n for n in res if n["famille"] == famille]
    if etage:
        res = [n for n in res if n["etage"] == etage]
    for champ, val in (("vegan", vegan), ("naturel", naturel), ("durable", durable)):
        if val is not None:
            res = [n for n in res if n[champ] == val]
    if usage:
        res = [n for n in res if n["usage"] in (usage, "les_deux")]
    return {"nombre": len(res), "notes": res}


@app.get("/notes/{note_id}", tags=["référentiel"], summary="Fiche matière")
def fiche(note_id: str):
    n = moteur.donnees()["par_id"].get(note_id)
    if not n:
        raise HTTPException(404, f"Note inconnue : {note_id}. La liste est sur GET /notes.")
    return n


@app.get("/ambiances", tags=["référentiel"])
def ambiances():
    return moteur.donnees()["ambiances"]


@app.get("/questions", tags=["profil"], summary="Les 5 questions du profil (images, sons, mots)")
def questions():
    return moteur.donnees()["questions"]


@app.get("/kit", tags=["offres"], summary="Kit atelier : 30 notes de base")
def kit():
    return moteur.kit_atelier()


@app.post("/analyse-brief", tags=["séance"], summary="Champs entendus dans le brief, avec leur citation")
def analyse_brief(corps: BriefIn):
    return moteur.analyser_brief(corps.brief)


@app.post("/profil", tags=["profil"], summary="Roue olfactive à partir des réponses (et du brief)")
def profil(corps: ProfilIn):
    analyse = moteur.analyser_brief(corps.brief) if corps.brief else None
    return moteur.calculer_roue(corps.reponses, analyse, corps.ajustements)


@app.post("/recommandation", tags=["offres"], summary="Roue, plateau de notes, 3 pistes et alertes")
def recommandation(corps: RecommandationIn):
    return moteur.recommander(corps.brief, corps.reponses, list(corps.engagements), corps.format, corps.taille,
                              corps.domaine, corps.ajustements)


@app.post("/variation", tags=["offres"], summary="Appliquer « plus frais », « moins boisé »… à des dosages")
def variation(corps: VariationIn):
    inconnues = [k for k in corps.dosages if k not in moteur.donnees()["par_id"]]
    if inconnues:
        raise HTTPException(422, f"Notes inconnues : {', '.join(inconnues)}")
    return moteur.varier(corps.dosages, corps.demande)


@app.post("/parfums-proches", tags=["offres"], summary="Parfums existants les plus proches d'une roue")
def proches(corps: RoueIn):
    return moteur.parfums_proches(corps.roue, corps.n)


@app.get("/metriques", tags=["service"], summary="Résultats de la dernière évaluation sur les 30 cas")
def metriques():
    chemin = moteur.RACINE / "evaluation" / "resultats.json"
    if not chemin.exists():
        raise HTTPException(404, "Pas encore d'évaluation : lancer python evaluation/evaluate.py")
    res = json.loads(chemin.read_text(encoding="utf-8"))
    return {"empreinte_cas": res["empreinte_cas"],
            "resultats": [{k: v for k, v in r.items() if k != "detail"} for r in res["resultats"]]}


@app.get("/duels", tags=["profil"], summary="Les 5 duels du profil V3 (images, sons ou mots)")
def duels():
    return moteur.donnees()["duels"]


@app.get("/modele-brief", tags=["séance"], summary="Modèle de brief à télécharger, remplir et réimporter")
def modele_brief():
    return moteur.donnees()["modele_brief"]


@app.post("/brief", tags=["séance"], summary="Brief V3 : ce qu'Aurore a entendu et les champs à compléter")
def brief(corps: BriefIn):
    return moteur.analyser_brief(corps.brief)["brief"]


@app.post("/brief/import", tags=["séance"], summary="Importer un brief rempli à partir du modèle")
def brief_import(document: dict):
    return moteur.importer_brief(document)


@app.get("/banque-references", tags=["référentiel"], summary="Banque de références (fictive pour la démonstration)")
def banque_references(domaine: Optional[Domaine] = None):
    refs = moteur.donnees()["references"]
    return [r for r in refs if not domaine or r["domaine"] == domaine]


@app.post("/references", tags=["offres"], summary="3 références proches, expliquées par leur lien au projet")
def references(corps: RecommandationIn):
    r = moteur.recommander(corps.brief, corps.reponses, list(corps.engagements), corps.format, corps.taille,
                           corps.domaine, corps.ajustements)
    return {"references_proches": r["references_proches"], "roue": r["roue"], "domaine": r["domaine"]}


@app.post("/potentiel", tags=["espace business"], summary="Évaluation du potentiel, critère par critère (Business 05)")
def potentiel(corps: RecommandationIn):
    r = moteur.recommander(corps.brief, corps.reponses, list(corps.engagements), corps.format, corps.taille,
                           corps.domaine, corps.ajustements)
    return {"potentiel": r["potentiel"], "brief": r["brief"], "references_proches": r["references_proches"]}


@app.post("/formule", tags=["offres"], summary="Deux versions de formule à partir des fioles aimées")
def formule(corps: FormuleIn):
    return moteur.proposer_formule(dict(corps.avis), corps.domaine)


@app.get("/notes/{note_id}/pourquoi", tags=["aide"], summary="« Pourquoi cette note ? », avec ses sources")
def pourquoi(note_id: str, brief: str = ""):
    if note_id not in moteur.donnees()["par_id"]:
        raise HTTPException(404, f"Note inconnue : {note_id}.")
    return moteur.expliquer_note(note_id, brief)
