# Protocole de validation du modèle V2

## 1. Ce qu'on mesure et les seuils

Les seuils ont été fixés avant la première exécution. Ils sont dans `evaluation/evaluate.py` (`SEUILS`).

| Métrique                        | Définition                                                                                                       | Seuil       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| Famille dominante exacte        | la 1re famille de la roue est la famille attendue                                                                | 60 %        |
| Famille attendue dans le top 3  | la famille attendue est dans les 3 premières de la roue                                                          | 85 %        |
| Notes retrouvées                | part des notes attendues présentes dans le plateau de 10 (moyenne sur les cas)                                   | 50 %        |
| Bonne famille dans les 3 pistes | une des 3 pistes est menée par la famille attendue                                                               | 85 %        |
| Respect des contraintes         | aucun plateau ne contient de note interdite par les engagements du cas                                           | 100 %       |
| Champs du brief                 | format, positionnement, intensité, engagements identiques à l'attendu (une absence attendue doit rester absente) | 80 % chacun |
| Latence                         | p95 du temps de réponse                                                                                          | < 5 s       |

Pour les taux, on donne l'intervalle de confiance à 95 % (Wilson) : avec 30 cas, un 80 % veut dire « entre 63 % et 90 % ».

## 2. Le jeu de référence

- 30 briefs réalistes de petites marques : parfums, bougies, diffuseurs, soins, produits d'entretien, arômes boisson et alimentaires. 18 cas ont aussi des réponses aux questions, 12 n'ont que le texte.
- Pour chaque cas : famille dominante attendue, familles acceptables, 3 ou 4 notes attendues, format, positionnement, intensité, engagements.
- Rédigé par l'équipe Data le 12/11/2026, **avant** l'écriture du moteur V2. Empreinte du fichier : `8fc80f201c02f4ce`. Il n'a pas été modifié depuis.
- **Limite** : la même personne a écrit les cas et le moteur. Yasmina demande que le jeu soit jugé par quelqu'un qui n'a pas construit la banque. À faire : relecture des attendus par une personne de Product ou de Tech, puis nouvelle exécution.

## 3. Procédure

1. `python pipeline/build_data.py` : 0 erreur bloquante.
2. `python -m pytest -q tests` : tous les tests passent.
3. `python evaluation/evaluate.py` (local) ou `python evaluation/evaluate.py http://localhost:8000` (via l'API).
4. Lire `evaluation/resultats.md` : tableau V1 / V2 et liste des cas en échec.

## 4. Résultats

### Exécution 1 (officielle, avant toute correction)

Fichier : `evaluation/historique/run1_avant_corrections.md`.
V2 : famille exacte 80 %, top 3 100 %, notes 79 %, pistes 100 %, contraintes 100 %, format 97 %, autres champs 100 %, p95 < 1 ms.
V1 : famille exacte 80 %, notes 69 %, contraintes 97 %, format 0 %, positionnement 60 %.

### Exécution 2 (après correction de 3 défauts trouvés en lisant les erreurs)

1. Les noms en deux mots n'étaient reconnus qu'en entier (« menthe poivrée ») : « menthe » seul est maintenant reconnu.
2. Le mot-clé « nature » reconnaissait aussi « naturel » : les mots-clés sont maintenant cherchés en mots entiers.
3. « Marque de parfum » décrivait la marque, pas le format : un format plus précis (eau de toilette, bougie…) l'emporte désormais.

V2 : notes 80 %, format 100 %, le reste inchangé. Ces corrections ont été faites après avoir vu les cas, donc l'exécution 2 est un peu optimiste. L'exécution 1 reste la mesure de référence.

## 5. Ce que les échecs montrent

- **Désaccords de famille** (C06, C13, C21, C22, C25, C29) : les cas mélangent deux familles proches (oud et safran : boisée ou ambrée ? algue et sel : marine ou iodée ?). La famille attendue est toujours dans le top 3.
- **Contraintes qui enlèvent des notes attendues** (C14 « matières durables ») : le moteur écarte encens et santal, ce qui est voulu, mais il ne propose pas tous les remplaçants attendus.
- **Fruits** : la V2 n'a pas de famille fruitée. Les fruits ont été rangés en florale (facette fruitée) ou verte (pomme, poire, cassis, figue). Pour les arômes, c'est discutable (C21 : mangue et citron vert).

## 6. Biais et limites connus

- Jeu de 30 cas écrit par l'équipe, pas par de vrais clients : à compléter avec de vrais verbatims.
- Axes et poids des questions estimés par l'équipe Data, pas mesurés sur des panels.
- Lexique en français uniquement ; les fautes d'orthographe et l'argot ne sont pas gérés.
- La « bonne référence » de Yasmina (formule existante dans les 3 pistes) ne peut pas être mesurée tant que la banque de parfums n'est pas branchée. On mesure à la place la bonne famille dans les pistes.

## 7. Cas V3 : brief structuré et références proches

- 10 cas (`evaluation/cas_reference_v3.json`, empreinte `6b0aba09e05d1c33`), écrits avant l'adaptation du moteur à la V3.
- Mesures : exactitude des 12 champs (domaine, format, budget au kilo, volume annuel, pays de vente, mise en concurrence, relation, type de projet, cible, objectif, contraintes, engagements) ; présence d'une référence acceptable dans les 3 propositions (la mesure demandée par Yasmina), comparée à 3 références tirées au hasard dans le même domaine.
- Seuils : 80 % pour les champs, 70 % pour les références.
- Première exécution : champs 100 %, bonne référence 100 % (IC95 72 % à 100 %), hasard 34 %. Fichier : `evaluation/historique/run3_v3_premiere_execution.md`.
- **Ce chiffre est optimiste** : le lexique des nouveaux champs a été écrit en connaissant les 10 cas, et la banque fictive a été construite par la même personne. Des briefs reformulés autrement ont révélé 3 manques, corrigés ensuite : nombres avec espace (« 3 000 kg »), « en concurrence avec », « aller vite ». Prochaine étape : 10 briefs écrits par Product ou par de vraies marques, sans les montrer à la Data avant la mesure.

## 8. Option Mistral

Les résultats officiels (sections 4 et 7) sont mesurés sans Mistral. Pour mesurer l'apport du modèle sur les mêmes cas et avec les mêmes seuils, Ollama lancé et `mistral:7b` installé :

```bash
python evaluation/evaluate.py --llm
```

Le script compare « règles seules » et « règles + Mistral », latence comprise, et écrit `evaluation/resultats_llm.md` sans toucher aux résultats officiels. L'option ne sera activée par défaut que si elle améliore les métriques sans dépasser le seuil de 5 s.
