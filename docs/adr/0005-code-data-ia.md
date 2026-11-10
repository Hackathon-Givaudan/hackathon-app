# 0005. Le code Data/IA vit dans `ia/`, une branche par ticket

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Maxime, Wissem (tech-leads)

## Contexte

Deux membres Data commencent à coder le 10 novembre : un référentiel de notes aromatiques et olfactives, une banque de formules, et un service qui traduit les envies d'un client en notes puis en formules. Leur langage peut différer de celui de l'API (Node.js, ADR 0001) : il sera choisi dans un ADR à part. Le jalon m2, le 13 novembre, exige que `docker compose up` sur le tag lance toute la tranche, de l'écran aux données. `develop` et `main` sont protégées : rien n'y entre sans pull request, check `qualite` vert et relecture. Jusqu'ici, l'ADR 0001 plaçait le code Data/IA hors de ce dépôt, derrière une API, et l'ADR 0003 prévoyait de l'appeler par un tunnel ngrok, via `DATA_AI_URL`.

## Options

1. Un dossier `ia/` dans ce dépôt, une branche `feature/*` par ticket, fusionnée dans `develop` comme le reste : le code Data est dans chaque tag et peut entrer dans `compose.yaml`, la CI et la relecture s'y appliquent.
2. Une branche longue réservée à la Data : aucune attente de relecture. Mais elle diverge de `develop`, n'est dans aucun tag, et sa fusion tardive concentre les conflits juste avant la démo.
3. Un dépôt séparé, exposé par un tunnel ngrok : indépendance totale. Mais le service n'est pas dans `compose.yaml`, la démo dépend d'une machine allumée, et le tableau doit suivre deux dépôts.

## Décision

Nous choisissons l'option 1 : le code Data/IA vit dans `ia/`. Chaque travail Data part d'un ticket, sur sa branche `feature/nom-court` depuis `develop`, fusionnée par pull request. Cette décision remplace la conséquence de l'[ADR 0001](0001-monolithe-node-typescript.md) qui plaçait ce code hors du dépôt. Elle complète l'[ADR 0003](0003-fournisseur-ia.md) : le service sera lancé par `compose.yaml`, et `DATA_AI_URL` pointera vers lui plutôt que vers un tunnel ngrok.

## Conséquences

- Positives : un seul tag contient l'API, le front, la base et le service Data/IA, ce que demande m2. Un tech lead relit chaque changement Data.
- Négatives, à accepter : la Data attend une relecture avant chaque fusion. La CI ne contrôle aujourd'hui que le code Node.js : il faudra l'étendre à `ia/`.
- À revoir si : le service Data a besoin d'une ressource que le dev container ne fournit pas, un GPU par exemple.
