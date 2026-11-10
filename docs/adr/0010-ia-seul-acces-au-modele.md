# 0010. Seul le service `ia/` appelle le modèle de langage

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Maxime, Wissem (tech-leads)

## Contexte

L'[ADR 0003](0003-fournisseur-ia.md) faisait appeler le modèle par l'API, avec `ask()` dans `api/src/index.ts`, et prévoyait un service Data/IA en remplacement facultatif. Depuis, l'[ADR 0005](0005-code-data-ia.md) a placé ce service dans `ia/`, et le contrat [`openapi.yaml`](../../openapi.yaml) ([ADR 0006](0006-contrat-api-avant-le-code.md)) a remplacé la route de test `/api/questions` par les quatre gestes du parcours. Les gestes 1 et 3 renvoient des notes puis une formule tirées du référentiel de `ia/` : une réponse libre du modèle n'y a plus sa place. Les réglages du modèle, `AI_BASE_URL` et `AI_MODEL`, pouvaient se trouver à deux endroits : `api/.env` et l'environnement du service.

## Options

1. L'API passe toujours par `ia/` et n'appelle plus le modèle : un seul endroit pour le prompt, ses garde-fous et les réglages du modèle. Sans le service, les gestes 1 et 3 répondent 502.
2. Garder `ask()` en secours dans l'API quand le service ne répond pas : la démo ne tombe jamais en 502. Mais le modèle répondrait en texte libre, hors référentiel : des notes inventées, ce que le produit interdit.
3. Appeler le modèle depuis l'API et ne laisser à `ia/` que les données : un service de moins à lancer. Mais la Data ne pourrait plus relire ni faire évoluer le code qui interroge le modèle, ce que voulait l'ADR 0005.

## Décision

Nous choisissons l'option 1, parce qu'une note inventée décrédibilise la démo plus qu'un message d'erreur. `api/src/ia.ts` est le seul fichier de l'API qui parle au service, par `DATA_AI_URL`. `ask()`, `askDataTeam()` et `/api/questions` sont retirés.

## Conséquences

- Positives : `api/.env` ne contient plus que `DATABASE_URL` et `DATA_AI_URL` ; le fournisseur se change dans l'environnement du service `ia/`, plus dans `api/.env`, ce qui précise l'ADR 0003 ; l'API se teste contre un faux service, sans modèle.
- Négatives, à accepter : sans le service `ia/`, les gestes 1 et 3 répondent 502 ; l'API attend jusqu'à 30 secondes avant d'abandonner.
- À revoir si : le service `ia/` tombe pendant une démo. Il faudrait alors une réponse de secours tirée du référentiel, pas du modèle.
