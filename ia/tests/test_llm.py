"""Ce que le service fait de la réponse du modèle. Le modèle est simulé : aucun appel réseau."""

import httpx

from app import llm

TAGS = ["bord de mer", "bougie", "joie"]


def model_answers(monkeypatch, content: str):
    """Fait répondre `content` au modèle, à la place d'un vrai appel."""
    answer = httpx.Response(200, json={"choices": [{"message": {"content": content}}]}, request=httpx.Request("POST", "http://model"))
    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: answer)


def test_tags_from_the_list_are_kept(monkeypatch):
    model_answers(monkeypatch, '{"projet": true, "etiquettes": ["bord de mer", "bougie"]}')
    assert llm.pick_tags("Une bougie, bord de mer", TAGS) == ["bord de mer", "bougie"]


def test_an_invented_tag_is_dropped(monkeypatch):
    model_answers(monkeypatch, '{"projet": true, "etiquettes": ["bougie", "licorne"]}')
    assert llm.pick_tags("Une bougie", TAGS) == ["bougie"]


def test_a_text_that_is_not_a_project_gets_no_tag(monkeypatch):
    # Ticket #40 : le modèle choisit parfois des étiquettes au hasard pour un texte sans aucun sens
    model_answers(monkeypatch, '{"projet": false, "etiquettes": ["joie", "bougie"]}')
    assert llm.pick_tags("xyz qsdf", TAGS) == []


def test_an_answer_that_is_not_json_gives_no_tag(monkeypatch):
    model_answers(monkeypatch, "Bonjour !")
    assert llm.pick_tags("Une bougie", TAGS) == []
