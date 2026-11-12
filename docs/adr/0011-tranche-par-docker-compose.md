# 0011. Lancer toute la tranche par `docker compose up`, l'API et le front dans un même conteneur

- Statut : acceptée, précisée par [0013](0013-front-sur-l-api-reelle.md) : le front n'a plus de mode à choisir, `VITE_API_MODE` est retiré de `compose.yaml`
- Date : 2026-11-10
- Décideurs : Maxime, Wissem (tech-leads)

## Contexte

Le jalon m2, le 13 novembre, demande que `docker compose up`, seul, lance la tranche de l'écran aux données. Jusqu'ici `compose.yaml` ne servait qu'au dev container : son service `dev` attend avec `sleep infinity`, et l'API comme le front se lancent à la main par `npm run dev` ([ADR 0001](0001-monolithe-node-typescript.md)). Le service `ia/` a son `Dockerfile` ([ADR 0007](0007-python-fastapi-pour-ia.md)) mais n'était lancé par personne. Deux contraintes : le dev container doit continuer à s'ouvrir sans démarrer une seconde API, et le front relaie `/api` vers `localhost:3000`, une adresse fixée dans `web/vite.config.ts`.

## Options

1. Un service `app` qui lance `npm run dev`, donc l'API et le front dans un même conteneur, plus les services `ia` et `db`. Le service `dev` passe dans `.devcontainer/compose.yaml`, lu par VS Code seulement. Une seule commande, rien à changer dans `web/`, mais deux processus dans un conteneur et un front servi en mode développement.
2. Deux services, `api` et `web`, le front compilé et servi par nginx : plus proche d'une production. Mais une configuration nginx à écrire, et un mode réel fixé à la compilation : trop pour une tranche de démonstration.
3. Garder un seul fichier et ranger `dev` sous un profil compose : pas de second fichier. Mais avec Docker Compose 2.19, `--profile '*'` suivi de `up dev` répond « no such service », et nous ne maîtrisons pas les options que VS Code passe.
4. Laisser `dev` dans `compose.yaml` sans profil : rien à déplacer. Mais `docker compose up` construirait aussi l'image du dev container, lourde et inutile à la démonstration.

## Décision

Nous choisissons l'option 1. `compose.yaml` décrit la tranche : `app` (image du `Dockerfile` à la racine), `ia` et `db`. `devcontainer.json` lit `compose.yaml` puis `.devcontainer/compose.yaml`, et ne démarre que `dev` et `ia`, avec `db` dont ils dépendent. Dans la tranche, le front tourne avec `VITE_API_MODE=live` et l'API joint le service par `DATA_AI_URL=http://ia:8000`.

## Conséquences

- Positives : `docker compose up` suffit depuis un clone neuf ; le dev container garde ses usages et gagne le service `ia` ; la même image `ia` sert au développement et à la démonstration.
- Négatives, à accepter : l'API et le front tournent en mode développement, sans compilation ; les ports 3000 et 5173 sont ceux du dev container, donc on arrête la tranche avant de développer ; chaque dev container ouvert avant ce changement doit être reconstruit.
- À revoir si : la tranche doit être hébergée. Il faudra alors compiler le front et séparer les deux processus, comme dans l'option 2.
