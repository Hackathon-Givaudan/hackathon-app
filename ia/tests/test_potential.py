"""Le potentiel d'un brief : 7 critères écrits noir sur blanc, chacun avec sa raison."""

from fastapi.testclient import TestClient

from app.main import app
from app.potential import evaluate

client = TestClient(app)

STRONG = {
    "target": "grand_public",
    "salesCountries": ["france"],
    "annualVolumeKg": 800,
    "budgetPerKg": 120,
    "competition": "seulement_givaudan",
    "closestReference": "Écume Saline",
}


def by_id(result):
    return {criterion["id"]: criterion for criterion in result["criteria"]}


def test_there_are_always_seven_criteria_with_a_reason():
    result = evaluate({})
    assert len(result["criteria"]) == 7
    assert all(criterion["reason"] for criterion in result["criteria"])


def test_an_unknown_field_is_to_complete_not_guessed():
    assert {c["status"] for c in evaluate({})["criteria"]} <= {"a_completer", "a_verifier"}


def test_a_complete_brief_sold_in_france_is_a_priority():
    result = evaluate(STRONG)
    assert result["suggestion"] == "prioriser"
    assert by_id(result)["pays_vente"]["status"] == "favorable"


def test_selling_outside_europe_asks_for_a_check():
    result = evaluate({**STRONG, "salesCountries": ["etats_unis"]})
    assert by_id(result)["faisabilite_reglementaire"]["status"] == "a_verifier"
    assert "États-Unis" in by_id(result)["pays_vente"]["reason"]


def test_the_volume_threshold_stays_unknown():
    # Givaudan n'a pas donné de seuil : il s'affiche [X], comme dans la maquette
    assert "[X]" in by_id(evaluate(STRONG))["volume"]["reason"]


def test_an_empty_brief_is_put_on_hold():
    assert evaluate({})["suggestion"] == "mettre_en_attente"


def test_the_route_refuses_a_value_outside_the_lists():
    assert client.post("/potential", json=STRONG).status_code == 200
    assert client.post("/potential", json={"target": "martiens"}).status_code == 422


def test_a_flavour_brief_is_not_checked_like_a_perfume():
    # L'IFRA ne concerne que les parfums, et un arôme est vérifié par un aromaticien
    flavour = {**STRONG, "universe": "arome", "commitments": ["sans_allergenes"]}
    reason = by_id(evaluate(flavour))["faisabilite_reglementaire"]["reason"]
    assert "IFRA" not in reason and "parfumeur" not in reason
    assert "aromaticien" in reason


def test_a_perfume_brief_keeps_the_ifra_check():
    assert "IFRA" in by_id(evaluate(STRONG))["faisabilite_reglementaire"]["reason"]
