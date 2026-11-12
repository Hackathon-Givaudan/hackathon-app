"""Service Data/IA : ses routes sont appelées par l'API (api/), jamais par le navigateur."""

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from .formula import propose_formula
from .materials import find as find_material
from .notes import propose_notes
from .potential import CHOICES
from .potential import evaluate as evaluate_potential
from .references import REFERENCES
from .session import next_turn

app = FastAPI(title="Service Data/IA", version="0.1.0")

Universe = Literal["parfum", "arome"]


class NotesRequest(BaseModel):
    universe: Universe
    wishes: str = Field(min_length=3, max_length=2000)


class FormulaRequest(BaseModel):
    universe: Universe
    wishes: str = Field(min_length=3, max_length=2000)
    noteIds: list[str] = Field(min_length=1)
    rejectedNoteIds: list[str] = []


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "references": {universe: len(items) for universe, items in REFERENCES.items()}}


@app.post("/notes")
def notes(request: NotesRequest) -> dict:
    """Des envies en texte libre aux notes du référentiel."""
    found = propose_notes(request.universe, request.wishes)
    if not found:
        raise HTTPException(422, "Aucune note ne correspond à ces envies")
    return {"notes": found}


@app.post("/formula")
def formula(request: FormulaRequest) -> dict:
    """Des notes validées à la référence la plus proche de la banque, expliquée."""
    found = propose_formula(request.universe, request.wishes, request.noteIds, request.rejectedNoteIds)
    if not found:
        raise HTTPException(422, "Aucune référence ne contient ces notes")
    return found


class Idea(BaseModel):
    kind: Literal["usage", "ambiance", "emotion", "sensation"]
    label: str = Field(max_length=100)
    quote: str = Field(max_length=200)


class TurnRequest(BaseModel):
    universe: Universe
    said: str = Field(max_length=2000)  # vide pour ouvrir la séance
    heard: list[Idea] = Field(default=[], max_length=50)


@app.post("/session/turn")
def session_turn(request: TurnRequest) -> dict:
    """Un échange de la séance : ce qu'Aurore répond, et ce qu'elle a entendu depuis le début."""
    return next_turn(request.universe, request.said, [idea.model_dump() for idea in request.heard])


@app.get("/materials/{note_id}")
def material(note_id: str) -> dict:
    """La fiche matière d'une note : seulement ce qui est documenté."""
    sheet = find_material(note_id)
    if not sheet:
        raise HTTPException(404, "Cette note n'a pas encore de fiche")
    return sheet


class PotentialRequest(BaseModel):
    """Les champs du brief qui comptent pour le potentiel, tous facultatifs."""

    target: str | None = None
    salesCountries: list[str] = Field(default=[], max_length=10)
    annualVolumeKg: float | None = Field(default=None, ge=0)
    budgetPerKg: float | None = Field(default=None, ge=0)
    competition: str | None = None
    constraints: list[str] = Field(default=[], max_length=10)
    commitments: list[str] = Field(default=[], max_length=10)
    closestReference: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def only_known_values(self):
        # Une valeur hors des listes du brief est refusée plutôt que mal comprise
        fields = {
            "cible": [self.target],
            "pays_vente": self.salesCountries,
            "mise_en_concurrence": [self.competition],
            "contraintes": self.constraints,
            "engagements": self.commitments,
        }
        for field, values in fields.items():
            unknown = [value for value in values if value and value not in CHOICES[field]]
            if unknown:
                raise ValueError(f"Valeur inconnue pour {field} : {', '.join(unknown)}")
        return self


@app.post("/potential")
def potential(request: PotentialRequest) -> dict:
    """Le potentiel d'un brief pour le conseiller : 7 critères et une suggestion."""
    return evaluate_potential(request.model_dump())
