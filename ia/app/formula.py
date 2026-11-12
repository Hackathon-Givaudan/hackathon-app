"""Des notes validées à une formule : la référence de la banque la plus proche, avec son explication.

Rien n'est inventé : la formule est une référence existante de data/, jamais du sur-mesure.
Tout est déterministe. Un rédacteur (le modèle) peut proposer l'explication, mais elle n'est gardée
que si elle ne cite aucune note absente de la formule ; sinon la phrase construite ici la remplace.
"""

import csv
from collections.abc import Callable

from .notes import mentions
from .references import DATA_DIR, REFERENCES, Reference, slug

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


def kept_in(reference: Reference, note_ids: list[str]) -> list[str]:
    """Les notes validées par la marque que la référence contient."""
    return [label for label in reference.notes if slug(label) in note_ids]


def nearby(universe: str, wishes: str, note_ids: list[str]) -> list[dict]:
    """Jusqu'à trois références proches, la proposée en premier. Même classement que `closest`."""

    def rank(reference: Reference) -> tuple[int, int]:
        return (len(kept_in(reference, note_ids)), sum(mentions(wishes, use) for use in reference.uses))

    ranked = sorted(REFERENCES[universe], key=rank, reverse=True)
    return [
        {
            "id": reference.id,
            "name": reference.name,
            "family": reference.family,
            "shared": kept_in(reference, note_ids),
            "why": f"Contient {listed(kept_in(reference, note_ids))}.",
        }
        for reference in ranked[:3]
        if kept_in(reference, note_ids)
    ]


def load_axes() -> dict[str, tuple[int, int]]:
    """La fraîcheur et la chaleur de chaque note de parfum, estimées par l'équipe Data (data/axes_notes.csv)."""
    with (DATA_DIR / "axes_notes.csv").open(encoding="utf-8") as file:
        return {row["note_id"]: (int(row["fraicheur"]), int(row["chaleur"])) for row in csv.DictReader(file)}


AXES = load_axes()


def versions(universe: str, reference: Reference, note_ids: list[str]) -> list[dict]:
    """Deux versions de la formule : plus fraîche, plus chaude. La règle est dans data/deux_versions.md.

    On part des notes validées que la formule contient, sinon de toute la formule. Chaque version met en avant
    deux notes : les plus fraîches, ou les plus chaudes. À égalité, l'ordre alphabétique de l'identifiant.
    Pas de dosage : les proportions sont fixées par le parfumeur. Les arômes n'ont pas ces axes.
    """
    if universe != "parfum":
        return []
    kept = kept_in(reference, note_ids)
    base = kept if len(kept) >= 2 else list(reference.notes)

    def accent(axis: int) -> list[str]:
        return sorted(base, key=lambda label: (-AXES.get(slug(label), (0, 0))[axis], slug(label)))[:2]

    fresher, warmer = accent(0), accent(1)
    found = [{"id": "A", "title": "Version A, plus fraîche", "accent": fresher, "why": f"Met en avant {listed(fresher)}."}]
    # Si les deux accents sont les mêmes, une seule version est possible
    if set(warmer) != set(fresher):
        found.append({"id": "B", "title": "Version B, plus chaude", "accent": warmer, "why": f"Met en avant {listed(warmer)}."})
    return found


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
        "nearby": nearby(universe, wishes, note_ids),
        "versions": versions(universe, reference, note_ids),
    }
    written = write(formula) if write else None
    if written and cites_only(written, reference, universe):
        formula["explanation"] = written
    return formula
