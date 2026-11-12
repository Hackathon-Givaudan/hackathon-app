"""La fiche matière : ce que la Data a documenté sur une note, rien d'inventé."""

from fastapi.testclient import TestClient

from app import materials
from app.main import app

client = TestClient(app)


def test_a_documented_note_has_its_sheet():
    sheet = materials.find("bergamote")
    assert sheet["name"] == "Bergamote"
    assert sheet["origin"] == "Calabre, Italie"
    assert sheet["obtained"] == "expression à froid du zeste"
    assert sheet["sources"]


def test_the_sheet_uses_our_note_ids():
    # Chez Ali « fleur_d_oranger » ; chez nous, l'identifiant vient du nom : « fleur-d-oranger »
    assert materials.find("fleur-d-oranger")["name"] == "Fleur d'oranger"


def test_a_precision_in_brackets_does_not_change_the_id():
    # Chez Ali « Sel marin (accord) » ; chez nous, la note s'appelle « sel marin »
    assert materials.find("sel-marin")["name"] == "Sel marin (accord)"


def test_related_notes_are_given_by_name():
    # Ali les range par identifiant (« bergamote », « musc ») ; la marque lit leur nom
    assert materials.find("fleur-d-oranger")["pairsWith"][:2] == ["Bergamote", "Musc blanc"]


def test_a_deduced_fact_is_not_shown_as_a_sourced_one():
    # La tenue de la fleur d'oranger est « déduite de l'étage », pas confirmée par une source
    assert "hold" not in materials.find("fleur-d-oranger")


def test_an_empty_field_is_left_out_rather_than_invented():
    for sheet in materials.SHEETS.values():
        assert all(value not in ("", None, []) for value in sheet.values())


def test_an_unknown_note_has_no_sheet():
    assert materials.find("vanille-imaginaire") is None


def test_the_route_answers_the_sheet_or_404():
    assert client.get("/materials/bergamote").json()["name"] == "Bergamote"
    assert client.get("/materials/vanille-imaginaire").status_code == 404
