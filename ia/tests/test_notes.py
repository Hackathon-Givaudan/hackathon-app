"""Tests sans modèle de langage : pick_tags est neutralisé, seul le recoupement de mots joue."""

import pytest

from app import notes
from app.references import REFERENCES, slug


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: None)


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


def test_a_short_answer_like_ete_is_recognised():
    found = notes.propose_notes("parfum", "Ambiance : été.")
    assert "orange-douce" in [note["id"] for note in found]  # Terrasse au Soleil


def test_the_mood_weighs_more_than_the_product():
    # « bougie » est dans 11 références sur 20, « jardin » dans une poignée : c'est lui qui doit décider
    found = notes.propose_notes("parfum", "Produit : bougie. Ambiance : jardin. Émotion : calme.")
    assert found[0]["reason"] == "Évoque « jardin »"


def test_two_different_wishes_both_get_notes():
    # Aucune référence ne porte à la fois « hiver » et « joie » : les notes doivent venir des deux
    found = notes.propose_notes("parfum", "Ambiance : hiver. Émotion : joie.")
    assert {note["reason"] for note in found} == {"Évoque « hiver »", "Évoque « joie »"}


def test_a_product_is_a_use_not_an_evocation():
    found = notes.propose_notes("arome", "Produit : yaourt.")
    assert {note["reason"] for note in found} == {"Convient pour : yaourt"}


def test_glace_the_product_is_not_glace_the_sensation():
    found = notes.propose_notes("arome", "Produit : glace.")
    assert {note["reason"] for note in found} == {"Convient pour : glace"}


def test_wishes_typed_without_accents_are_still_recognised():
    found = notes.propose_notes("parfum", "une ambiance d'ete")
    assert "orange-douce" in [note["id"] for note in found]


def test_the_wish_weighs_more_than_the_product():
    # Une glace pour l'été, fraîche : des notes fraîches, pas le caramel qui « convient pour une glace »
    found = notes.propose_notes("arome", "Produit : glace. Ambiance : été. Émotion : fraîcheur.")
    assert "caramel" not in [note["id"] for note in found]
    assert all(note["reason"].startswith("Évoque") for note in found)


def test_the_longest_wording_wins():
    # « boisson protéinée » ne doit pas être lue comme « boisson » tout court
    found = notes.propose_notes("arome", "Produit : boisson protéinée.")
    assert {note["reason"] for note in found} == {"Convient pour : boisson protéinée"}


def test_the_model_verdict_is_final_even_if_a_word_matches(monkeypatch):
    # « voiture » est une étiquette, mais le modèle a jugé que ce texte ne décrit aucun projet
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: [])
    assert notes.propose_notes("parfum", "ma voiture est en panne") == []


def test_the_words_of_the_brand_are_kept_when_the_model_answers(monkeypatch):
    # Ticket #58 : le modèle répond « gourmand », la marque avait choisi « gourmandise »
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: ["dessert", "gourmand", "yaourt"])
    found = notes.propose_notes("arome", "Produit : yaourt. Ambiance : dessert. Émotion : gourmandise.")
    assert found[0]["family"] == "Vanillé"  # Vanille Bourbon Douce : dessert, gourmandise et yaourt
    kept = notes.find_tags("arome", "Produit : yaourt. Ambiance : dessert. Émotion : gourmandise.")
    assert {"gourmandise", "gourmand"} <= set(kept)  # le mot de la marque reste, celui du modèle s'ajoute


def test_a_reference_made_for_the_product_comes_first(monkeypatch):
    # Ticket #58 : le produit départage. Linge Propre évoque « propreté » et est faite pour la lessive
    monkeypatch.setattr(notes, "pick_tags", lambda wishes, tags: ["lessive", "propreté", "douceur", "confiance"])
    found = notes.propose_notes("parfum", "On lance une lessive pour bébé, que ça sente le propre.")
    assert found[0]["family"] == "Musquée"
    assert found[0]["reason"] == "Évoque « propreté »"
