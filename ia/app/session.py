"""La séance avec Aurore : à chaque réponse de la marque, ce qu'elle entend et ce qu'elle demande ensuite.

Le modèle ne sert qu'à reconnaître des étiquettes du référentiel dans ce que dit la marque (notes.find_tags).
Les questions d'Aurore sont écrites ici : elle demande ce qui manque encore au projet, dans un ordre fixe.
"""

from .notes import find_tags, mentions
from .references import KINDS

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
        for tag in find_tags(universe, said)
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
