"""Service Data/IA : ses routes sont appelées par l'API (api/), jamais par le navigateur."""

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .formula import propose_formula
from .notes import propose_notes
from .references import REFERENCES

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
