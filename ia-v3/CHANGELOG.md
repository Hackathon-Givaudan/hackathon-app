# Historique

## 3.0.0 (12/11/2026) : alignement sur la maquette V3 et la story map

- Brief V3 : 11 champs à compléter (budget au kilo, volume annuel, type de projet, cible, pays de vente, objectif, mise en concurrence, relation, contraintes…), complétude, modèle à télécharger et import.
- Profil : 5 duels (images, sons, mots), radar à 6 axes, réglage à la main, commentaire d'Aurore.
- Domaine Fragrances ou Arômes ; engagement « sans allergènes » (allergènes connus de 28 notes).
- Banque de références fictive (34) et 3 références proches expliquées par leur lien au projet.
- Potentiel critère par critère (7 critères de l'écran Business 05) avec suggestion de décision.
- Formule en deux versions à partir des fioles aimées ; aide « Pourquoi cette note ? » avec sources.
- 10 cas de référence V3, 21 tests, 23 routes.

## 2.0.0 (12/11/2026) : modèle V2 pour la revue du prototype

- Données alignées sur la maquette V2 : 9 familles (marine, hespéridée, verte, aromatique, florale, iodée, boisée, ambrée, musquée) avec leurs couleurs `note-*`.
- 5 notes ajoutées (algue, embruns, sel marin, criste marine, ambrette) : 72 notes au total.
- Fiche matière complète : origine (vérifiée dans la source), obtention, tenue, accords, description client, engagements (naturel, vegan, durable) et points de vigilance (UICN, CITES, allergènes, origine animale).
- Images : 72 notes, 9 familles, 18 ambiances. Sons : 18 ambiances. Toutes libres de droits, avec auteur et licence.
- Parcours : 5 questions du profil pondérées, roue, plateau de 10 notes, 3 pistes, kit atelier de 30 notes, variation « plus frais / moins boisé », signaux business (hypothèse).
- Pipeline de nettoyage et de validation (`pipeline/build_data.py`) avec rapport qualité.
- API FastAPI (14 routes), 17 tests, évaluation sur 30 cas de référence avec comparaison V1 / V2.

## 1.0 (10/11/2026) : Gate 1

- Service de démonstration : envies en texte libre vers notes du référentiel, Swagger factice.
- Spike LLM (#50) : qwen2.5:7b sans GPU, 58 s médian pour un seuil de 5 s, 40 % des notes attendues contre 51 % sans IA.
