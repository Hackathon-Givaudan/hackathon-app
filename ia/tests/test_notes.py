"""Tests sans modèle de langage : pick_tags est neutralisé, seul le recoupement de mots joue."""

import pytest

from app import notes
from app.references import REFERENCES, slug


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: [])


def test_every_reference_has_notes_and_tags():
    for universe, references in REFERENCES.items():
        assert len(references) == 20, universe
        for reference in references:
            assert reference.notes and reference.tags, reference.id


def test_sea_wishes_give_sea_notes():
    found = notes.propose_notes("parfum", "Une bougie qui rappelle le bord de mer")
    assert "sel-marin" in [note["id"] for note in found]
    assert len(found) <= notes.MAX_NOTES
    assert all(note["reason"] for note in found)


def test_notes_only_come_from_the_referential():
    known = {slug(label) for reference in REFERENCES["arome"] for label in reference.notes}
    found = notes.propose_notes("arome", "Une boisson protéinée gourmande pour le dessert")
    assert found and {note["id"] for note in found} <= known


def test_unknown_wishes_give_no_notes():
    assert notes.propose_notes("parfum", "azerty qwerty zzzz") == []
