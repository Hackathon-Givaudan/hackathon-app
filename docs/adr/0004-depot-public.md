# 0004. Un dépôt public dans une organisation GitHub gratuite

- Statut : acceptée
- Date : 2026-11-05
- Décideurs : Maxime (tech-lead)

## Contexte

Le dépôt doit avoir des branches protégées, une CI sur chaque pull request, et des équipes avec des rôles distincts (tech-leads, data, product, évaluation). Sur le plan gratuit de GitHub, les règles de protection ne s'appliquent qu'aux dépôts publics, et les minutes de CI y sont illimitées.

## Options

1. Dépôt public, organisation gratuite : 0 €, protections et CI sans limite. Le code est visible de tous : aucun secret ne doit y entrer.
2. Dépôt privé, plan GitHub Team : code confidentiel, mais payant par utilisateur, ou dépendant d'une demande GitHub Education dont le délai est inconnu.

## Décision

Nous choisissons le dépôt public, parce que le sujet n'est pas confidentiel, que le budget est nul et que les protections sont nécessaires dès le premier jour. Les secrets (`api/.env`) restent hors de git, et toute clé commitée par erreur est révoquée immédiatement.

## Conséquences

- Positives : règles sur `main` et `develop`, check `qualite` exigé, CI gratuite.
- Négatives, à accepter : le code et les pull requests sont lisibles par n'importe qui.
- À revoir si : le partenaire demande la confidentialité du code.
