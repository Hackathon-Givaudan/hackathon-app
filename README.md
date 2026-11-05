# hackathon-app

Application assistée par l'IA, développée en deux semaines pour le hackathon HETIC × Givaudan 2026.

## Stack

- API : Node.js 24, TypeScript, Express, dans `api/`
- Front : Vite, TypeScript, dans `web/`
- Base de données : PostgreSQL 17 ; IA : tout fournisseur compatible OpenAI, Ollama en local par défaut

Les décisions et leurs raisons sont dans [docs/adr](docs/adr).

## Démarrer

Prérequis sur votre machine : [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine sous Linux), [VS Code](https://code.visualstudio.com/) avec l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), git configuré (nom, e-mail). Sous Windows, activez WSL 2 dans Docker Desktop et clonez le projet dans WSL, pas dans `C:\`.

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. `F1` → **Dev Containers: Reopen in Container**. VS Code construit l'environnement, démarre PostgreSQL et installe les dépendances. Comptez quelques minutes la première fois.
3. Dans le terminal de VS Code : `npm run dev`, puis ouvrez <http://localhost:5173>.

La page affiche la version de PostgreSQL et les questions de test. Pour poser une question à l'IA, lancez [Ollama](https://ollama.com/download) sur votre machine et téléchargez le modèle :

```bash
ollama pull llama3.2:1b
```

Un autre fournisseur se configure dans `api/.env` (voir `api/.env.example`), sans toucher au code.

## Vérifier

Depuis le terminal de VS Code :

```bash
curl localhost:3000/api/health
curl localhost:3000/api/questions
psql postgres://app:app@db:5432/app -c "SELECT id, question FROM questions"
```

Avant d'ouvrir une pull request : `npm run lint`, `npm run format:check`, `npm run build`. Le hook pre-commit lance les deux premiers sur les fichiers du commit, et la CI rejoue les trois.

## Travailler

- `develop` est la branche par défaut. Une tâche = une branche `feature/*`, fusionnée par pull request après une relecture.
- `main` ne reçoit que ce qui est démontrable, par pull request depuis `develop`.
- `api/.env` et `db/data/` restent sur votre machine. Pour repartir d'une base vide : fermez le conteneur, supprimez `db/data/`, rouvrez-le.
