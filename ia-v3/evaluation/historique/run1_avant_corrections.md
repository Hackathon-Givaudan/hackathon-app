# Résultats sur les 30 cas de référence

Cas : `evaluation/cas_reference.json` (empreinte SHA-256 `8fc80f201c02f4ce`). Date : 12/11/2026 11:39.

| Métrique | Seuil | V1 baseline (règles simples) | V2 modèle 2.0.0 |
|---|---|---|---|
| Famille dominante exacte | 60% | 80% (IC95 63% à 90%) OK | 80% (IC95 63% à 90%) OK |
| Famille attendue dans le top 3 de la roue | 85% | 100% (IC95 89% à 100%) OK | 100% (IC95 89% à 100%) OK |
| Notes attendues retrouvées dans le plateau de 10 | 50% | 69% OK | 79% OK |
| Bonne famille dans les 3 pistes | 85% | 100% (IC95 89% à 100%) OK | 100% (IC95 89% à 100%) OK |
| Plateaux sans note interdite (vegan, naturel, durable) | 100% | 97% (IC95 83% à 99%) non atteint | 100% (IC95 89% à 100%) OK |
| Champ format exact | 80% | 0% (IC95 0% à 11%) non atteint | 97% (IC95 83% à 99%) OK |
| Champ positionnement exact | 80% | 60% (IC95 42% à 75%) non atteint | 100% (IC95 89% à 100%) OK |
| Champ intensité exact | 80% | 80% (IC95 63% à 90%) OK | 100% (IC95 89% à 100%) OK |
| Champ engagements exact | 80% | 80% (IC95 63% à 90%) OK | 100% (IC95 89% à 100%) OK |
| Latence p95 (ms) | < 5000 | 0.17 (médiane 0.13) | 0.79 (médiane 0.6) |

## Détail V2 modèle 2.0.0 : cas en échec

| Cas | Famille attendue | Famille prédite | Notes manquantes | Champs faux |
|---|---|---|---|---|
| C01 | marine | marine | citron | - |
| C06 | boisee | ambree | - | - |
| C08 | aromatique | aromatique | bergamote, thym | - |
| C09 | hesperidee | hesperidee | poivre_noir | format |
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
| C25 | aromatique | verte | eucalyptus, menthe | - |
| C26 | boisee | boisee | benjoin | - |
| C27 | florale | florale | ylang_ylang | - |
| C28 | florale | florale | citron_vert | - |
| C29 | aromatique | musquee | - | - |
| C30 | marine | marine | citron | - |
