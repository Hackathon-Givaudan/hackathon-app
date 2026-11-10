"""Des notes validées à une formule : la référence de la banque la plus proche, avec son explication.

Rien n'est inventé : la formule est une référence existante de data/, jamais du sur-mesure.
Tout est déterministe. Un rédacteur (le modèle) peut proposer l'explication, mais elle n'est gardée
que si elle ne cite aucune note absente de la formule ; sinon la phrase construite ici la remplace.
"""

from collections.abc import Callable

from .notes import mentions
from .references import REFERENCES, Reference, slug

# Reçoit les faits de la formule, renvoie une explication, ou None s'il ne répond pas
Writer = Callable[[dict], str | None]


def listed(labels: list[str]) -> str:
    """« sel marin, algue et bergamote »."""
    return labels[0] if len(labels) == 1 else f"{', '.join(labels[:-1])} et {labels[-1]}"


def shares(count: int) -> list[int]:
    """Parts entières et égales, dont la somme vaut 100. Illustratives : la banque ne donne pas de proportions."""
    return [100 // count + (1 if rank < 100 % count else 0) for rank in range(count)]


def closest(universe: str, wishes: str, note_ids: list[str]) -> Reference | None:
    """La référence qui contient le plus de notes validées. À égalité, celle dont l'usage est demandé."""

    def kept(reference: Reference) -> int:
        return sum(slug(label) in note_ids for label in reference.notes)

    def wanted_uses(reference: Reference) -> int:
        return sum(mentions(wishes, use) for use in reference.uses)

    best = max(REFERENCES[universe], key=lambda reference: (kept(reference), wanted_uses(reference)))
    return best if kept(best) else None


def explain(reference: Reference, note_ids: list[str], rejected_note_ids: list[str]) -> str:
    """La phrase du code : les notes validées retrouvées, puis, honnêtement, celles que la marque avait écartées."""
    found = [label for label in reference.notes if slug(label) in note_ids]
    rejected = [label for label in reference.notes if slug(label) in rejected_note_ids]
    text = (
        f"Parmi nos références existantes, {reference.name} est la plus proche de vos choix : "
        f"elle contient {listed(found)} (famille {reference.family})."
    )
    if len(rejected) == 1:
        text += f" Elle contient aussi une note que vous aviez écartée : {rejected[0]}."
    elif rejected:
        text += f" Elle contient aussi des notes que vous aviez écartées : {listed(rejected)}."
    return text


def cites_only(text: str, reference: Reference, universe: str) -> bool:
    """Vrai si le texte ne cite aucune note du référentiel absente de la formule."""
    # Les notes de la formule sont retirées d'abord, les plus longues en tête :
    # « musc blanc » ne doit pas être lu comme la note « musc » d'une autre référence
    remaining = f" {text.lower()} "
    for label in sorted(reference.notes, key=len, reverse=True):
        remaining = remaining.replace(label.lower(), " ")
    others = {label for other in REFERENCES[universe] for label in other.notes} - set(reference.notes)
    return not any(mentions(remaining, label) for label in others)


def propose_formula(
    universe: str,
    wishes: str,
    note_ids: list[str],
    rejected_note_ids: list[str] | None = None,
    write: Writer | None = None,
) -> dict | None:
    """Geste 3 : la formule au format Formula de openapi.yaml, ou None si aucune référence ne contient ces notes."""
    reference = closest(universe, wishes, note_ids)
    if reference is None:
        return None

    # Le niveau (Tête, Cœur, Fond…) tient lieu de famille : c'est ce que l'écran de la formule affiche
    labels = [(tier, label) for tier, tier_labels in reference.tiers.items() for label in tier_labels]
    formula = {
        "id": reference.id,
        "name": reference.name,
        "notes": [
            {"note": {"id": slug(label), "label": label, "family": tier}, "share": share}
            for (tier, label), share in zip(labels, shares(len(labels)))
        ],
        "explanation": explain(reference, note_ids, rejected_note_ids or []),
        "source": reference.source,
    }
    written = write(formula) if write else None
    if written and cites_only(written, reference, universe):
        formula["explanation"] = written
    return formula
