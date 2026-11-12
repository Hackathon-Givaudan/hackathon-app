# G11 YAMA — Livrable Data/IA

**HETIC × Givaudan AI Challenge 2026**
**Livraison : jeudi 12 novembre 2026**
**Équipe Data : Ali Mghari et Hamza Laztouti**

## Présentation du projet

Notre prototype accompagne une petite marque dans la création d'un brief olfactif, puis l'aide à découvrir des notes et des références adaptées à ses envies.

La partie Data/IA transforme le brief utilisateur en informations exploitables par le moteur de recommandation et par le prototype Tech.

Le travail comprend la préparation des données, le développement du moteur, l'évaluation de ses résultats et la mise à disposition d'une API.

**Branche du prototype :** [v2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2)

**Service Data/IA intégré :** [ia/](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2/ia)

**Documentation technique historique complète d'Ali :** [LIVRABLE.md — V3](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/LIVRABLE.md)

---

## 1. Données nettoyées et préparées

Le pipeline historique Data/IA V3 a traité les données du référentiel olfactif afin de produire des fichiers exploitables.

### Résultats documentés

| Indicateur                   | Résultat |
| ---------------------------- | -------: |
| Fichiers sources traités     |       13 |
| Notes olfactives             |       72 |
| Familles internes            |        9 |
| Ambiances                    |       18 |
| Références fictives          |       34 |
| Duels                        |        5 |
| Notes naturelles             |       53 |
| Notes avec allergènes connus |       28 |

Les fiches comportent des informations documentaires sur les matières, leurs origines et leurs caractéristiques, lorsque ces informations sont disponibles.

### Preuves

