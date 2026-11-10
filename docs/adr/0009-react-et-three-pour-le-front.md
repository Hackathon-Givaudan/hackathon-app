# 0009. Construire le front avec React, Tailwind et un flacon en Three.js

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

Le front de `web/` est une page de test : un formulaire et une liste, en TypeScript sans framework. Le parcours à montrer le 13 novembre compte quatre écrans, qui suivent les quatre gestes de [`openapi.yaml`](../../openapi.yaml), avec un état partagé entre eux : l'univers, les envies, les notes gardées, la formule. Le jury du challenge note la qualité du prototype, et le brief demande une expérience premium. L'[ADR 0001](0001-monolithe-node-typescript.md) fixe le contrat du front : les scripts `dev` et `build`, le port 5173, les appels sous `/api`.

## Options

1. React et Tailwind pour les écrans, Three.js (avec React Three Fiber) pour un flacon qui se remplit des notes choisies, GSAP pour les transitions : un état partagé simple à suivre, un fichier par écran, un élément visuel propre au métier. Plusieurs dépendances de plus, et un fichier JavaScript de plus de 500 Ko.
2. Rester en TypeScript sans framework : aucune dépendance, rien à apprendre. Mais quatre écrans et leur état à synchroniser à la main dans le DOM, plus long à écrire et à relire.
3. React et Tailwind, sans 3D : le parcours complet, un poids divisé. Mais rien ne distingue visuellement le prototype d'un formulaire.

## Décision

Nous choisissons l'option 1, en gardant le contrat de l'ADR 0001 : scripts `dev` et `build`, port 5173, appels sous `/api`. Le flacon est isolé dans `web/src/bottle/` et chargé à part : le retirer ramène à l'option 3 sans toucher aux écrans.

## Conséquences

- Positives : un fichier par écran, relu séparément ; le flacon montre à la marque ce qu'elle construit, des notes à la formule.
- Négatives, à accepter : une douzaine de dépendances de plus à maintenir, polices comprises ; le fichier 3D est le plus long du front et le moins familier à relire ; le flacon demande WebGL, donc un navigateur récent pour la démo.
- À revoir si : le flacon ralentit la page sur la machine de démo, ou si son entretien prend le temps des écrans.
