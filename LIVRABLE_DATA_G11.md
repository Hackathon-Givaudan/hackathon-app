# G11 YAMA — Livrable Data/IA

**HETIC × Givaudan AI Challenge 2026**
**Livraison : jeudi 12 novembre 2026**
**Équipe Data : Ali Mghari et Hamza Laztouti**

## Présentation du projet

Notre prototype accompagne une petite marque dans la création d'un brief olfactif, puis l'aide à découvrir des notes et des références adaptées à ses envies.

La partie Data/IA transforme le brief utilisateur en informations exploitables par le moteur de recommandation et par le prototype Tech.

Le travail comprend la préparation des données, le développement du moteur, l'évaluation de ses résultats et la mise à disposition d'une API.

**Périmètre des versions :** Le service Data/IA intégré au prototype se trouve sur la branche `v2`. Les résultats chiffrés, les tests et les captures historiques présentés dans ce document concernent le moteur V3 développé par Ali. Ces éléments constituent des preuves du travail Data/IA réalisé, mais ne doivent pas être interprétés automatiquement comme des mesures du service actuellement intégré sur `v2`.

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

### Qualité avant / après le pipeline

Ajout d'Ali. Fiche d'une note : `notes_base.json` seul (avant), puis `notes.json` produit par le pipeline (après).

| Indicateur                             | Avant  | Après   |
| -------------------------------------- | ------ | ------- |
| Champs par fiche                       | 17     | 40      |
| Famille V2 et couleur de l'écran       | 0 / 72 | 72 / 72 |
| Origine, obtention, tenue, accords     | 0 / 72 | 72 / 72 |
| Statut de l'origine (confirmée ou non) | 0 / 72 | 72 / 72 |
| Engagements (naturel, vegan, durable)  | 0 / 72 | 72 / 72 |
| Image libre avec auteur et licence     | 0 / 72 | 72 / 72 |
| Allergènes connus                      | 0 / 72 | 28 / 72 |
| Ambiances liées                        | 0 / 72 | 72 / 72 |

Les 100 % viennent de la fusion des sources : chaque valeur garde son statut (« confirmée », « déduite de l'étage », « estimation équipe Data »), et le service `v2` n'affiche que ce qui est confirmé.

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

### Pourquoi un moteur à règles : les mesures

Ajout d'Ali.

| Approche                                 | Qualité                                                          | Temps                       | Source                    |
| ---------------------------------------- | ---------------------------------------------------------------- | --------------------------- | ------------------------- |
| V1 : règles simples (baseline)           | 69 % des notes attendues dans le plateau (30 cas)                | 0,2 ms                      | `evaluation/resultats.md` |
| Moteur V3 (règles)                       | 80 % des notes attendues dans le plateau (30 cas)                | 1,2 ms (p95)                | `evaluation/resultats.md` |
| `qwen2.5:7b` sur PC sans carte graphique | 40 % des notes attendues (51 % sans IA), 0 note hors référentiel | **58 s** médian (seuil 5 s) | spike, PR #49             |
| `mistral:7b` sur Mac M3 (service `ia/`)  | 9 envies sur 10                                                  | 4,4 s au pire               | ADR 0008                  |
| Service `ia/` sans modèle                | 6 envies sur 10                                                  | 0,1 s                       | ADR 0008                  |

Un modèle 7B est inutilisable sur les PC de l'équipe sans carte graphique : le moteur V3 fonctionne donc par règles, avec Mistral en option.

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

### Avant / après les corrections (30 cas)

Ajout d'Ali. L'exécution 1 est la mesure de référence : 3 défauts ont ensuite été corrigés après avoir lu les erreurs (un nom en deux mots reconnu par son premier mot, les mots-clés cherchés en mots entiers, un format précis préféré à « marque de parfum »).

| Métrique                                      | Seuil | V1        | Avant (2.0.0) | Après (3.1.0) |
| --------------------------------------------- | ----- | --------- | ------------- | ------------- |
| Famille dominante exacte                      | 60 %  | 80 %      | 80 %          | 80 %          |
| Notes attendues retrouvées dans le plateau    | 50 %  | 69 %      | 79 %          | 80 %          |
| Plateaux sans note interdite                  | 100 % | 97 %      | 100 %         | 100 %         |
| Champ format exact                            | 80 %  | 0 %       | 97 %          | 100 %         |
| Champs positionnement, intensité, engagements | 80 %  | 60 à 80 % | 100 %         | 100 %         |

### Validation indépendante : 15 envies jamais vues

Ajout d'Ali. Le jeu `ia/evaluation/envies.json` a été écrit par l'équipe du service `ia/` : le moteur V3 ne l'a jamais vu, et il a été mesuré sans rien modifier, ni avant ni après ([script](docs/livrable-data-g11/mesure_envies_independantes.py), [résultats](docs/livrable-data-g11/resultats_envies_independantes.json)). Règle de l'ADR 0008 : une envie est réussie si une des notes attendues est proposée.

| Critère                                                     | Moteur V3 (3.1.0, règles) |
| ----------------------------------------------------------- | ------------------------- |
| Envies réussies, 6 meilleures notes                         | **1 / 10**                |
| Envies réussies, plateau de 10                              | 2 / 10                    |
| Envies dont une note attendue existe dans le référentiel V3 | 7 / 10                    |
| Envies où aucun mot n'est reconnu                           | 5 / 10                    |
| Textes hors sujet refusés                                   | **0 / 5**                 |

D'où l'écart : 80 % sur les 30 cas écrits par l'équipe Data, 1 envie sur 10 sur le jeu indépendant. Le lexique reconnaît les notes et les familles nommées (« bougie fraîche et iodée »), pas les ambiances ni les usages (« une terrasse au soleil », « s'endormir sereinement ») : sur la moitié des envies, aucun mot n'est reconnu. Il n'a pas non plus de garde-fou : « xyz qsdf » reçoit un plateau. Le service `ia/` fait mieux sur ce jeu (6 / 10 sans modèle, 9 / 10 avec Mistral, ADR 0008) : c'est pourquoi il reste le service unique, avec les données et les règles du V3 reprises, pas son analyse du brief. Ces résultats ne sont pas corrigés.

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

Les cas et les réponses attendues ont été préparés par l'équipe Data. Les métriques sont donc à compléter par des tests sur des briefs clients réellement indépendants. Un premier jeu indépendant est mesuré plus haut : 1 envie sur 10 réussie.

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
- Validation indépendante : 1 envie sur 10 réussie sur le premier jeu jamais vu (section 4). À compléter par de vrais briefs clients.
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
