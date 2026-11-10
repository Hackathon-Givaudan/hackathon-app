# 0007. Écrire le service Data/IA en Python avec FastAPI

- Statut : proposée, à relire par la Data
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

L'[ADR 0005](0005-code-data-ia.md) place le code Data/IA dans `ia/` et laisse le choix du langage à un ADR à part, avant le premier commit de code. Ce service reçoit les envies d'une marque et renvoie des notes puis une formule, pour les gestes 1 et 3 de [`openapi.yaml`](../../openapi.yaml). Trois membres Data y travailleront, avec des données en CSV. Il doit démarrer par `compose.yaml` pour le jalon m2, le 13 novembre. Le dev container ne contient que Node.js.

## Options

1. Python avec FastAPI, dans son propre conteneur : le langage de la Data, la lecture de CSV sans dépendance, la validation des entrées et une page `/docs` fournies par le framework. Un second langage dans le dépôt, que la CI ne contrôle pas encore.
2. TypeScript, dans `api/` : aucun service de plus, un seul langage, la CI existante s'applique. Mais la Data ne code pas en TypeScript : elle ne pourrait ni écrire ni relire son propre service.
3. Python avec Flask : plus connu, plus léger. Mais la validation des entrées et la documentation des routes seraient à écrire à la main.

## Décision

Nous choisissons l'option 1 : Python 3.12 et FastAPI, dans un conteneur défini par `ia/Dockerfile`, parce que la Data doit pouvoir écrire et relire ce code, et que la validation et la documentation des routes ne coûtent rien. L'API reste la seule à appeler ce service : le navigateur ne le voit jamais.

## Conséquences

- Positives : la Data travaille dans son langage ; le service se teste seul, sans l'API ni la base.
- Négatives, à accepter : deux langages et deux listes de dépendances à maintenir ; le service ne tourne pas dans le dev container, il faut le lancer par Docker ; la CI doit être étendue aux tests de `ia/`.
- À revoir si : le service se réduit à quelques règles sans traitement de données, au point qu'une fonction dans `api/` suffirait.
