import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "pipeline"))
import build_data

def test_pipeline_sans_erreur_bloquante():
    rapport = build_data.construire()
    assert rapport["bloquants"] == []
    assert rapport["notes"] == 72 and rapport["familles"] == 9
