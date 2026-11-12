# Service Data/IA, modèle V3 (Givaudan L'Atelier, équipe G11)

Aligné sur la maquette V3 de Yasmina (« Parcours L'Atelier ») et sur la story map G11. Le service transforme ce que dit ou écrit la marque, son brief importé et ses choix dans les duels du profil en :

- un **brief structuré** au format de l'écran Brief : ce qu'Aurore a entendu (avec la phrase source), puis les 11 champs à compléter (budget au kilo, volume annuel, type de projet, cible, pays de vente, positionnement, objectif, mise en concurrence, relation, engagements, contraintes) ;
- un **radar à 6 axes** (hespéridé, marin, aromatique, floral, boisé, ambré) calculé sur les 9 familles, réglable à la main, avec le commentaire d'Aurore (« plutôt lumière que velours ») ;
- un **plateau de 10 notes** qui respecte le domaine (Fragrances ou Arômes), le format et les engagements (vegan, naturel, sans allergènes, matières durables) ;
- **3 références proches** de la banque, chacune expliquée par son lien au projet : c'est le moment décisif de la story map ;
- le **potentiel critère par critère** pour le commercial (les 7 critères de l'écran Business 05), avec une suggestion de décision ;
- une **formule en deux versions** (plus fraîche, plus chaude) à partir des fioles aimées, et l'**aide** « Pourquoi cette note ? » avec ses sources.

Par défaut, pas de LLM : le spike #50 a montré qu'un modèle 7B sur CPU met 58 s par requête pour un seuil de 5 s. Les règles répondent en quelques millisecondes.

**Option Mistral (3.1.0).** Avec `"llm": true` dans le corps de la requête (ou `?llm=true` pour `/notes/{id}/pourquoi`), Mistral via Ollama (`mistral:7b`, ADR 0008) :

- complète l'analyse du brief : notes, familles et champs que le lexique a ratés, choisis **uniquement** dans les listes du référentiel. Les règles gardent la priorité, et chaque ajout est marqué « Proposé par le modèle » ;
- reformule les explications d'Aurore à partir des faits validés : `commentaire_reformule`, `lien_reformule` pour chaque référence, `reponse_reformulee` pour « Pourquoi cette note ? ».

Si le modèle ne répond pas, est trop lent (20 s maximum) ou répond mal, le service renvoie le résultat des règles, sans erreur. Le bloc `llm` de la réponse dit si le modèle a été utilisé, ce qu'il a ajouté et en combien de temps. `GET /llm` vérifie qu'Ollama répond et que le modèle est installé.

## Lancer le service

```bash
pip install -r requirements.txt
python pipeline/build_data.py          # nettoie, valide et prépare les données
uvicorn app.main:app --port 8000       # documentation interactive : http://localhost:8000/docs
```

Avec Docker : `docker build -t data-ia . && docker run -p 8000:8000 data-ia`. Pour Tech, à distance : `ngrok http 8000`.

### Avec Mistral (Ollama)

```bash
ollama pull mistral:7b                                    # 4,4 Go, une seule fois ; Ollama doit tourner
docker run -p 8001:8000 data-ia                           # le conteneur joint Ollama sur host.docker.internal:11434
# hors Docker : AI_BASE_URL=http://localhost:11434/v1 uvicorn app.main:app --port 8001
```

Puis `GET /llm` doit répondre `"joignable": true`, et `POST /recommandation` avec `"llm": true`. Variables (les mêmes que `ia/`) : `AI_BASE_URL` (défaut `http://host.docker.internal:11434/v1`), `AI_MODEL` (défaut `mistral:7b`), `AI_API_KEY` (vide pour Ollama), `AI_TIMEOUT` (défaut 20 s). Sous Linux, ajouter `--add-host=host.docker.internal:host-gateway` au `docker run`.

## Reproduire les résultats

```bash
python pipeline/build_data.py                         # 0 erreur bloquante attendue
python -m pytest -q tests                             # 28 tests (Mistral simulé, Ollama inutile)
python evaluation/evaluate.py                         # en local
python evaluation/evaluate.py http://localhost:8000   # via l'API qui tourne
python evaluation/evaluate.py --llm                   # règles seules contre règles + Mistral (Ollama lancé)
```

Résultats dans `evaluation/resultats.md` et `evaluation/resultats.json`, servis par `GET /metriques`.

## Résultats

30 cas de référence (profil et plateau) :

| Métrique                                   | Seuil | V1 (règles simples) | Modèle 3.1.0 (règles, sans Mistral) |
| ------------------------------------------ | ----- | ------------------- | ----------------------------------- |
| Famille dominante exacte                   | 60 %  | 80 %                | 80 %                                |
| Notes attendues retrouvées dans le plateau | 50 %  | 69 %                | 80 %                                |
| Plateaux sans note interdite               | 100 % | 97 %                | 100 %                               |
| Champs du brief exacts                     | 80 %  | 0 à 80 %            | 100 %                               |
| Latence p95 via l'API                      | < 5 s |                     | 4 ms                                |

10 cas V3 (brief et références) : 100 % des 12 champs exacts, bonne référence dans les 3 propositions 100 % (au hasard : 34 %). Ces chiffres sont optimistes : le lexique des nouveaux champs a été écrit après les cas. Il faut des briefs que l'équipe Data n'a pas vus (voir `docs/protocole_validation.md`).

## Ce que la story map attend de la Data, et où c'est

| Story map (ligne MVP)                                                        | Endpoint                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Choisir Fragrances ou Arômes dès l'entrée                                    | `domaine` dans `POST /recommandation`                                        |
| Voir le brief se remplir et corriger une info                                | `POST /brief`, `GET /modele-brief`, `POST /brief/import`                     |
| Donner un ordre de grandeur de budget et de volume                           | champs `budget_kilo`, `volume_annuel`                                        |
| Conseiller : recevoir la demande avec le potentiel estimé                    | `POST /potentiel`                                                            |
| Recevoir 3 références proches, expliquées (moment décisif)                   | `POST /references`                                                           |
| Demander son plateau en un clic                                              | `POST /recommandation` (plateau de 10)                                       |
| Plus tard : profil en duels, fiche matière, sentir les fioles, deux versions | `GET /duels`, `GET /notes/{id}`, `POST /formule`, `GET /notes/{id}/pourquoi` |

## Endpoints

| Méthode | Chemin                                             | Rôle                                                                            |
| ------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET     | `/sante`, `/metriques`                             | état du service, résultats de l'évaluation                                      |
| GET     | `/llm`                                             | Mistral (Ollama) joignable et installé ?                                        |
| GET     | `/familles`, `/notes`, `/notes/{id}`, `/ambiances` | référentiel : 9 familles, 72 fiches matières, 18 ambiances                      |
| GET     | `/duels`, `/questions`                             | 5 duels du profil V3 (images, sons, mots) ; questions V2                        |
| GET     | `/modele-brief`                                    | modèle de brief à télécharger et remplir                                        |
| POST    | `/brief`, `/brief/import`, `/analyse-brief`        | brief structuré à partir du texte, ou d'un modèle rempli                        |
| POST    | `/profil`                                          | roue (9 familles), radar (6 axes), commentaire ; accepte les réglages à la main |
| POST    | `/recommandation`                                  | tout : brief, radar, plateau, 3 pistes, 3 références, potentiel, alertes        |
| POST    | `/references`, `/potentiel`                        | les 3 références expliquées ; le potentiel critère par critère                  |
| POST    | `/formule`, `/variation`                           | deux versions à partir des fioles aimées ; « plus frais », « moins boisé »      |
| GET     | `/notes/{id}/pourquoi`                             | réponse de l'aide avec ses sources                                              |
| GET     | `/banque-references`, `/kit`                       | banque de références (fictive) ; kit de 30 notes                                |
| POST    | `/parfums-proches`                                 | banque de parfums existants de Hamza, quand elle sera branchée                  |

Contrat complet : `docs/openapi.json`.

## Structure

```
data/sources/      entrées : notes, enrichissement, familles, radar, médias, ambiances, questions, duels,
                   lexique, allergènes, modèle de brief, critères du potentiel, banque de références fictive
data/processed/    sorties du pipeline (JSON + CSV) et rapport qualité
pipeline/          build_data.py : nettoyage, validation, préparation
app/moteur.py      modèle           app/llm.py   option Mistral (Ollama)
app/baseline_v1.py baseline de comparaison      app/main.py   API
evaluation/        cas de référence (30 + 10 V3), évaluation, résultats, historique
docs/              protocole de validation, règles, dictionnaire des données, contrat OpenAPI
tests/             tests du moteur, de l'API et du pipeline
```

## Remplacer la banque fictive par la vraie banque

La story map demande une « banque de références fictive » pour le prototype : `data/sources/banque_references_fictive.json` (34 références, toutes marquées fictives). Pour brancher la banque fusionnée de Hamza, garder le même format (`id`, `nom`, `domaine`, `produit`, `notes` par étage avec les identifiants de `GET /notes`) et relancer `python pipeline/build_data.py`.
