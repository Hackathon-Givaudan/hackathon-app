"""La séance avec Aurore : à chaque réponse de la marque, ce qu'elle entend et ce qu'elle demande ensuite.

Aurore retient deux sortes d'idées :
- les étiquettes du référentiel que la marque a écrites telles quelles, toujours gardées ;
- celles que le modèle ajoute, gardées seulement si la marque a dit un mot de la même famille
  (« élégant » pour « élégance »). Le modèle ne peut donc rien faire dire à la marque.
Les questions d'Aurore sont écrites ici : elle demande ce qui manque encore au projet, dans un ordre fixe.
"""

from . import notes
from .notes import mentions
from .references import KINDS, all_tags, slug

MAX_QUOTE = 120

# Ce qu'Aurore demande tant qu'elle ne le sait pas, dans cet ordre
QUESTIONS = {
    "parfum": [
        ("usage", "Dans quel produit vivra ce parfum ? Une bougie, un savon, un diffuseur…"),
        ("ambiance", "Où et quand l'imaginez-vous ? Un lieu, une saison, un moment de la journée."),
        ("emotion", "Et que doit-on ressentir en le sentant ?"),
    ],
    "arome": [
        ("usage", "Dans quel produit vivra cet arôme ? Une boisson, un yaourt, une glace…"),
        ("ambiance", "À quel moment le déguste-t-on ?"),
        ("emotion", "Et quelle sensation doit-il laisser en bouche ?"),
    ],
}
OPENING = "Racontez-moi votre projet."
NOT_UNDERSTOOD = "Je n'ai pas saisi. Dites-le-moi autrement : un produit, un lieu, une émotion."
CLOSING = "Merci. J'ai ce qu'il me faut pour rédiger votre brief."


# Des mots qui commencent pareil sans rien avoir en commun : on ne les rapproche jamais
FALSE_FRIENDS = [{"fraise", "frais"}, {"bois", "boisson"}, {"chaleur", "chalet"}, {"gout", "gouter"}]


def same_family(a: str, b: str) -> bool:
    """« elegant » et « elegance », « soir » et « soiree » : le plus court des deux mots, à une lettre près,
    ouvre le plus long. Il faut au moins 4 lettres en commun."""
    if a == b:
        return True
    short, long = sorted((a, b), key=len)
    if {a, b} in FALSE_FRIENDS:
        return False
    common = next((i for i, (x, y) in enumerate(zip(short, long)) if x != y), len(short))
    return common >= max(4, len(short) - 1)


LINKS = {"de", "du", "des", "la", "le", "les", "au", "aux", "en", "et", "a", "d", "l"}


def said_by_the_brand(said: str, tag: str, taken: set[str] = frozenset()) -> bool:
    """La marque a-t-elle dit chaque mot de l'étiquette, ou un mot de la même famille ?
    Les petits mots de liaison (de, du, la…) ne comptent pas ; « mer » doit être dit tel quel.
    Un mot déjà retenu tel quel (`taken`) ne fait pas entendre une deuxième étiquette."""
    spoken = [word for word in slug(said).split("-") if word and word not in taken]
    words = [word for word in slug(tag).split("-") if word not in LINKS]
    return all(any(same_family(word, heard) for heard in spoken) for word in words)


def heard_in(universe: str, said: str) -> list[str]:
    """Les étiquettes qu'Aurore retient de ce que la marque vient de dire :
    celles écrites telles quelles, celles dont la marque a dit un mot de la même famille,
    et celles du modèle qui passent la même règle. Un verdict vide du modèle n'écarte rien."""
    tags = all_tags(universe)
    written = notes.written_tags(universe, said)
    # « gourmand » écrit tel quel ne fait pas entendre aussi « gourmandise », ni « glace » « glacé »
    taken = {word for tag in written for word in slug(tag).split("-")}
    related = [tag for tag in tags if tag not in written and said_by_the_brand(said, tag, taken)]
    chosen = notes.pick_tags(said, tags) or []
    added = [tag for tag in chosen if tag not in written + related and said_by_the_brand(said, tag)]
    found = written + related + added
    # « boisson » s'efface devant « boisson protéinée »
    return [tag for tag in found if not any(slug(tag) != slug(other) and mentions(other, tag) for other in found)]


def is_known(universe: str, idea: dict) -> bool:
    """L'idée est-elle une étiquette du référentiel, avec sa bonne catégorie ?"""
    return KINDS[universe].get(idea["label"]) == idea["kind"]


def known(heard: list[dict], kind: str) -> bool:
    """Aurore sait-elle déjà cela ? Une sensation répond à la question de l'émotion."""
    kinds = {idea["kind"] for idea in heard}
    return kind in kinds or (kind == "emotion" and "sensation" in kinds)


def next_turn(universe: str, said: str, heard: list[dict]) -> dict:
    """La réponse d'Aurore à ce que la marque vient de dire, et ce qu'elle a entendu depuis le début."""
    if not said.strip():
        return {"reply": OPENING, "heard": heard, "done": False}

    labels = {idea["label"] for idea in heard}
    new = [
        {"kind": KINDS[universe][tag], "label": tag, "quote": said.strip()[:MAX_QUOTE]}
        for tag in heard_in(universe, said)
        if tag not in labels
    ]
    heard = heard + new
    missing = [question for kind, question in QUESTIONS[universe] if not known(heard, kind)]

    if not missing:
        return {"reply": CLOSING, "heard": heard, "done": True}
    if not new:
        return {"reply": f"{NOT_UNDERSTOOD} {missing[0]}", "heard": heard, "done": False}
    # Aurore reprend le mot qu'elle vient d'entendre, s'il est dans la phrase, puis pose sa question
    echoed = next((idea["label"] for idea in new if mentions(said, idea["label"])), new[0]["label"])
    return {"reply": f"J'entends « {echoed} ». {missing[0]}", "heard": heard, "done": False}
