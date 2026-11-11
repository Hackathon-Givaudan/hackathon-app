# AGENTS.md

Plateforme de commande d'arômes et de parfums guidée par l'IA, pour le Givaudan AI Innovation Challenge : une API Express, un front Vite, PostgreSQL et un modèle de langage, dans un dev container VS Code. Présentation et démarrage : `README.md`.

## Lancer

Toutes les commandes se lancent dans le dev container, depuis `/workspace`.

- `npm run dev` : API sur le port 3000, front sur le port 5173. Le service `ia` démarre avec le dev container et répond sur `http://ia:8000`.
- Hors du dev container, `docker compose up` lance toute la tranche : `app` (API et front), `ia` et `db` (ADR 0011). Le service `dev` est dans `.devcontainer/compose.yaml`.
- `curl -s localhost:3000/api/health` doit répondre `"status":"ok"` avec la version de PostgreSQL.
- `psql postgres://app:app@db:5432/app` ouvre la base. L'hôte `db` est le nom du service dans `compose.yaml`.
- Avant de dire « fini » : `npm run lint`, `npm run format:check`, `npm run build`. Ce sont les trois contrôles du job `qualite` dans `.github/workflows/ci.yml`.

## Règles

- Les routes sont dans `api/src/index.ts`, toutes sous `/api`, et suivent `openapi.yaml` : une route change d'abord dans le contrat (ADR 0006). Toute erreur sort au format `{ "error": "message" }`. Le front appelle `/api` : le proxy vers le port 3000 est dans `web/vite.config.ts`.
- L'API n'appelle jamais le modèle de langage : `api/src/ia.ts` appelle le service Data/IA par `DATA_AI_URL`, une fonction par route (ADR 0010). Sans ce service, les gestes 1 et 3 répondent 502.
- Le schéma est dans `db/init/`, joué seulement quand `db/data/` est vide : le modifier ne change pas une base existante.
- `api/tsconfig.json` est en mode strict et `eslint.config.mjs` refuse `any` : on type les réponses du service Data/IA et de la base.
- Une branche `feature/nom-court` par ticket, depuis `develop`. La pull request vise `develop`, suit `.github/pull_request_template.md` et contient `Closes #N`. Commits en anglais, préfixés `feat:`, `fix:`, `chore:` ou `docs:`.
- Toute modification de `.github/`, `.devcontainer/`, `compose.yaml`, `eslint.config.mjs` ou d'un `package.json` attend la relecture d'un tech lead (`.github/CODEOWNERS`).
- Le plan d'un travail vit dans son ticket : `gh issue view N`. Les brouillons de session vont dans `.scratch/`, ignoré par git.

## Décisions

- Lis `docs/adr/` avant d'ajouter une dépendance ou de changer de composant.
- Ne contredis pas un ADR au statut « acceptée ». S'il faut en changer, propose un nouvel ADR, puis arrête-toi.
- Node.js 24 et TypeScript pour l'API et le front (ADR 0001). PostgreSQL 17, avec pgvector si besoin, pas SQLite ni une base vectorielle à part (ADR 0002). Un fournisseur compatible OpenAI, Ollama en local par défaut (ADR 0003). Le code Data/IA vit dans `ia/` (ADR 0005).

## À ne pas faire

- Passer `--no-verify` à `git commit`, ou ajouter `eslint-disable`, pour faire passer un contrôle.
- Lancer `npm install` hors du dev container : `package-lock.json` doit rester valable sous Linux.
- Écrire une clé dans le code ou dans `api/.env.example`. Les secrets vont dans `api/.env`, jamais commité.
- Pousser sur `develop` ou `main` : les deux branches sont protégées, tout passe par une pull request.
- Poser un fichier TypeScript dans `.scratch/` : ESLint ne lit pas `.gitignore` et le contrôlerait. Des notes en Markdown seulement.
