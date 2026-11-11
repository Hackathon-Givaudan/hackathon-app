# web : le front

Le parcours d'une marque, en quatre gestes : décrire ses envies, valider les notes, recevoir une formule, l'accepter. Ce sont les quatre routes de [`openapi.yaml`](../openapi.yaml).

## Lancer

Dans le dev container, depuis `/workspace` : `npm run dev`, puis <http://localhost:5173>.

Le front n'a qu'un mode : il appelle l'API réelle, qui s'appuie sur le service `ia/` et le modèle de langage. Il n'y a pas de mode démonstration : ce qu'on montre est ce qui tourne.

`npm run dev`, depuis la racine, lance l'API et le front. Le service `ia/` et PostgreSQL sont démarrés par le dev container. Sans eux, le premier écran s'affiche, puis l'envoi des envies répond « Le service ne répond pas, réessayez. »

## Où est quoi

| Dossier        | Rôle                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `src/App.tsx`  | L'enchaînement des étapes et l'état du parcours                                                   |
| `src/journey/` | Un fichier par écran : `UniverseStep`, `DescribeStep`, `NotesStep`, `FormulaStep`, `AcceptedStep` |
| `src/api/`     | Le seul endroit qui parle à l'API (voir ci-dessous)                                               |
| `src/bottle/`  | Le flacon 3D et les couleurs des notes                                                            |
| `src/shared/`  | Vocabulaire parfum ou arôme, styles communs                                                       |

## La couche API

- `types.ts` : les types du contrat. Si `openapi.yaml` change, c'est ici qu'on répercute.
- `http.ts` : les appels réels, une fonction par route.
- `index.ts` : le point d'entrée, que les écrans importent.

Un écran n'appelle jamais `fetch` : il passe par `api`.

## Tester

Un test se range à côté de ce qu'il protège.

| Commande                  | Fichier                | Ce qu'il vérifie                                              |
| ------------------------- | ---------------------- | ------------------------------------------------------------- |
| `npm test -w web`         | `src/api/http.test.ts` | Les appels à l'API et l'affichage de ses erreurs, API simulée |
| `npm run test:e2e -w web` | `e2e/journey.spec.ts`  | Le parcours complet dans un navigateur, sur la tranche réelle |

Le test de bout en bout a besoin de la tranche (API, PostgreSQL, service `ia/`) et d'un navigateur, à installer une fois : `npx playwright install --with-deps chromium`. Il tourne sans WebGL, donc sans le flacon 3D : c'est voulu, le parcours doit rester utilisable sans lui. Les références et leurs données vivent dans `ia/data/`, plus dans le front.

## À savoir

- Le modèle de langage n'est jamais appelé depuis le navigateur : il reste derrière l'API (ADR 0003).
- Le flacon demande WebGL : utilisez un navigateur récent pour la démo.
