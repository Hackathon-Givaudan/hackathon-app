
# Contre-validation Data — G11 YAMA

Date : 12/11/2026  
Responsable : équipe Data — contre-vérification indépendante de l'exécution  
Modèle : Data/IA V3 (moteur à règles)

## 1. Objectif

Vérifier la reproductibilité du pipeline, des tests automatiques et des résultats d'évaluation du service Data/IA V3 développé par Ali.

Cette contre-validation a été réalisée sur un deuxième ordinateur, sans modification du moteur ni des cas de référence.

## 2. Méthodologie

Branche source : `feature/data-ia-v3`

Commandes exécutées depuis `ia-v3` :

- `python pipeline/build_data.py`
- `python -m pytest -q tests`
- `python evaluation/evaluate.py`

Environnement : Windows, Python 3.13.1.

## 3. Vérification du pipeline

Le pipeline s'est exécuté sans erreur bloquante.

Données préparées :
- 72 notes olfactives.
- 9 familles.
- 18 ambiances.
- 34 références fictives.
- 5 duels.

Trois avertissements ont été identifiés :
- Famille marine : 2 notes.
- Famille iodée : 2 notes.
- Famille musquée : 2 notes.

Ces avertissements ne bloquent pas l'exécution, mais indiquent une représentation limitée de certaines familles.

## 4. Tests automatiques

Résultat : **21 tests réussis sur 21**.

Deux avertissements non bloquants ont été affichés lors de l'exécution.

## 5. Reproduction des 30 cas

| Métrique | Résultat reproduit |
|---|---|
| Famille dominante exacte | 80 % |
| Famille attendue dans le Top 3 | 100 % |
| Notes attendues retrouvées | 80 % |
| Bonne famille parmi les 3 pistes | 100 % |
| Plateaux sans note interdite | 100 % |
| Champs format, positionnement, intensité et engagements | 100 % |
| Latence locale p95 | 2,18 ms |

Les pourcentages correspondent au rapport original d'Ali.

## 6. Validation des 10 cas V3

- Champs du brief : 100 % sur les cas existants.
- Bonne référence dans les trois propositions : 100 %.
- Comparaison aléatoire annoncée : 34 %.

Ces résultats sont reproductibles sur les mêmes cas, mais ne prouvent pas encore la généralisation à de nouveaux briefs.

## 7. Analyse des écarts

Six cas présentent une différence entre la famille dominante attendue et la famille prédite.

| Cas | Attendue | Prédite | Observation |
|---|---|---|---|
| C06 | Boisée | Ambrée | Alternative plausible avec oud, rose et safran. |
| C13 | Ambrée | Marine | La demande évoque une plage tropicale. |
| C21 | Florale | Hespéridée | Le citron vert est cohérent, mais l'axe fruité manque. |
| C22 | Iodée | Marine | Deux familles olfactives proches. |
| C25 | Aromatique | Hespéridée | Le citron et la menthe expliquent les deux interprétations. |
| C29 | Aromatique | Musquée | Le brief mentionne explicitement le musc. |

Dans le jeu de référence, ces six prédictions figurent parmi les familles alternatives acceptables.

Le score strict de famille dominante reste de 80 %.

## 8. Limites identifiées

- Les cas C10, C21 et C28 concernent des arômes fruités mais utilisent une famille dominante florale.
- Les neuf familles internes ne correspondent pas directement aux six axes d'arômes prévus pour l'interface.
- Les cas et les réponses attendues ont été préparés par l'équipe Data.
- L'évaluation ne remplace pas une validation indépendante par Product ou des experts.
- Les résultats locaux ne prouvent pas à eux seuls que l'API est connectée au frontend.

## 9. Recommandations

1. Faire relire les classifications ambiguës par Product.
2. Préparer dix nouveaux briefs non vus par le moteur.
3. Vérifier indépendamment la pertinence des trois références proposées.
4. Conserver les métriques initiales sans ajustement rétroactif.
5. Tester l'intégration complète avec Tech.

## 10. Conclusion

Le pipeline fonctionne sur un deuxième ordinateur.

Les 21 tests automatiques réussissent, et les métriques annoncées sur les 30 cas de référence ont été reproduites.

La V3 est reproductible sur le jeu d'évaluation existant. Sa pertinence sur des demandes inédites et son intégration complète dans le prototype restent à vérifier.
