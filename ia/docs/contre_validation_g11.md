# Contre-validation Data/IA V3 — G11 YAMA

**Date :** 12 novembre 2026  
**Responsable :** Hamza Laztouti — équipe Data  
**Projet :** HETIC — Givaudan AI Challenge  
**Modèle évalué :** Data/IA V3, moteur de recommandation fondé sur des règles  
**Branche source :** `feature/data-ia-v3`  
**Branche d'intégration du rapport :** `v2`

---

## 1. Objectif

L'objectif de cette contre-validation est de vérifier la reproductibilité du pipeline de préparation des données, des tests automatiques et des résultats d'évaluation du service Data/IA V3 développé par Ali Mghari.

Cette vérification a été réalisée sur un deuxième ordinateur, dans un environnement distinct de celui du développeur initial.

Elle vise à confirmer que les résultats annoncés peuvent être reproduits sans modifier le moteur, les données de référence ou les critères d'évaluation.

### Périmètre

Ce rapport concerne la version historique du moteur Data/IA V3 testée le 12 novembre 2026, avant les dernières évolutions de la version 3.1.0.

Il ne constitue pas une validation :

- Du service actuellement utilisé sur la branche `v2`.
- Des dernières modifications de la version 3.1.0.
- Du fonctionnement réel de Mistral via Ollama.
- De l'intégration complète entre le moteur et le prototype frontend.

Les résultats documentés correspondent à l'exécution de 21 tests automatiques et aux jeux de référence existants.

---

## 2. Environnement et méthodologie

### Environnement technique

| Élément | Configuration |
|---|---|
| Système d'exploitation | Windows |
| Version de Python | Python 3.13.1 |
| Projet GitHub | `Hackathon-Givaudan/hackathon-app` |
| Branche du moteur testé | `feature/data-ia-v3` |
| Dossier du service | `ia-v3/` |
| Type de moteur | Moteur déterministe fondé sur des règles |
| Jeux d'évaluation | 30 cas de référence + 10 cas V3 |

### Commandes exécutées

Depuis le dossier `ia-v3/` :

```bash
python -m pip install -r requirements.txt
python pipeline/build_data.py
python -m pytest -q tests
python evaluation/evaluate.py
```

### Démarche de vérification

1. Récupération de la branche V3 existante depuis GitHub.
2. Installation des dépendances Python nécessaires.
3. Exécution du pipeline de préparation des données.
4. Exécution des tests automatiques.
5. Reproduction des métriques sur les 30 cas de référence.
6. Évaluation des 10 cas complémentaires V3.
7. Analyse des divergences de classification.
8. Comparaison des résultats obtenus avec ceux annoncés par Ali.
9. Rédaction d'un rapport de contre-validation indépendant de l'exécution initiale.

Aucune modification des règles du moteur ni des résultats attendus n'a été effectuée pour améliorer artificiellement les scores.

---

## 3. Vérification des données et du pipeline

Le pipeline de préparation des données s'est exécuté correctement, sans erreur bloquante.

### Données préparées

| Indicateur | Résultat |
|---|---:|
| Notes olfactives | 72 |
| Familles | 9 |
| Ambiances | 18 |
| Références fictives | 34 |
| Duels | 5 |
| Notes de tête | 30 |
| Notes de cœur | 23 |
| Notes de fond | 19 |
| Notes naturelles | 53 |
| Notes avec allergènes connus | 28 |
| Origines confirmées par une source | 47 |
| Origines partiellement confirmées | 5 |
| Accords ou synthèses | 20 |
| Erreurs bloquantes | 0 |

### Avertissements du pipeline

Trois avertissements non bloquants ont été identifiés :

| Famille | Nombre de notes |
|---|---:|
| Marine | 2 |
| Iodée | 2 |
| Musquée | 2 |

Ces avertissements montrent que certaines familles sont moins représentées dans le référentiel.

Cette situation peut limiter la diversité des recommandations pour les briefs fortement orientés vers ces univers olfactifs.

