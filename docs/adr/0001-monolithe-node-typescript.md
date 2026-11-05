# 0001. Un monolithe Node.js et TypeScript pour l'API et le front

- Statut : acceptée
- Date : 2026-11-05
- Décideurs : Maxime (tech-lead)

## Contexte

Le hackathon dure deux semaines. L'équipe n'est pas encore connue : des profils Data/IA (Python), Product et développeurs de niveau variable. Chacun doit coder dès le premier jour, sur Mac, Windows ou Linux. Le produit est une application web qui appelle un service d'IA.

## Options

1. Un dépôt, un dev container, deux espaces de travail npm (`api/`, `web/`) en TypeScript : un seul `npm ci`, un seul `npm run dev`, un seul langage à relire. Les coéquipiers Python ne codent pas dans ce dépôt.
2. API en Python (FastAPI) et front en TypeScript : la stack des Data/IA côté serveur. Deux chaînes d'outils, deux linters, deux CI à maintenir, et le typage partagé entre API et front disparaît.
3. Deux dépôts (API, front) : des pull requests croisées pour chaque fonctionnalité, deux environnements à garder synchronisés.

## Décision

Nous choisissons l'option 1 : un monolithe TypeScript en espaces de travail npm, parce qu'une seule chaîne d'outils s'installe et se relit en deux semaines, et que l'équipe Data/IA garde son autonomie en exposant son propre service (voir [0003](0003-fournisseur-ia.md)).

Express et Vite servent à valider l'environnement. Le contrat à conserver si l'équipe change de framework : les scripts `dev` et `build` de chaque dossier, les ports 3000 et 5173, les routes sous `/api`.

## Conséquences

- Positives : un seul `package-lock.json`, une seule CI, un nouvel arrivant est opérationnel après `Reopen in Container`.
- Négatives, à accepter : le code Python de l'équipe Data/IA vit hors de ce dépôt, derrière une API documentée.
- À revoir si : l'équipe compte plus de développeurs Python que TypeScript.
