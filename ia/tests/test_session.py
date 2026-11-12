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


def test_the_route_refuses_an_oversized_list_of_ideas():
    idea = {"kind": "usage", "label": "bougie", "quote": "Une bougie"}
    response = client.post("/session/turn", json={"universe": "parfum", "said": "Une bougie", "heard": [idea] * 51})
    assert response.status_code == 422


def model_says(monkeypatch, tags):
    """Le modèle répond toujours `tags`, quoi que dise la marque."""
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, all_tags: tags)


def test_a_short_answer_is_kept_even_if_the_model_says_it_is_no_project(monkeypatch):
    # Ticket #81 : pour « plutôt l'hiver », le modèle renvoie une liste vide
    model_says(monkeypatch, [])
    answer = turn("parfum", "plutôt l'hiver")
    assert [idea["label"] for idea in answer["heard"]] == ["hiver"]


def test_ideas_the_brand_did_not_say_are_dropped(monkeypatch):
    # Ticket #81 : le modèle ajoute « parfum », « intimité », « romantisme »
    model_says(monkeypatch, ["bord de mer", "bougie", "parfum", "intimité", "romantisme"])
    answer = turn("parfum", "Une bougie pour un restaurant en bord de mer")
    assert {idea["label"] for idea in answer["heard"]} == {"bougie", "bord de mer"}
    assert answer["done"] is False  # Aurore demande encore l'émotion


def test_a_word_of_the_same_family_is_kept(monkeypatch):
    model_says(monkeypatch, ["élégance", "réconfort"])
    answer = turn("parfum", "Quelque chose d'élégant et de réconfortant")
    assert {idea["label"] for idea in answer["heard"]} == {"élégance", "réconfort"}


def test_a_long_label_needs_all_its_words(monkeypatch):
    # « la salle du restaurant » ne veut pas dire « salle de bain »
    model_says(monkeypatch, ["salle de bain"])
    assert turn("parfum", "Pour la salle du restaurant")["heard"] == []


def test_the_route_refuses_an_idea_outside_the_referential():
    idea = {"kind": "usage", "label": "tracteur", "quote": "Un tracteur"}
    response = client.post("/session/turn", json={"universe": "parfum", "said": "bonjour", "heard": [idea]})
    assert response.status_code == 422


def test_the_route_refuses_an_idea_with_the_wrong_kind():
    idea = {"kind": "emotion", "label": "bougie", "quote": "Une bougie"}
    response = client.post("/session/turn", json={"universe": "parfum", "said": "bonjour", "heard": [idea]})
    assert response.status_code == 422


def test_a_short_word_of_the_same_family_is_kept(monkeypatch):
    # « Le soir » pour « soirée » : le mot de la marque est plus court que la racine
    model_says(monkeypatch, ["soirée"])
    assert [idea["label"] for idea in turn("parfum", "Le soir")["heard"]] == ["soirée"]


def test_a_word_of_the_same_family_is_heard_without_the_model(monkeypatch):
    model_says(monkeypatch, [])  # le modèle ne propose rien
    assert [idea["label"] for idea in turn("parfum", "Le soir")["heard"]] == ["soirée"]


def test_a_short_word_is_not_enough_for_a_long_label(monkeypatch):
    # « à bord du bateau » ne veut pas dire « bord de mer »
    model_says(monkeypatch, [])
    assert "bord de mer" not in [idea["label"] for idea in turn("parfum", "À bord du bateau")["heard"]]


def labels(universe, said):
    return [idea["label"] for idea in turn(universe, said)["heard"]]


def test_two_labels_that_differ_by_an_accent_stay_apart():
    # « glace » (le produit) et « glacé » (la sensation) sont deux étiquettes
    assert labels("arome", "Une glace") == ["glace"]
    assert labels("arome", "glacé") == ["glacé"]


def test_a_word_that_is_already_a_label_brings_no_relative():
    # « gourmand » est une étiquette : il ne fait pas entendre aussi « gourmandise »
    assert labels("arome", "gourmand") == ["gourmand"]


@pytest.mark.parametrize(
    "said, false_friend",
    [
        ("Un yaourt à la fraise", "frais"),
        ("une note de bois", "boisson"),
        ("de la chaleur", "chalet"),
        ("un goût de confiture", "confiserie"),
    ],
)
def test_a_false_friend_is_not_heard(said, false_friend):
    assert false_friend not in labels("arome", said) + labels("parfum", said)
