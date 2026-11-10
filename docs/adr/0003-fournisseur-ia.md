# 0003. Appeler l'IA par une API compatible OpenAI, Ollama en local par défaut

- Statut : acceptée, complétée par [0005](0005-code-data-ia.md) : `DATA_AI_URL` vise le service de `compose.yaml`, plus un tunnel ngrok
- Date : 2026-11-05
- Décideurs : Maxime (tech-lead)

## Contexte

Le produit appelle un modèle de langage. Le budget est de 0 € par défaut, l'équipe Data/IA aura peut-être son propre service, et la démo finale demande des réponses de qualité. Les Mac Apple Silicon de l'équipe exécutent un petit modèle localement ; Docker Desktop n'accède pas à leur GPU.

## Options

1. Ollama installé sur la machine de chaque développeur, joint depuis le conteneur par `host.docker.internal` : gratuit, données en local, GPU utilisé. Qualité modeste avec `llama3.2:1b`, une installation par personne.
2. Un fournisseur commercial (Mistral, OpenAI) : qualité élevée, aucune installation, mais une clé à distribuer, un plafond à fixer et un coût à l'usage.
3. Ollama en conteneur dans `compose.yaml` : rien à installer, mais plusieurs fois plus lent sans GPU et 1,3 Go de modèle dans la mémoire de Docker.
4. L'API de l'équipe Data/IA par un tunnel ngrok : leur modèle, leur matériel, mais une seule machine dont dépend toute l'équipe.

## Décision

Le code appelle `AI_BASE_URL/chat/completions` ; le fournisseur se choisit dans `api/.env`. Par défaut, l'option 1 : Ollama local, gratuit, suffisant pour développer. L'option 4 remplace la précédente dès que `DATA_AI_URL` est renseignée, avec un délai d'abandon de 30 secondes. L'option 2 reste disponible pour la démo, avec un plafond de dépenses sur le compte et une clé par personne. L'option 3 est écartée.

## Conséquences

- Positives : changer de fournisseur ne touche pas le code ; personne n'est bloqué quand la machine Data/IA est éteinte.
- Négatives, à accepter : chaque développeur installe Ollama et télécharge un modèle ; les réponses de dev sont médiocres.
- À revoir si : le produit exige en développement une qualité que les petits modèles n'atteignent pas.
