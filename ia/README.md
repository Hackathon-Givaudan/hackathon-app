# ia : le service Data/IA

Il traduit les envies d'une marque en notes. La formule, proposée à partir des notes validées, arrive dans un second ticket. Il ne répond qu'à l'API (`api/`), jamais au navigateur. Sa place dans le dépôt : [ADR 0005](../docs/adr/0005-code-data-ia.md). Son langage : ADR 0007. Son modèle : ADR 0008.

## Comment ça marche

1. **Des envies aux étiquettes.** Le modèle de langage lit le texte de la marque et choisit jusqu'à 5 étiquettes dans une liste fermée : les ambiances, émotions et usages du référentiel. Une étiquette hors liste est jetée.
2. **Des étiquettes aux notes.** Les références qui portent ces étiquettes sont classées, puis les plus proches donnent leurs notes à tour de rôle, 6 au plus, chacune avec sa raison.

Le modèle ne fait que l'étape 1. Aucune note n'est inventée : tout vient de `data/`. Si le modèle ne répond pas, le service cherche les étiquettes écrites telles quelles dans le texte.

Trois règles de classement, dans `app/notes.py` :

- Une étiquette rare pèse plus : « bord de mer » (2 références) départage mieux que « bougie » (11).
- L'usage compte moitié moins qu'une ambiance ou une émotion : il dit où ira la création, pas ce qu'elle doit évoquer.
- Deux envies différentes reçoivent chacune leurs notes : « hiver » et « joie » ne viennent pas de la même référence.

## Lancer

Sur votre machine, une fois : `ollama pull mistral:7b`.

```bash
docker build -t hackathon-ia ia
docker run --rm -p 8000:8000 hackathon-ia
curl localhost:8000/health
```

La documentation interactive des routes est sur <http://localhost:8000/docs>.

| Variable      | Défaut                                 | Rôle                          |
| ------------- | -------------------------------------- | ----------------------------- |
| `AI_BASE_URL` | `http://host.docker.internal:11434/v1` | Fournisseur compatible OpenAI |
| `AI_MODEL`    | `mistral:7b`                           | Modèle                        |
| `AI_API_KEY`  | vide                                   | Clé, inutile avec Ollama      |

## Routes

| Route         | Entrée               | Sortie                                      |
| ------------- | -------------------- | ------------------------------------------- |
| `GET /health` |                      | État et nombre de références                |
| `POST /notes` | `universe`, `wishes` | `notes` : `id`, `label`, `family`, `reason` |

`universe` vaut `parfum` ou `arome`. Une réponse 422 signifie que rien ne correspond.

## Où est quoi

| Fichier             | Rôle                                                        |
| ------------------- | ----------------------------------------------------------- |
| `data/*.csv`        | Les 40 références fictives du Product, 20 par univers       |
| `app/references.py` | Lit les CSV                                                 |
| `app/llm.py`        | Le seul fichier qui parle au modèle                         |
| `app/notes.py`      | Les deux étapes ci-dessus                                   |
| `app/main.py`       | Les routes                                                  |
| `tests/`            | `test_notes.py` : les règles, `test_routes.py` : les routes |
| `evaluation/`       | Mesure de la qualité avec un modèle                         |

## Tester

```bash
docker run --rm -v "$PWD/ia":/ia -w /ia hackathon-ia sh -c "pip install -q -r requirements-dev.txt && python -m pytest -q"
```

## Travailler ici

- Un ticket d'abord : Spike pour une question à trancher, Tâche pour un travail. Le livrable d'un spike va dans ce dossier.
- Une branche `feature/nom-court` depuis `develop`, une pull request vers `develop` avec `Closes #N`, la relecture d'un tech lead.
- Chaque entrée du référentiel et de la banque porte sa source, ou la mention « exemple construit ». Aucun chiffre inventé.
- Les fichiers JSON, YAML et Markdown de ce dossier passent par Prettier : le hook les reformate au commit, et la CI refuse ceux qui ne le sont pas.
- Les secrets vont dans un fichier `.env` local, jamais commité. L'environnement Python va dans `ia/.venv/`, ignoré par git.

## Mesure du 10 novembre

### Dix envies en texte libre

Dix envies de `evaluation/envies.json`, sur un Mac M3 Pro. Une envie est réussie si une des notes attendues est proposée.

| Modèle        | Envies réussies | Réponse la plus lente | Mesuré                        |
| ------------- | --------------- | --------------------- | ----------------------------- |
| Sans modèle   | 5 / 10          | 0,1 s                 | Avec les règles de classement |
| `mistral:7b`  | 10 / 10         | 8,1 s                 | Avec les règles de classement |
| `llama3.2:1b` | 4 / 10          | 16,2 s                | Avant ces règles              |
| `qwen2.5:7b`  | 9 / 10          | 13,0 s                | Avant ces règles              |

Avec `mistral:7b`, les 8,1 s sont celles du premier appel, modèle pas encore chargé ; les neuf suivants prennent de 3,3 à 4,1 s. Avant les règles de classement, `mistral:7b` faisait 9 sur 10 et l'absence de modèle 6 sur 10 : chercher les étiquettes telles quelles évite les faux rapprochements, mais reconnaît un peu moins bien un texte libre.

### Les réponses de l'écran d'accueil

Le front pose trois questions à six réponses, soit 216 combinaisons par univers. Mesuré sans modèle, sur les 216 : l'ambiance choisie et l'émotion choisie sont-elles toutes les deux citées dans les raisons ?

| Univers | Avant les règles | Après     |
| ------- | ---------------- | --------- |
| Parfum  | 2 / 216          | 191 / 216 |
| Arôme   | 17 / 216         | 85 / 216  |

Avant, la marque ne recevait jamais que les notes d'une seule référence, et un même jeu de notes revenait pour 66 combinaisons de parfum sur 216 (8 après). Les arômes restent en retrait : leurs étiquettes se recoupent davantage d'une référence à l'autre.

Limites : dix envies seulement, écrites par la même personne que le code, pas encore jugées par le Product ; une seule passe par modèle ; 40 références fictives. Pour rejouer : `python evaluation/evaluate.py http://localhost:8000`.
