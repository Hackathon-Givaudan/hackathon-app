# Résultats sur les 30 cas de référence

Cas : `evaluation/cas_reference.json` (empreinte SHA-256 `8fc80f201c02f4ce`). Date : 12/11/2026 14:42.

| Métrique | Seuil | V1 baseline (règles simples) | Modèle 3.1.0 |
|---|---|---|---|
| Famille dominante exacte | 60% | 80% (IC95 63% à 90%) OK | 80% (IC95 63% à 90%) OK |
| Famille attendue dans le top 3 de la roue | 85% | 100% (IC95 89% à 100%) OK | 100% (IC95 89% à 100%) OK |
| Notes attendues retrouvées dans le plateau de 10 | 50% | 69% OK | 80% OK |
| Bonne famille dans les 3 pistes | 85% | 100% (IC95 89% à 100%) OK | 100% (IC95 89% à 100%) OK |
| Plateaux sans note interdite (vegan, naturel, durable) | 100% | 97% (IC95 83% à 99%) non atteint | 100% (IC95 89% à 100%) OK |
| Champ format exact | 80% | 0% (IC95 0% à 11%) non atteint | 100% (IC95 89% à 100%) OK |
| Champ positionnement exact | 80% | 60% (IC95 42% à 75%) non atteint | 100% (IC95 89% à 100%) OK |
| Champ intensité exact | 80% | 80% (IC95 63% à 90%) OK | 100% (IC95 89% à 100%) OK |
| Champ engagements exact | 80% | 80% (IC95 63% à 90%) OK | 100% (IC95 89% à 100%) OK |
| Latence p95 (ms) | < 5000 | 0.24 (médiane 0.19) | 1.18 (médiane 0.96) |

## Détail Modèle 3.1.0 : cas en échec

| Cas | Famille attendue | Famille prédite | Notes manquantes | Champs faux |
|---|---|---|---|---|
| C01 | marine | marine | citron | - |
| C06 | boisee | ambree | - | - |
| C08 | aromatique | aromatique | bergamote, thym | - |
| C09 | hesperidee | hesperidee | poivre_noir | - |
| C11 | verte | verte | citron | - |
| C12 | florale | florale | ambrette, mandarine | - |
| C13 | ambree | marine | - | - |
| C14 | ambree | ambree | benjoin, patchouli, vetiver | - |
| C15 | iodee | iodee | algue | - |
| C18 | ambree | ambree | vanille | - |
| C19 | verte | verte | yuzu | - |
| C20 | boisee | boisee | poivre_noir | - |
| C21 | florale | hesperidee | ananas | - |
| C22 | iodee | marine | - | - |
| C23 | hesperidee | hesperidee | citron | - |
| C25 | aromatique | hesperidee | eucalyptus | - |
| C26 | boisee | boisee | benjoin | - |
| C27 | florale | florale | ylang_ylang | - |
| C28 | florale | florale | citron_vert | - |
| C29 | aromatique | musquee | - | - |
| C30 | marine | marine | citron | - |

## Cas V3 : champs du brief et 3 références proches

Cas : `evaluation/cas_reference_v3.json` (empreinte `6b0aba09e05d1c33`), 10 cas.

| Champ | Exact |
|---|---|
| domaine | 100% |
| format | 100% |
| budget_kilo | 100% |
| volume_annuel | 100% |
| pays_vente | 100% |
| mise_en_concurrence | 100% |
| relation | 100% |
| type_projet | 100% |
| cible | 100% |
| objectif | 100% |
| contraintes | 100% |
| engagements | 100% |
| **Moyenne** (seuil 80%) | **100%** |

Bonne référence dans les 3 propositions : **100%** (IC95 72% à 100%, seuil 70%) ; 3 références tirées au hasard : 34%.

