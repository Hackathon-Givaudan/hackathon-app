"""Tests de la formule, sans modèle de langage : le choix de la référence, les parts, l'explication."""

import pytest
from fastapi.testclient import TestClient

from app.formula import propose_formula
from app.main import app
from app.references import REFERENCES, slug

client = TestClient(app)


def test_validated_notes_lead_to_the_closest_reference():
    formula = propose_formula("parfum", "Une bougie, bord de mer", ["sel-marin", "algue"])
    assert formula["name"] == "Écume Saline"
    assert "sel marin et algue" in formula["explanation"]


def test_the_formula_has_the_fields_of_the_contract():
    formula = propose_formula("parfum", "Une bougie, bord de mer", ["sel-marin"])
    assert set(formula) == {"id", "name", "notes", "explanation", "source", "nearby", "versions"}
    for item in formula["notes"]:
        assert set(item) == {"note", "share"}
        assert set(item["note"]) == {"id", "label", "family"}


@pytest.mark.parametrize("universe", ["parfum", "arome"])
def test_shares_sum_to_100_for_every_reference(universe):
    for reference in REFERENCES[universe]:
        formula = propose_formula(universe, "sans importance", [slug(reference.notes[0])])
        assert sum(item["share"] for item in formula["notes"]) == 100
        assert all(item["share"] >= 1 for item in formula["notes"])


def test_an_unknown_note_gives_no_formula():
    assert propose_formula("parfum", "Une bougie", ["note-inventee"]) is None


def test_a_tie_goes_to_the_reference_made_for_the_wanted_use():
    # « bergamote » est dans Écume Saline (bougie) et dans Savon d'Atelier (savon)
    assert propose_formula("parfum", "Produit : bougie.", ["bergamote"])["name"] == "Écume Saline"
    assert propose_formula("parfum", "Produit : savon.", ["bergamote"])["name"] == "Savon d'Atelier"


def test_a_rejected_note_still_in_the_formula_is_said():
    formula = propose_formula("parfum", "Une bougie", ["sel-marin", "algue"], ["bois-flotte"])
    assert "une note que vous aviez écartée : bois flotté" in formula["explanation"]


def test_no_rejected_note_no_warning():
    formula = propose_formula("parfum", "Une bougie", ["sel-marin", "algue"])
    assert "écartée" not in formula["explanation"]


def test_a_written_explanation_that_cites_an_absent_note_is_replaced():
    # « vanille » n'est pas dans Écume Saline : la phrase du rédacteur est rejetée
    def write(formula):
        return "Un accord marin relevé de vanille."

    formula = propose_formula("parfum", "Une bougie", ["sel-marin"], write=write)
    assert formula["explanation"].startswith("Parmi nos références existantes, Écume Saline")


def test_a_written_explanation_that_cites_only_the_formula_is_kept():
    # « musc blanc » est dans la formule : il ne doit pas être lu comme la note « musc » d'une autre référence
    def write(formula):
        return "Sel marin et musc blanc, pour une bougie qui évoque le large."

    formula = propose_formula("parfum", "Une bougie", ["sel-marin"], write=write)
    assert formula["explanation"] == "Sel marin et musc blanc, pour une bougie qui évoque le large."


def test_a_writer_that_does_not_answer_leaves_the_sentence_of_the_code():
    formula = propose_formula("parfum", "Une bougie", ["sel-marin"], write=lambda formula: None)
    assert formula["explanation"].startswith("Parmi nos références existantes")


def test_the_route_answers_a_formula():
    body = {"universe": "arome", "wishes": "Produit : yaourt.", "noteIds": ["vanille"], "rejectedNoteIds": []}
    response = client.post("/formula", json=body)
    assert response.status_code == 200
    assert response.json()["source"] == "fictif démo"


def test_the_route_answers_422_when_no_reference_holds_the_notes():
    response = client.post("/formula", json={"universe": "parfum", "wishes": "Une bougie", "noteIds": ["note-inventee"]})
    assert response.status_code == 422
    assert response.json() == {"detail": "Aucune référence ne contient ces notes"}


def test_the_route_refuses_an_empty_list_of_notes():
    response = client.post("/formula", json={"universe": "parfum", "wishes": "Une bougie", "noteIds": []})
    assert response.status_code == 422


def test_three_nearby_references_start_with_the_proposed_one():
    formula = propose_formula("parfum", "", ["sel-marin", "algue", "bergamote"])
    nearby = formula["nearby"]
    assert nearby[0]["id"] == formula["id"]
    assert 1 <= len(nearby) <= 3 and len({reference["id"] for reference in nearby}) == len(nearby)
    # Chacune dit ce qu'elle partage avec les notes gardées
    assert all(reference["shared"] and reference["why"] for reference in nearby)


def test_two_versions_follow_the_rule_of_the_data_team():
    # L'exemple de ia/data/deux_versions.md : DEMO-F-012
    kept = ["feuille-de-figuier", "bergamote", "lait-de-figue", "cedre", "coco"]
    formula = propose_formula("parfum", "", kept)
    assert formula["id"] == "DEMO-F-012"
    fresher, warmer = formula["versions"]
    assert fresher["accent"] == ["bergamote", "feuille de figuier"]
    assert warmer["accent"] == ["coco", "lait de figue"]


def test_a_flavour_formula_has_no_versions():
    # Les axes fraîcheur et chaleur n'existent que pour les parfums
    reference = REFERENCES["arome"][0]
    formula = propose_formula("arome", "", [slug(label) for label in reference.notes])
    assert formula["versions"] == []
