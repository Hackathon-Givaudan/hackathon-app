# web : le front

Le front du parcours d'une marque, en quatre gestes : décrire ses envies, valider les notes, recevoir une formule, l'accepter. Ce sont les quatre routes de [`openapi.yaml`](../openapi.yaml). Ce socle pose React, Tailwind et la couche API ; les écrans arrivent dans un second temps.

## Lancer

Dans le dev container, depuis `/workspace` : `npm run dev`, puis <http://localhost:5173>.

Par défaut, le front tourne en **démonstration** : les réponses sont calculées dans le navigateur. Pour appeler l'API réelle, une fois ses routes codées :

```bash
VITE_API_MODE=live npm run dev
```

## Où est quoi

| Dossier       | Rôle                                                   |
| ------------- | ------------------------------------------------------ |
| `src/App.tsx` | La page d'accueil, en attendant les écrans du parcours |
| `src/api/`    | Le seul endroit qui parle à l'API (voir ci-dessous)    |
| `src/shared/` | Vocabulaire parfum ou arôme, styles communs            |

## La couche API

- `types.ts` : les types du contrat. Si `openapi.yaml` change, c'est ici qu'on répercute.
- `http.ts` : les appels réels, une fonction par route.
- `demo.ts` : les mêmes gestes, sans serveur, à partir de `data/references.json`.
- `index.ts` : choisit entre les deux.

Un écran n'appelle jamais `fetch` : il passe par `api`.

## Tester

```bash
npm test -w web
```

`src/api/demo.test.ts` vérifie les règles du mode démonstration : les notes proposées, la formule choisie, l'ordre des gestes. Un test se range à côté du fichier qu'il protège.

## Données de démonstration

`src/api/data/references.json` vient des fichiers `fragrances-demo.csv` et `aromes-demo.csv` du Product : 40 références fictives. Les parts affichées dans une formule sont illustratives.

## À savoir

- Le modèle de langage n'est jamais appelé depuis le navigateur : il reste derrière l'API (ADR 0003).