### Conclusion du contrôle

Le pipeline est exécutable et permet de produire les données nécessaires au moteur.

Les avertissements identifiés concernent principalement la couverture du référentiel et ne bloquent pas son fonctionnement.

---

## 4. Vérification des tests automatiques

La commande suivante a été exécutée :

```bash
python -m pytest -q tests
```

### Résultat

**21 tests réussis sur 21.**

Deux avertissements non bloquants ont été affichés pendant l'exécution.

Aucun test automatique n'a échoué dans la version évaluée.

Ce résultat confirme que les comportements couverts par les tests existants sont reproductibles sur un deuxième environnement.

Il ne garantit pas à lui seul l'absence de défauts sur des scénarios non testés.

### Évolution du projet

Le document de livraison d'Ali indique que la version 3.1.0 dispose désormais de 28 tests automatiques.

Ces 28 tests n'ont pas été exécutés dans le cadre de cette contre-validation. Ils ne doivent donc pas être confondus avec les 21 tests effectivement reproduits.

---

## 5. Évaluation sur les 30 cas de référence

La commande suivante a été exécutée :

```bash
python evaluation/evaluate.py
```

### Résultats reproduits

| Métrique | Résultat |
|---|---:|
| Famille dominante exacte | 80 % |
| Famille attendue parmi les trois premières | 100 % |
| Notes attendues retrouvées dans le plateau | 80 % |
| Famille attendue présente parmi les trois suggestions | 100 % |
| Plateaux sans note interdite | 100 % |
| Champs du brief correctement restitués : format, positionnement, intensité et engagements | 100 % |
| Latence locale p95 | 2,18 ms |

### Interprétation

**Famille dominante exacte — 80 %**

Sur les 30 cas de référence, le moteur retrouve exactement la famille dominante attendue dans 24 cas.

Six cas présentent une différence entre la famille dominante attendue et celle prédite.

**Famille attendue dans le Top 3 — 100 %**

Pour les 30 cas testés, la famille attendue figure parmi les trois premières familles proposées.

**Notes attendues retrouvées — 80 %**

Le moteur retrouve 80 % des notes attendues dans le plateau de recommandations.

**Respect des exclusions — 100 %**

Aucune note explicitement interdite n'apparaît dans les plateaux produits pour les cas de référence testés.

**Restitution des champs du brief — 100 %**

Les champs évalués concernant le format, le positionnement, l'intensité et les engagements correspondent aux valeurs attendues.

### Latence

La latence locale au 95e percentile est de 2,18 ms sur l'ordinateur utilisé pour la contre-validation.

Cette mesure concerne le traitement local du moteur dans les conditions du test. Elle ne représente pas le temps de réponse complet du frontend, des échanges réseau ou d'un éventuel modèle LLM.

### Bilan

Les principales métriques de la version évaluée correspondent aux résultats annoncés dans le rapport initial d'Ali.

La reproductibilité des mesures sur le jeu de référence existant est donc confirmée.

---

## 6. Vérification des 10 cas complémentaires V3

Un deuxième ensemble de 10 cas V3 a été évalué afin de vérifier le comportement du moteur sur les fonctionnalités supplémentaires.

### Résultats

| Critère | Résultat |
|---|---:|
| Champs du brief correctement restitués | 100 % |
| Référence attendue présente dans les trois propositions | 100 % |
| Comparaison aléatoire annoncée | 34 % |

Les résultats obtenus correspondent à ceux annoncés dans l'évaluation existante.

### Interprétation

Le moteur est capable de retrouver la référence attendue parmi les trois propositions sur l'ensemble des 10 cas V3 utilisés.

Toutefois, ces cas ont été préparés dans le cadre du développement Data/IA.

Ils ne constituent pas un jeu de test indépendant permettant d'estimer la performance sur de nouveaux clients.

### Limite méthodologique

Une bonne performance sur des cas déjà utilisés par l'équipe de développement ne garantit pas le même niveau de pertinence sur des demandes inédites.

