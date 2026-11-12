"""Deux versions d'une formule (plus fraîche, plus chaude) : la règle de data/deux_versions.md sur data/axes_notes.csv."""

import csv
import json

import pytest

from app.references import DATA_DIR, REFERENCES, slug


def load_axes() -> dict[str, dict]:
    with open(DATA_DIR / "axes_notes.csv", encoding="utf-8") as file:
        return {row["note_id"]: row for row in csv.DictReader(file)}


AXES = load_axes()


def accent(note_ids: list[str], axis: str) -> list[str]:
    """Les 2 notes les plus fortes sur l'axe ; à égalité, l'ordre alphabétique de note_id (règle, points 2 à 4)."""
    return sorted(set(note_ids), key=lambda note: (-int(AXES[note][axis]), note))[:2]


def two_versions(reference) -> dict[str, list[str]]:
    notes = [slug(label) for labels in reference.tiers.values() for label in labels]
    return {"fresher": accent(notes, "fraicheur"), "warmer": accent(notes, "chaleur")}


def test_every_perfume_note_has_axes_and_nothing_else():
    referential = {slug(label) for reference in REFERENCES["parfum"] for labels in reference.tiers.values() for label in labels}
    assert set(AXES) == referential


def test_axes_are_well_formed():
    for note_id, row in AXES.items():
        assert note_id == slug(row["note"]), note_id
        for axis in ("fraicheur", "chaleur"):
            assert row[axis].isdigit() and 0 <= int(row[axis]) <= 5, (note_id, axis)
        assert row["source"].startswith(("fiche ", "estimation : ")), note_id


def test_example_of_the_rule():
    reference = next(r for r in REFERENCES["parfum"] if r.id == "DEMO-F-012")
    assert two_versions(reference) == {"fresher": ["bergamote", "feuille-de-figuier"], "warmer": ["coco", "lait-de-figue"]}


def test_fresher_version_is_fresher_and_warmer_version_is_warmer():
    def mean(notes, axis):
        return sum(int(AXES[note][axis]) for note in notes) / len(notes)

    for reference in REFERENCES["parfum"]:
        versions = two_versions(reference)
        assert mean(versions["fresher"], "fraicheur") >= mean(versions["warmer"], "fraicheur"), reference.id
        assert mean(versions["warmer"], "chaleur") >= mean(versions["fresher"], "chaleur"), reference.id


def test_axes_taken_from_a_sheet_match_the_sheet():
    sheets_file = DATA_DIR / "notes_atelier.json"
    if not sheets_file.exists():
        pytest.skip("notes_atelier.json arrive avec la PR #86")
    sheets = {note["id"]: note for note in json.loads(sheets_file.read_text(encoding="utf-8"))["notes"]}
    for note_id, row in AXES.items():
        if row["source"].startswith("fiche "):
            sheet = sheets[row["source"].split()[1]]
            assert (int(row["fraicheur"]), int(row["chaleur"])) == (sheet["fraicheur"], sheet["chaleur"]), note_id
