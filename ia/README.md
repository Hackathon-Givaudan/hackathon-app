# ia/

Le code Data/IA du projet, décidé dans l'[ADR 0005](../docs/adr/0005-code-data-ia.md) : le référentiel de notes (parfums et arômes), la banque de formules, et le service qui traduit les envies d'une marque en notes, puis les notes validées en formule.

## Comment ce code sert le parcours

- Le contrat des quatre gestes est dans [`openapi.yaml`](../openapi.yaml). Les gestes 1 (proposer des notes) et 3 (proposer une formule) s'appuient sur ce service.
- L'API l'appelle par `DATA_AI_URL`, dans `api/src/index.ts`. Le service sera lancé par `compose.yaml`.
- Le langage et le framework du service se décident dans un ADR, avant le premier commit de code.

## Travailler ici

- Un ticket d'abord : Spike pour une question à trancher, Tâche pour un travail. Le livrable d'un spike va dans ce dossier.
- Une branche `feature/nom-court` depuis `develop`, une pull request vers `develop` avec `Closes #N`, la relecture d'un tech lead.
- Chaque entrée du référentiel et de la banque porte sa source, ou la mention « exemple construit ». Aucun chiffre inventé.
- Les fichiers JSON, YAML et Markdown de ce dossier passent par Prettier : le hook les reformate au commit, et la CI refuse ceux qui ne le sont pas.
- Les secrets vont dans un fichier `.env` local, jamais commité. L'environnement Python va dans `ia/.venv/`, ignoré par git.