Une évaluation complémentaire sur des briefs rédigés par Product, sans consultation des cas existants, est recommandée.

---

## 7. Analyse détaillée des écarts de classification

Sur les 30 cas de référence, six cas présentent une différence entre la famille dominante attendue et celle retenue par le moteur.

| Cas | Famille attendue | Famille prédite | Observation |
|---|---|---|---|
| C06 | Boisée | Ambrée | La présence d'oud, de rose et de safran rend l'alternative ambrée plausible. |
| C13 | Ambrée | Marine | Le brief évoque une ambiance de plage tropicale pouvant favoriser l'interprétation marine. |
| C21 | Florale | Hespéridée | La présence de citron vert explique la proposition hespéridée, tandis que l'axe fruité reste peu représenté. |
| C22 | Iodée | Marine | Les familles iodée et marine peuvent partager des caractéristiques olfactives proches. |
| C25 | Aromatique | Hespéridée | L'association de menthe et de citron permet plusieurs interprétations cohérentes. |
| C29 | Aromatique | Musquée | La mention explicite du musc peut expliquer la prédiction musquée. |

### Observation générale

Ces six divergences ne correspondent pas nécessairement à des recommandations entièrement incohérentes.

Dans le jeu de référence, les familles prédites figurent parmi les alternatives acceptables.

Cependant, pour une comparaison stricte avec la famille dominante attendue, elles restent comptabilisées comme des différences.

Le score exact demeure donc de **80 %**, sans modification rétroactive.

### Validation métier nécessaire

Une relecture par Product et, idéalement, par des experts en parfumerie permettrait de déterminer si les alternatives proposées sont réellement pertinentes.

---

## 8. Limites identifiées

### 8.1. Couverture des familles olfactives

Certaines familles sont sous-représentées dans les données disponibles :

- Marine : 2 notes.
- Iodée : 2 notes.
- Musquée : 2 notes.

Cette répartition peut influencer les recommandations et limiter la richesse de certains résultats.

### 8.2. Classification des profils fruités

Les cas C10, C21 et C28 concernent des arômes à dominante fruitée, mais sont associés à la famille florale dans le jeu de référence.

Cette situation révèle une différence entre la classification interne du moteur et les axes aromatiques prévus pour l'interface.

Une clarification du référentiel est nécessaire avant de généraliser ces correspondances.

### 8.3. Cohérence entre le moteur et l'interface

Le moteur utilise neuf familles internes, tandis que l'interface Product prévoit six axes aromatiques.

Une table de correspondance validée doit permettre d'éviter les incohérences d'affichage et d'interprétation.

### 8.4. Absence d'évaluation totalement indépendante

Les cas et leurs réponses attendues ont été préparés par l'équipe Data.

Les scores peuvent donc être optimistes, même lorsque leur reproduction technique est confirmée.

### 8.5. Validation de l'intégration technique

La réussite des tests du moteur et de l'évaluation locale ne démontre pas que l'API est correctement intégrée au frontend.

Le parcours complet doit être vérifié avec Tech.

### 8.6. Différence entre les versions

La version évaluée dans ce rapport correspond à un état antérieur aux dernières évolutions 3.1.0.

Les nouvelles fonctionnalités, notamment l'option Mistral via Ollama, doivent être évaluées séparément.

---

## 9. Recommandations

### Recommandation 1 — Validation des familles ambiguës

Faire relire par Product les six cas présentant un écart de famille dominante.

Documenter les décisions prises sans modifier rétroactivement les résultats initiaux.

### Recommandation 2 — Création de briefs indépendants

Demander à Product de préparer 10 nouveaux briefs clients sans consulter les jeux d'évaluation utilisés par Data.

### Recommandation 3 — Évaluation de la pertinence métier

Faire examiner les trois références proposées pour chaque nouveau brief.

Mesurer notamment :

