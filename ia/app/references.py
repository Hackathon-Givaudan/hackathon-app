"""Charge les références (parfums et arômes) depuis les fichiers CSV de data/."""

import csv
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

# Colonnes de chaque fichier : les niveaux de notes, les étiquettes qui décrivent la référence, ses usages
COLUMNS = {
    "parfum": {
        "file": "parfums.csv",
        "family": "famille_olfactive",
        "tiers": {"Tête": "notes_de_tete", "Cœur": "notes_de_coeur", "Fond": "notes_de_fond"},
        "tags": ["ambiances", "emotions"],
        "uses": "usages_compatibles",
    },
    "arome": {
        "file": "aromes.csv",
        "family": "famille_aromatique",
        "tiers": {"Dominante": "note_dominante", "Secondaires": "notes_secondaires", "Finale": "finale_en_bouche"},
        "tags": ["moments_de_consommation", "sensations", "emotions"],
        "uses": "applications_compatibles",
    },
}


@dataclass
class Reference:
    id: str
    name: str
    family: str
    tiers: dict[str, list[str]]  # niveau -> notes, par exemple "Tête" -> ["sel marin", "algue"]
    tags: list[str]  # ambiances, émotions et usages
    uses: list[str]  # les usages seuls : bougie, yaourt…
    source: str

    @property
    def notes(self) -> list[str]:
        return [note for notes in self.tiers.values() for note in notes]


def slug(text: str) -> str:
    """« Fleur d'oranger » devient « fleur-d-oranger » : sert d'identifiant de note."""
    plain = unicodedata.normalize("NFD", text.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


def split(cell: str) -> list[str]:
    return [value.strip() for value in cell.split("|") if value.strip()]


def load(universe: str) -> list[Reference]:
    columns = COLUMNS[universe]
    with open(DATA_DIR / columns["file"], encoding="utf-8") as file:
        return [
            Reference(
                id=row["id"],
                name=row["nom_reference"],
                family=row[columns["family"]],
                tiers={tier: split(row[column]) for tier, column in columns["tiers"].items()},
                tags=[tag for column in [*columns["tags"], columns["uses"]] for tag in split(row[column])],
                uses=split(row[columns["uses"]]),
                source=row["source"],
            )
            for row in csv.DictReader(file)
        ]


REFERENCES = {universe: load(universe) for universe in COLUMNS}


def all_tags(universe: str) -> list[str]:
    """Toutes les étiquettes connues d'un univers, sans doublon : le vocabulaire imposé au modèle."""
    return sorted({tag for reference in REFERENCES[universe] for tag in reference.tags})
