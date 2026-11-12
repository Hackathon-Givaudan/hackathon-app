# hackathon-app

Application assistée par l'IA, développée en deux semaines pour le hackathon HETIC × Givaudan 2026.

## Stack

- API : Node.js 24, TypeScript, Express, dans `api/`
- Front : React, Vite, TypeScript, dans `web/`
- Base de données : PostgreSQL 17
- IA : le service `ia/`, seul à appeler le modèle (tout fournisseur compatible OpenAI, Ollama en local par défaut)

Les décisions et leurs raisons sont dans [docs/adr](docs/adr).

## Voir la tranche tourner

Avec [Docker Desktop](https://www.docker.com/products/docker-desktop/) seul, depuis la racine du dépôt :

```bash
docker compose up
```

Puis ouvrez <http://localhost:5173>. La commande construit et lance le front, l'API, PostgreSQL et le service `ia/` ; ajoutez `--build` après un changement de code. Le parcours appelle l'API réelle.

Pour que le modèle de langage lise les envies, installez [Ollama](https://ollama.com/download) et téléchargez le modèle retenu par l'ADR 0008 (4,4 Go) :

```bash
ollama pull mistral:7b
```

Sans Ollama, la tranche fonctionne quand même : le service `ia/` cherche alors les mots de la marque dans le référentiel. Sous Linux, Ollama doit écouter sur toutes les interfaces (`OLLAMA_HOST=0.0.0.0`).

## Ce qui est simulé

Le front, l'API, PostgreSQL, le service `ia/` et l'appel au modèle sont réels. Quatre choses ne le sont pas :

- La banque : 40 références écrites pour la démonstration, 20 parfums et 20 arômes, marquées « fictif démo » dans `ia/data/`. Aucune formule de Givaudan.
- La formule proposée : la référence existante la plus proche des notes gardées, jamais une composition sur mesure. Ses parts sont égales par construction, parce que la banque ne donne pas de proportions : l'écran ne les affiche pas.
- La demande d'échantillon : elle est enregistrée en base, rien n'est envoyé.
- Les comptes : pas de connexion, un brief n'appartient à personne.

## Développer

Arrêtez d'abord la tranche (`docker compose down`) : elle occupe les ports 3000 et 5173.

Prérequis sur votre machine : [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine sous Linux), [VS Code](https://code.visualstudio.com/) avec l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), git configuré (nom, e-mail). Sous Windows, activez WSL 2 dans Docker Desktop et clonez le projet dans WSL, pas dans `C:\`.

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. `F1` → **Dev Containers: Reopen in Container**. VS Code construit l'environnement, démarre PostgreSQL et le service `ia/`, et installe les dépendances. Comptez quelques minutes la première fois.
3. Dans le terminal de VS Code : `npm run dev`, puis ouvrez <http://localhost:5173>.

L'API suit le contrat de [`openapi.yaml`](openapi.yaml) : quatre gestes, des envies d'une marque à une formule acceptée. Les gestes 1 et 3 passent par le service Data/IA de [`ia/`](ia/README.md), que l'API joint par `DATA_AI_URL` (voir `api/.env.example`). Le front n'a qu'un mode : il appelle cette API ([ADR 0013](docs/adr/0013-front-sur-l-api-reelle.md)). Après un changement dans `ia/`, relancez le service depuis votre machine : `docker compose up -d --build ia`.

## Vérifier

Depuis le terminal de VS Code :

```bash
curl localhost:3000/api/health
curl -X POST localhost:3000/api/briefs -H 'content-type: application/json' -d '{"universe":"parfum","wishes":"Une bougie qui rappelle le bord de mer"}'
psql postgres://app:app@db:5432/app -c "SELECT id, universe, status FROM briefs"
```

Avant d'ouvrir une pull request : `npm run lint`, `npm run format:check`, `npm run build`. Le hook pre-commit lance les deux premiers sur les fichiers du commit, et la CI rejoue les trois.

## Travailler

- `develop` est la branche par défaut. Une tâche = une branche `feature/*`, fusionnée par pull request après une relecture.
- `main` ne reçoit que ce qui est démontrable, par pull request depuis `develop`.
- `api/.env` et `db/data/` restent sur votre machine. Pour repartir d'une base vide : fermez le conteneur, supprimez `db/data/`, rouvrez-le. C'est nécessaire après tout changement de `db/init/`, qui n'est joué que sur une base vide.
- Le dev container ne crée `api/.env` que s'il n'existe pas. Quand `api/.env.example` gagne une variable, recopiez-la dans votre `api/.env` : sans `DATA_AI_URL`, par exemple, le geste 1 répond 502.
