# ia : le service Data/IA

Il traduit les envies d'une marque en notes. La formule, proposée à partir des notes validées, arrive dans un second ticket. Il ne répond qu'à l'API (`api/`), jamais au navigateur. Sa place dans le dépôt : [ADR 0005](../docs/adr/0005-code-data-ia.md). Son langage : ADR 0007. Son modèle : ADR 0008.

## Comment ça marche

1. **Des envies aux étiquettes.** Le modèle de langage lit le texte de la marque et choisit jusqu'à 5 étiquettes dans une liste fermée : les ambiances, émotions et usages du référentiel. Une étiquette hors liste est jetée.
2. **Des étiquettes aux notes.** Les références qui portent ces étiquettes donnent leurs notes, 6 au plus, chacune avec sa raison.

Le modèle ne fait que l'étape 1. Aucune note n'est inventée : tout vient de `data/`. Si le modèle ne répond pas, un recoupement de mots le remplace.

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

## Mesure du 10 novembre

Dix envies de `evaluation/envies.json`, sur un Mac M3 Pro, modèle déjà chargé. Une envie est réussie si une des notes attendues est proposée.

| Modèle        | Envies réussies | Réponse la plus lente |
| ------------- | --------------- | --------------------- |
| Sans modèle   | 6 / 10          | 0,1 s                 |
| `llama3.2:1b` | 4 / 10          | 16,2 s                |
| `mistral:7b`  | 9 / 10          | 4,4 s                 |
| `qwen2.5:7b`  | 9 / 10          | 13,0 s                |

Seul `mistral:7b` tient le seuil du spike : 8 sur 10 en moins de 5 s. `llama3.2:1b` fait moins bien que l'absence de modèle.

Limites : dix envies seulement, écrites par la même personne que le code, pas encore jugées par le Product. Pour rejouer : `python evaluation/evaluate.py http://localhost:8000`.
