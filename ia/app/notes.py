"""Des envies aux notes.

Tout est déterministe, sauf pick_tags qui interroge le modèle.
Aucune note n'est inventée : tout vient des fichiers de data/.
"""

from .llm import pick_tags
from .references import REFERENCES, Reference, all_tags, slug

MAX_NOTES = 6


def words(text: str) -> set[str]:
    """Mots utiles d'un texte : sans accents, sans mots de 3 lettres ou moins."""
    return {word for word in slug(text).split("-") if len(word) > 3}


def find_tags(universe: str, wishes: str) -> list[str]:
    """Étiquettes du référentiel qui correspondent aux envies : le modèle d'abord, les mots ensuite."""
    tags = all_tags(universe)
    chosen = pick_tags(wishes, tags)
    if chosen:
        return chosen
    wished = words(wishes)
    return [tag for tag in tags if words(tag) & wished]


def propose_notes(universe: str, wishes: str) -> list[dict]:
    """Geste 1 : propose jusqu'à 6 notes, chacune avec l'étiquette qui la justifie."""
    tags = find_tags(universe, wishes)

    def shared(reference: Reference) -> list[str]:
        return [tag for tag in tags if tag in reference.tags]

    ranked = sorted(REFERENCES[universe], key=lambda reference: len(shared(reference)), reverse=True)
    notes: list[dict] = []
    for reference in ranked[:3]:
        if not shared(reference):
            break
        for label in reference.notes:
            if len(notes) < MAX_NOTES and slug(label) not in {note["id"] for note in notes}:
                notes.append(
                    {
                        "id": slug(label),
                        "label": label,
                        "family": reference.family,
                        "reason": f"Évoque « {shared(reference)[0]} »",
                    }
                )
    return notes
