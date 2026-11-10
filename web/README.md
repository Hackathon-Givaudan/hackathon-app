# web : le front

Le parcours d'une marque, en quatre gestes : décrire ses envies, valider les notes, recevoir une formule, l'accepter. Ce sont les quatre routes de [`openapi.yaml`](../openapi.yaml).

## Lancer

Dans le dev container, depuis `/workspace` : `npm run dev`, puis <http://localhost:5173>.

Par défaut, le front tourne en **démonstration** : les réponses sont calculées dans le navigateur. Pour appeler l'API réelle, une fois ses routes codées :

```bash
VITE_API_MODE=live npm run dev
```

## Tester le mode réel sans l'API

Tant que l'API ne code pas les routes, un serveur simulé depuis le contrat permet de vérifier que le front envoie les bonnes requêtes :

```bash
npx @stoplight/prism-cli mock openapi.yaml -p 3000
VITE_API_MODE=live npm run dev -w web
```

Les réponses sont factices (`string` partout) : ce test vérifie les routes et les champs, pas le contenu.

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
- `demo.ts` : les mêmes gestes, sans serveur, à partir de `data/references.json`.
- `index.ts` : choisit entre les deux.

Un écran n'appelle jamais `fetch` : il passe par `api`.

## Tester

Un test se range à côté de ce qu'il protège.

| Commande                  | Fichier                | Ce qu'il vérifie                                                |
| ------------------------- | ---------------------- | --------------------------------------------------------------- |
| `npm test -w web`         | `src/api/demo.test.ts` | Les règles : notes proposées, formule choisie, ordre des gestes |
| `npm run test:e2e -w web` | `e2e/journey.spec.ts`  | Le parcours complet dans un navigateur, parfum puis arôme       |

Le test de bout en bout a besoin d'un navigateur, à installer une fois : `npx playwright install --with-deps chromium`. Il tourne sans WebGL, donc sans le flacon 3D : c'est voulu, le parcours doit rester utilisable sans lui.

## Données de démonstration

`src/api/data/references.json` vient des fichiers `fragrances-demo.csv` et `aromes-demo.csv` du Product : 40 références fictives. Les parts affichées dans une formule sont illustratives.

## À savoir

- Le modèle de langage n'est jamais appelé depuis le navigateur : il reste derrière l'API (ADR 0003).
- Le flacon demande WebGL : utilisez un navigateur récent pour la démo.
