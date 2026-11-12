# Historique

## 3.1.0 (12/11/2026) : option Mistral (Ollama)

- `app/llm.py` : Mistral via Ollama (`mistral:7b`, ADR 0008), mêmes variables que `ia/` (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`) plus `AI_TIMEOUT`.
- Option `llm` (désactivée par défaut) sur `/analyse-brief`, `/brief`, `/profil`, `/recommandation`, `/references`, `/potentiel` et `/notes/{id}/pourquoi`.
- Analyse du brief complétée par le modèle dans des listes fermées ; les règles gardent la priorité ; ajouts marqués « Proposé par le modèle ».
- Explications reformulées par le modèle à partir des faits validés : `commentaire_reformule`, `lien_reformule`, `reponse_reformulee`.
- Repli sur les règles si le modèle ne répond pas ; bloc `llm` dans les réponses ; `GET /llm`.
- `evaluation/evaluate.py --llm` : règles seules contre règles + Mistral, dans `resultats_llm.md`.
- 28 tests (7 nouveaux, avec un faux serveur Ollama). Sans l'option, résultats identiques à la 3.0.0.

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
