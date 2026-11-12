"""La fiche matière d'une note : origine, obtention, tenue, accords.

Les fiches viennent du travail d'Ali (équipe Data, data/notes_atelier.json). On n'affiche
que ce qui est confirmé par une source : un fait déduit ou vide reste hors de la fiche.
"""

import json

from .references import DATA_DIR, slug

TIERS = {"tete": "Tête", "coeur": "Cœur", "fond": "Fond"}


def confirmed(note: dict, field: str) -> bool:
    return note.get(f"{field}_statut", "").startswith("confirm")


def sheet(note: dict, names: dict[str, str]) -> dict:
    """Une note d'Ali devient une fiche, avec nos identifiants et sans champ vide."""
    found = {
        "noteId": slug(note["nom_fr"]),
        "name": note["nom_fr"],
        "family": note.get("famille_nom"),
        "tier": TIERS.get(note.get("etage")),
        "description": note.get("description_client"),
        "material": note.get("matiere"),
        "origin": note.get("origine") if confirmed(note, "origine") else None,
        "obtained": note.get("obtention"),
        "hold": note.get("tenue") if confirmed(note, "tenue") else None,
        "pairsWith": [names[other] for other in note.get("accords", []) if other in names],
        "vigilance": note.get("vigilance"),
        "sources": [url for url in (note.get("source_origine"), note.get("source_obtention")) if url],
    }
    return {key: value for key, value in found.items() if value not in ("", None, [])}


def load() -> dict[str, dict]:
    notes = json.loads((DATA_DIR / "notes_atelier.json").read_text(encoding="utf-8"))["notes"]
    names = {note["id"]: note["nom_fr"] for note in notes}
    return {slug(note["nom_fr"]): sheet(note, names) for note in notes}


SHEETS = load()


def find(note_id: str) -> dict | None:
    return SHEETS.get(note_id)