- La cohérence avec l'intention du client.
- La pertinence des notes proposées.
- Le respect des contraintes.
- La clarté des explications.
- L'utilité des recommandations pour choisir des échantillons.

### Recommandation 4 — Harmonisation des référentiels

Clarifier les correspondances entre les neuf familles internes du moteur et les six axes aromatiques de l'interface.

Compléter progressivement les familles sous-représentées.

### Recommandation 5 — Validation de bout en bout avec Tech

Tester le parcours complet :

1. Saisie d'un brief client.
2. Analyse par le moteur Data/IA.
3. Appel à l'API.
4. Affichage des trois références expliquées.
5. Sélection des échantillons.
6. Demande du plateau.

Vérifier que les réponses affichées proviennent réellement du moteur et ne sont pas des données fixes de démonstration.

---

## 10. Contributions Data complémentaires

En parallèle de la contre-validation, plusieurs contributions ont été préparées pour améliorer la qualité des référentiels du projet.

### Référentiel des familles olfactives

Création d'un référentiel comprenant six familles de parfums et six axes d'arômes, avec définitions, exemples et limites documentées.

**Pull Request :** #69

### Fiches matières

Préparation de 10 fiches matières contenant des caractéristiques olfactives, des informations de provenance lorsqu'elles sont vérifiées, des sources et des limites documentaires.

Les corrections demandées lors de la revue Tech ont été appliquées, notamment :

- Normalisation du nom « Fleur d'oranger ».
- Renommage de « Ambre gris » avec la mention de substitut dans la remarque.
- Ajout de la famille musquée pour le musc blanc.
- Documentation de la position de la bergamote.

Les fiches de l'algue et de la menthe aquatique restent partiellement documentées.

**Pull Request :** #79

### Rapport de contre-validation

La présente contre-validation documente la reproductibilité des résultats du moteur V3 historique sur un deuxième ordinateur.

Elle complète le rapport d'évaluation initial, sans le remplacer.

**Pull Request historique :** #87

Ces contributions documentaires ne sont pas présumées intégrées au service actif de la branche `v2`. Leur utilisation effective doit être confirmée par l'équipe Tech.

---

## 11. Conclusion

La contre-validation du service Data/IA V3 historique a permis de confirmer plusieurs résultats techniques.

Le pipeline de préparation des données fonctionne sur un deuxième ordinateur, sans erreur bloquante.

Les **21 tests automatiques exécutés ont réussi**.

Les principales métriques annoncées sur les 30 cas de référence ont été reproduites :

- 80 % de familles dominantes exactes.
- 100 % de familles attendues dans le Top 3.
- 80 % de notes attendues retrouvées.
- 100 % de respect des exclusions testées.

L'évaluation des 10 cas V3 a également reproduit les résultats annoncés.

Ces observations démontrent la reproductibilité du moteur sur les jeux de tests existants.

Elles ne permettent cependant pas de conclure à une pertinence généralisée sur des demandes clients inédites.

Les prochaines priorités sont la validation métier indépendante, l'harmonisation des référentiels et la vérification de l'intégration complète avec le prototype Tech.

**Ce rapport constitue une preuve complémentaire de validation technique, et non une certification du modèle actuellement utilisé sur la branche `v2`.**

---

## 12. Références GitHub

**Dépôt du projet :**  
https://github.com/Hackathon-Givaudan/hackathon-app

**Branche V3 historique :**  
https://github.com/Hackathon-Givaudan/hackathon-app/tree/feature/data-ia-v3

**Livrable technique d'Ali :**  
https://github.com/Hackathon-Givaudan/hackathon-app/blob/feature/data-ia-v3/ia-v3/LIVRABLE.md

**Référentiel des familles — PR #69 :**  
https://github.com/Hackathon-Givaudan/hackathon-app/pull/69

**Fiches matières — PR #79 :**  
https://github.com/Hackathon-Givaudan/hackathon-app/pull/79

**Rapport de validation historique — PR #87 :**  
https://github.com/Hackathon-Givaudan/hackathon-app/pull/87