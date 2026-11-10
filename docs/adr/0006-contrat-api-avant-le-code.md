# 0006. Écrire le contrat d'API dans `openapi.yaml` avant le code

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

Trois parties codent en parallèle à partir du 10 novembre : le front dans `web/`, l'API dans `api/`, le service Data/IA dans `ia/` ([ADR 0005](0005-code-data-ia.md)). Elles doivent se rejoindre le 13 novembre pour le jalon m2, sur un parcours en quatre gestes : envoyer ses envies, valider les notes, recevoir une formule, l'accepter. Aujourd'hui, `api/src/index.ts` n'expose que `/api/health` et `/api/questions`, hérités de la mise en place : aucune route du parcours n'existe encore, donc rien à casser.

## Options

1. Un fichier [`openapi.yaml`](../../openapi.yaml) à la racine, écrit avant les routes : front, API et Data lisent les mêmes noms de champs, les mêmes codes d'erreur. Le front peut simuler les réponses dès maintenant. Le fichier se valide par un outil, mais rien ne garantit seul que le code le respecte.
2. Coder les routes d'abord, puis générer le contrat depuis le code : le contrat ne ment jamais. Mais le front et la Data attendent l'API pour commencer, et la bibliothèque de génération est une dépendance de plus à apprendre.
3. Pas de contrat écrit, des types TypeScript partagés entre `api/` et `web/` : rien de plus à maintenir. Mais le service Data peut être écrit dans un autre langage (ADR 0005) et ne lit pas ces types, et le jalon m1 du cours demande un fichier OpenAPI.

## Décision

Nous choisissons l'option 1 : le contrat est écrit dans [`openapi.yaml`](../../openapi.yaml) avant le code, parce que trois parties démarrent le même jour et qu'un désaccord sur un nom de champ découvert le 13 novembre coûterait la démo. Un changement de route passe d'abord par une pull request sur ce fichier, relue par un tech lead, puis par le code.

## Conséquences

- Positives : le front avance sans attendre l'API ; la Data sait ce que l'API attend de son service ; les erreurs (400, 404, 409, 502) sont décidées une fois.
- Négatives, à accepter : le contrat et le code peuvent diverger, et c'est la relecture qui le détecte, pas la CI. Chaque changement de route coûte deux modifications.
- À revoir si : une divergence entre le contrat et le code atteint `develop`. Il faudra alors valider les réponses de l'API contre `openapi.yaml` dans la CI.
