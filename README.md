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

Si vous aviez déjà lancé une version précédente, supprimez d'abord le dossier `db/data/` : la table des briefs a deux colonnes de plus, et une ancienne base fait échouer le brief.

Sans Ollama, la tranche fonctionne quand même : le service `ia/` cherche alors les mots de la marque dans le référentiel. Sous Linux, Ollama doit écouter sur toutes les interfaces (`OLLAMA_HOST=0.0.0.0`).

## Ce qui est simulé

Le parcours suit la maquette du Product : la marque échange par écrit avec son guide, relit son brief, précise son profil, donne son avis sur un plateau de notes, reçoit une formule, puis suit son échantillon. En face, le conseiller lit les briefs et leur potentiel.

**Ce qui est réel.** Le front, l'API, PostgreSQL, le service `ia/` et l'appel au modèle. La séance : le modèle ne retient que des étiquettes de notre référentiel, et le code jette ce que la marque n'a pas dit. Le brief, ses précisions et le retour après essai, enregistrés en base. Les fiches matières, tirées des données de l'équipe Data, avec leurs sources. Le potentiel d'un brief : sept critères calculés par des règles écrites, sans modèle.

**Ce qui est simulé, et dit à l'écran.**

- La banque : 40 références écrites pour la démonstration, 20 parfums et 20 arômes, marquées « fictif démo » dans `ia/data/`. Aucune formule de Givaudan.
- La formule proposée : la référence existante la plus proche des notes gardées, jamais une composition sur mesure. La banque ne donne pas de proportions : l'écran n'en affiche pas.
- Le guide : Aurore et Victor sont le même service, seul le prénom change. L'échange est écrit, il n'y a pas de voix. Ses questions sont écrites dans le code, pas rédigées par le modèle.
- Le compte : Léa, de Maison Lumen, est un faux compte. Il n'y a pas de connexion : l'espace de la marque et celui du conseiller montrent tous les briefs enregistrés, et sont ouverts à tous.
- Le conseiller : Karim n'existe pas. Sa validation du plateau est un bouton « Démo ».
- Le plateau : aucune fiole n'est envoyée. La livraison, le kit atelier et le créneau réservé sont des écrans, et l'avis sur chaque note se donne à l'écran.
- Le devis et la commande : Givaudan n'a donné ni prix ni délai, ils s'écrivent `[X]`. Accepter le devis ou commander ne transmet rien.
- L'échantillon : rien n'est envoyé, sa réception est un bouton.
- La roue du profil : elle montre où penchent les mots du brief et les réponses. Ce sont ces mots qui orientent le plateau, pas la roue. La correspondance entre un mot et un axe est une lecture de l'équipe.

**Ce qui reste une hypothèse.** Les fiches couvrent 39 des 78 notes de parfum, et une partie de leurs valeurs est estimée par l'équipe Data. Les règles du potentiel sont à valider avec Givaudan : le conseiller décide.

**Ce que la maquette montre et que le code ne fait pas.** Trois références proches et deux versions d'une formule, la voix, l'import d'un document de brief, la séance en direct côté conseiller.

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
