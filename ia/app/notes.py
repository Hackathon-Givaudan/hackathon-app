"""Des envies aux notes.

Tout est déterministe, sauf pick_tags qui interroge le modèle.
Aucune note n'est inventée : tout vient des fichiers de data/.
"""

import re

from .llm import pick_tags
from .references import REFERENCES, Reference, all_tags, slug

MAX_NOTES = 6


def spelled(text: str) -> str:
    """Comme slug, mais garde les accents : « glace » (le produit) n'est pas « glacé » (la sensation)."""
    return re.sub(r"\W+", "-", text.lower()).strip("-")


def mentions(wishes: str, tag: str, normalise=slug) -> bool:
    """L'étiquette figure-t-elle telle quelle dans les envies ? « été » oui, « spray d'ambiance » non pour « ambiance »."""
    return f"-{normalise(tag)}-" in f"-{normalise(wishes)}-"


def written_tags(universe: str, wishes: str) -> list[str]:
    """Étiquettes du référentiel que la marque a écrites telles quelles dans ses envies."""
    tags = all_tags(universe)
    exact = [tag for tag in tags if mentions(wishes, tag, spelled)]
    # Sans les accents (« ete »), sauf si l'orthographe exacte a déjà tranché
    loose = [tag for tag in tags if mentions(wishes, tag) and slug(tag) not in {slug(kept) for kept in exact}]
    found = exact + loose
    # « boisson » s'efface devant « boisson protéinée » : la formulation la plus longue l'emporte
    return [tag for tag in found if not any(tag != other and mentions(other, tag) for other in found)]


def find_tags(universe: str, wishes: str) -> list[str]:
    """Étiquettes qui correspondent aux envies : les mots de la marque, puis ce que le modèle ajoute."""
    written = written_tags(universe, wishes)
    chosen = pick_tags(wishes, all_tags(universe))
    if chosen is None:  # le modèle n'a rien dit d'exploitable
        return written
    if not chosen:  # son verdict : ce texte ne décrit aucun projet
        return []
    # Les mots écrits par la marque restent ; le modèle ajoute ce qu'elle a dit autrement
    return written + [tag for tag in chosen if tag not in written]


def propose_notes(universe: str, wishes: str) -> list[dict]:
    """Geste 1 : propose jusqu'à 6 notes, chacune avec l'étiquette qui la justifie."""
    references = REFERENCES[universe]
    tags = find_tags(universe, wishes)

    def rarity(tag: str) -> float:
        """Une étiquette rare départage mieux : « bord de mer » (2 références) pèse plus que « bougie » (11)."""
        return 1 / sum(tag in reference.tags for reference in references)

    def shared(reference: Reference) -> list[str]:
        """Étiquettes voulues que la référence porte, la plus rare d'abord."""
        return sorted((tag for tag in tags if tag in reference.tags), key=rarity, reverse=True)

    def reason(reference: Reference) -> str:
        """Une ambiance ou une émotion s'évoque ; un produit, on dit seulement qu'il convient."""
        evoked = [tag for tag in shared(reference) if tag not in reference.uses]
        return f"Évoque « {evoked[0]} »" if evoked else f"Convient pour : {shared(reference)[0]}"

    def score(reference: Reference) -> float:
        """L'usage compte moitié moins : il dit où ira la création, pas ce qu'elle doit évoquer."""
        return sum(rarity(tag) / (2 if tag in reference.uses else 1) for tag in shared(reference))

    # Les références proches de la meilleure (au moins la moitié de son score), trois au plus
    # Le produit demandé : celui que la marque a écrit, sinon celui que le modèle a compris
    all_uses = {use for reference in references for use in reference.uses}
    written = written_tags(universe, wishes)
    named = {tag for tag in written if tag in all_uses} or {tag for tag in tags if tag in all_uses}

    def suits(reference: Reference) -> bool:
        """La référence est-elle faite pour le produit demandé ?"""
        return bool(named & set(reference.uses))

    # La meilleure référence faite pour le produit ouvre la liste ; les autres suivent, par score
    best = sorted(filter(suits, references), key=score, reverse=True)[:1]
    ranked = best + sorted((reference for reference in references if reference not in best), key=score, reverse=True)
    close = [reference for reference in ranked[:3] if score(reference) and score(reference) >= score(ranked[0]) / 2]

    # Une note de chaque référence à tour de rôle : deux envies différentes reçoivent chacune leurs notes
    notes: list[dict] = []
    for rank in range(MAX_NOTES):
        for reference in close:
            label = reference.notes[rank] if rank < len(reference.notes) else None
            if label and len(notes) < MAX_NOTES and slug(label) not in {note["id"] for note in notes}:
                notes.append(
                    {
                        "id": slug(label),
                        "label": label,
                        "family": reference.family,
                        "reason": reason(reference),
                    }
                )
    return notes
