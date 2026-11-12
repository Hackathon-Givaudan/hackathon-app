"""La séance avec Aurore, sans modèle : ce qu'elle entend, ce qu'elle demande ensuite, quand elle s'arrête."""

import pytest
from fastapi.testclient import TestClient

from app import notes, session
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: None)


def turn(universe, said, heard=()):
    return session.next_turn(universe, said, list(heard))


def test_aurore_opens_the_session():
    answer = turn("parfum", "")
    assert answer["reply"] == "Racontez-moi votre projet."
    assert answer["heard"] == [] and answer["done"] is False


def test_what_she_hears_carries_the_words_of_the_brand():
    answer = turn("parfum", "Une bougie pour un restaurant en bord de mer")
    assert {"kind": "usage", "label": "bougie", "quote": "Une bougie pour un restaurant en bord de mer"} in answer["heard"]
    assert {"kind": "ambiance", "label": "bord de mer", "quote": "Une bougie pour un restaurant en bord de mer"} in answer["heard"]


def test_she_asks_for_what_is_still_missing():
    answer = turn("parfum", "Une bougie pour un restaurant en bord de mer")
    assert answer["done"] is False
    assert "ressentir" in answer["reply"]  # le produit et l'ambiance sont connus : il manque l'émotion


def test_the_session_ends_once_she_has_the_three_ideas():
    heard = turn("parfum", "Une bougie pour un restaurant en bord de mer")["heard"]
    answer = turn("parfum", "De l'évasion", heard)
    assert answer["done"] is True
    assert {idea["label"] for idea in answer["heard"]} == {"bougie", "bord de mer", "évasion"}


def test_words_she_does_not_understand_add_nothing():
    answer = turn("parfum", "xyz qsdf")
    assert answer["heard"] == [] and answer["done"] is False
    assert "pas saisi" in answer["reply"]


def test_a_flavour_sensation_is_filed_as_a_sensation():
    answer = turn("arome", "Quelque chose de crémeux")
    assert {"kind": "sensation", "label": "crémeux", "quote": "Quelque chose de crémeux"} in answer["heard"]


def test_the_route_answers_a_turn():
    response = client.post("/session/turn", json={"universe": "parfum", "said": "Une bougie", "heard": []})
    assert response.status_code == 200
    assert set(response.json()) == {"reply", "heard", "done"}
