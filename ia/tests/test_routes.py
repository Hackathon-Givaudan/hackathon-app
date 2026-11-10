"""Tests des routes, sans modèle de langage : ce que l'API reçoit quand elle appelle le service."""

import pytest
from fastapi.testclient import TestClient

from app import notes
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: None)


def test_health_counts_the_references():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "references": {"parfum": 20, "arome": 20}}


def test_notes_have_the_fields_the_api_expects():
    response = client.post("/notes", json={"universe": "parfum", "wishes": "Une bougie, bord de mer"})
    assert response.status_code == 200
    for note in response.json()["notes"]:
        assert set(note) == {"id", "label", "family", "reason"}


def test_wishes_that_match_nothing_answer_422():
    response = client.post("/notes", json={"universe": "parfum", "wishes": "azerty qwerty"})
    assert response.status_code == 422


def test_an_unknown_universe_is_refused():
    response = client.post("/notes", json={"universe": "voiture", "wishes": "bord de mer"})
    assert response.status_code == 422


def test_wishes_longer_than_the_contract_allows_are_refused():
    # Ces envies seraient reconnues : seule leur longueur (plus de 2000 caractères) les fait refuser
    response = client.post("/notes", json={"universe": "parfum", "wishes": "bord de mer " * 200})
    assert response.status_code == 422