[Données historiques V3](https://github.com/Hackathon-Givaudan/hackathon-app/tree/feature/data-ia-v3/ia-v3/data)

[Données du service intégré V2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2/ia/data)

**Fiche bergamote — Partie 1**

![Fiche bergamote, première partie](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/1_donnees_fiche_bergamote_a.jpg)

**Fiche bergamote — Partie 2**

![Fiche bergamote, deuxième partie](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/1_donnees_fiche_bergamote_b.jpg)

---

## 2. Pipeline de traitement fonctionnel

Le pipeline prépare, nettoie, contrôle et fusionne les sources de données.

### Commande de reproduction sur la version V3 historique

Depuis `ia-v3/` :

```bash
python -m pip install -r requirements.txt
python pipeline/build_data.py
```

### Résultats obtenus

- 72 notes préparées.
- 9 familles.
- 18 ambiances.
- 34 références fictives.
- Aucune erreur bloquante.
- Production du kit de données pour l'atelier.

Trois avertissements de couverture ont été identifiés : seulement deux notes marines, deux notes iodées et deux notes musquées.

Le pipeline a été exécuté sur deux ordinateurs différents, avec reproduction des résultats.

### Preuves

[Code du pipeline historique](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/pipeline/build_data.py)

[Rapport de contre-validation](https://github.com/Hackathon-Givaudan/hackathon-app/pull/100)

---

## 3. Modèle publié et exploitable

### Moteur Data/IA V3 historique

Ali a développé un moteur de recommandation fondé sur des règles de rapprochement entre les intentions du client, les notes olfactives et une banque de références fictives.

La version 3.1.0 ajoute un support optionnel de Mistral via Ollama. Les règles restent prioritaires et permettent de conserver une réponse si le LLM n'est pas disponible.

L'évaluation de l'option Mistral avec un modèle réel reste distincte de la validation du moteur à règles.

### Service utilisé par le prototype V2

L'équipe Tech a intégré une partie du travail Data/IA d'Ali dans le dossier `ia/` de la branche `v2`, notamment à travers la PR #86.

La documentation du service `v2` décrit :

1. L'extraction d'étiquettes à partir des envies exprimées par une marque.
2. Le rapprochement avec les références du catalogue.
3. La sélection de notes olfactives accompagnées de leur justification.
4. La recherche d'une référence existante proche, plutôt qu'une création sur mesure.

L'intégration au prototype a été confirmée par l'équipe Tech.

### Preuves

[Modèle historique — app/moteur.py](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/app/moteur.py)

[Code actuel du service V2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2/ia/app)

[Documentation du service V2](https://github.com/Hackathon-Givaudan/hackathon-app/blob/v2/ia/README.md)

[PR #86 — Intégration du travail Data d'Ali](https://github.com/Hackathon-Givaudan/hackathon-app/pull/86)

**Publication du modèle sur GitHub**

![Publication du modèle historique](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/3_publication_github_ia-v3.jpg)

**Historique des commits**

![Historique Git](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/3_publication_commits.jpg)

---

## 4. Métriques et protocole de validation sur 30 cas

L'équipe Data a constitué un jeu de 30 cas de référence et défini des critères de validation.

Les résultats historiques ont été reproduits sur un deuxième ordinateur.

### Résultats

| Métrique                                        | Résultat V3 historique |
| ----------------------------------------------- | ---------------------: |
| Famille dominante exacte                        |                   80 % |
| Famille attendue dans le Top 3                  |                  100 % |
| Notes attendues retrouvées                      |                   80 % |
| Plateaux sans note interdite                    |                  100 % |
| Champs du brief correctement restitués          |                  100 % |
| Latence locale p95 lors de la contre-validation |                2,18 ms |

Une évaluation complémentaire sur 10 cas V3 indique que la référence attendue apparaît dans les trois suggestions sur les dix cas existants.

### Reproduction

Depuis `ia-v3/` :

```bash
python evaluation/evaluate.py
```

Pour la version historique testée indépendamment :

```bash
python -m pytest -q tests
```

**Résultat de la contre-validation : 21 tests réussis sur 21.**

Le livrable d'Ali documente ensuite 28 tests pour la version 3.1.0. Ces 28 tests n'ont pas été reproduits dans notre rapport historique de contre-validation.

### Limites

Les cas et les réponses attendues ont été préparés par l'équipe Data. Les métriques sont donc à compléter par des tests sur des briefs clients réellement indépendants.

Six divergences de famille dominante ont été analysées dans le rapport complémentaire.

Ces chiffres concernent le moteur historique évalué et ne constituent pas automatiquement des métriques de la version intégrée sur `v2`.

### Preuves

[Jeu des 30 cas](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/evaluation/cas_reference.json)

[Protocole de validation](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/docs/protocole_validation.md)

[Résultats historiques](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/evaluation/resultats.md)

[Évaluation du service V2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2/ia/evaluation)

[Rapport de contre-validation — PR #100](https://github.com/Hackathon-Givaudan/hackathon-app/pull/100)

**Résultats de l'évaluation**

![Tableau des métriques](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/4_metriques_tableau.jpg)

**Métriques accessibles par l'API historique**

![API métriques](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/4_metriques_api.jpg)

---

## 5. API fonctionnelle renvoyant les résultats du modèle

La version historique d'Ali fournit une API FastAPI avec 24 routes documentées dans son livrable 3.1.0.

Les routes sont reliées au moteur de recommandation et permettent notamment d'obtenir une analyse de brief, des notes et des références proposées.

### Reproduction historique avec Docker

Depuis `ia-v3/` :

```bash
docker build -t data-ia .
docker run -p 8001:8000 data-ia
```

Documentation Swagger :

`http://localhost:8001/docs`

### Exemple documenté

Brief utilisateur :

> Restaurant en bord de mer, bougie fraîche et iodée, prix accessible.

L'API historique retourne une analyse structurée du brief, un plateau de notes et trois références proches accompagnées de leurs explications.

Le service actuellement intégré au prototype est documenté séparément dans `v2/ia/`, avec un contrat API général disponible à la racine du dépôt.

### Preuves

[API historique — app/main.py](https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/app/main.py)

[API Data/IA actuelle sur V2](https://github.com/Hackathon-Givaudan/hackathon-app/blob/v2/ia/app/main.py)

[Contrat OpenAPI du projet](https://github.com/Hackathon-Givaudan/hackathon-app/blob/v2/openapi.yaml)

**Tests automatiques historiques**

![21 tests automatiques réussis](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_tests_21_passed.png)

**Swagger — Première partie**

![Swagger partie 1](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_api_swagger_routes_1.jpg)

**Swagger — Deuxième partie**

![Swagger partie 2](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_api_swagger_routes_2.jpg)

**Exemple de brief analysé**

![Brief analysé par l'API](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_api_recommandation_brief.jpg)

**Plateau de notes proposé**

![Plateau de notes](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_api_recommandation_plateau.jpg)

**Trois références proches expliquées**

![Trois références recommandées](https://raw.githubusercontent.com/Hackathon-Givaudan/hackathon-app/feature/data-ia-v3/ia-v3/docs/livrable/5_api_recommandation_references.jpg)

---

## 6. Contributions complémentaires — Hamza

### Référentiel des familles olfactives

Création d'un référentiel comprenant six familles de parfums et six axes d'arômes avec définitions, exemples et limites documentaires.

[PR #69 — Familles olfactives](https://github.com/Hackathon-Givaudan/hackathon-app/pull/69)

### Fiches matières

Création de dix fiches matières avec caractéristiques, sources disponibles et limites.

Corrections effectuées après revue Tech :

- Harmonisation du nom « Fleur d'oranger ».
- Renommage de « Ambre gris » avec mention du substitut.
- Renseignement de la famille du musc blanc.
- Documentation de la différence de position de la bergamote.

L'algue et la menthe aquatique conservent des champs non renseignés lorsque les informations ne sont pas vérifiées.

[PR #79 — Fiches matières](https://github.com/Hackathon-Givaudan/hackathon-app/pull/79)

### Contre-validation indépendante de l'exécution

Sur un deuxième ordinateur :

- Pipeline exécuté sans erreur bloquante.
- 21 tests automatiques réussis.
- Résultats des 30 cas reproduits.
- Six écarts de classification analysés.
- Limites méthodologiques documentées.

Cette contre-validation porte sur une version V3 historique, distincte du service actuellement intégré sur `v2`.

[PR #100 — Rapport de contre-validation](https://github.com/Hackathon-Givaudan/hackathon-app/pull/100)

---

## 7. Intégration au prototype Tech

L'équipe Tech a confirmé l'intégration du service Data/IA au prototype.

Le service intégré se trouve sur la branche `v2`, dans le dossier `ia/`.

[Branche V2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2)

[Service Data/IA V2](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2/ia)

[Code de l'application](https://github.com/Hackathon-Givaudan/hackathon-app/tree/v2)

La version historique 3.1.0 reste accessible séparément comme référence technique, avec ses données, ses métriques et ses captures.

---

## 8. Limites et prochaines étapes

- Les références historiques utilisées pour la démonstration sont fictives.
- Certaines familles olfactives sont peu représentées.
- Une validation indépendante sur de nouveaux briefs est nécessaire.
- Les performances de l'option Mistral via Ollama doivent être évaluées séparément.
- Les métriques de la V3 historique ne doivent pas être confondues avec celles du service V2.
- Les données documentaires complémentaires nécessitent une validation métier avant leur utilisation définitive.

---

## 9. Tableau récapitulatif des livrables de jeudi

| Livrable demandé par HETIC           | Preuve                                            |
| ------------------------------------ | ------------------------------------------------- |
| 1. Données nettoyées et préparées    | Sources, données traitées et fiches documentées   |
| 2. Pipeline fonctionnel              | Script de préparation, contrôles et résultats     |
| 3. Modèle publié                     | Code V3 historique et service intégré à V2        |
| 4. Métriques et protocole sur 30 cas | Jeux de référence, résultats et contre-validation |
| 5. API fonctionnelle                 | Code FastAPI, OpenAPI et captures de réponses     |


**Livraison Data/IA — G11 YAMA — 12 novembre 2026**

Document de synthèse réunissant les réalisations d'Ali et de Hamza, les cinq livrables demandés par HETIC et leurs preuves techniques.
