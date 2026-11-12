# Dictionnaire des données (version finale du 12/11/2026)

Règle générale : chaque donnée a sa source et sa date. `date_source` est la date de consultation.

## Fichiers produits (`data/processed/`)

| Fichier                   | Contenu                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `notes.json`, `notes.csv` | 72 notes : fiche matière complète                                               |
| `familles.json`           | 9 familles de la maquette V2, avec image, couleur et liste de notes             |
| `ambiances.json`          | 18 ambiances : texte, notes liées, familles, image et son libres de droits      |
| `questions.json`          | 5 questions du profil (2 en images, 1 en sons, 2 en mots), 32 options pondérées |
| `lexique.json`            | vocabulaire utilisé pour lire les briefs                                        |
| `kit_atelier.json`        | 30 notes de base proposées                                                      |
| `rapport_qualite.json`    | contrôles du pipeline : erreurs bloquantes, avertissements, répartitions        |

## Champs d'une note

| Champ                                                                                   | Contenu                                                                            | Source                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `famille`, `famille_nom`, `couleur_token`, `couleur`                                    | famille V2 et sa couleur `note-*`                                                  | maquette V2 (tokens)                                                                          |
| `facette`                                                                               | nuance dans la famille (fruitée, épicée, gourmande…)                               | équipe Data                                                                                   |
| `etage`, `tenue`                                                                        | tête / cœur / fond ; tenue courte / moyenne / longue, déduite de l'étage           | équipe Data                                                                                   |
| `usage`                                                                                 | parfum, arome ou les_deux                                                          | équipe Data                                                                                   |
| `descripteurs`, axes (`fraicheur`, `chaleur`, `douceur`, `boise`, `intensite` de 0 à 5) | profil olfactif                                                                    | estimation équipe Data, à valider                                                             |
| `description_client`                                                                    | une ou deux phrases pour la fiche matière                                          | équipe Data                                                                                   |
| `origine`, `origine_statut`, `source_origine`                                           | principales zones de production                                                    | article Wikipédia de la matière ; le statut dit si les lieux ont été retrouvés dans l'article |
| `obtention`, `source_obtention`                                                         | expression, distillation, absolue, résinoïde, CO2, synthèse                        | Wikipédia (Huile essentielle, Résinoïde, Parfum)                                              |
| `accords`                                                                               | 3 notes qui vont bien avec                                                         | proposition équipe Data, à valider                                                            |
| `naturel`                                                                               | une matière naturelle existe et sert de source (faux pour les accords de synthèse) | équipe Data                                                                                   |
| `vegan`                                                                                 | faux pour l'ambre gris naturel et l'absolue de cire d'abeille                      | équipe Data                                                                                   |
| `durable`, `vigilance`, `source_vigilance`                                              | point de vigilance : UICN, CITES, allergènes, origine animale                      | article source (UICN et CITES vérifiés dans le texte)                                         |
| `image`                                                                                 | URL, vignette, auteur, licence, crédit                                             | Wikimedia Commons                                                                             |
| `ambiances`                                                                             | ambiances où la note apparaît                                                      | équipe Data                                                                                   |

## Passage des 6 familles de la V1 aux 9 familles de la V2

| V1                        | V2                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| agrumes                   | hespéridée                                                                                                                 |
| florale                   | florale                                                                                                                    |
| fruitée                   | florale (pêche, fraise, framboise, cerise, ananas, mangue) ou verte (pomme, poire, cassis, figue) ; noix de coco en ambrée |
| verte et aromatique       | verte (thé, galbanum, concombre) ou aromatique (herbes)                                                                    |
| boisée                    | boisée                                                                                                                     |
| ambrée, épicée, gourmande | ambrée ; épices fraîches (poivre, cardamome, gingembre) en aromatique ; musc en musquée                                    |
| (absente)                 | marine (algue, embruns), iodée (sel marin, criste marine), musquée (musc, ambrette) : 5 notes ajoutées                     |

La V2 n'a pas de famille fruitée ni gourmande. C'est un problème pour les arômes : à trancher avec Product. La colonne `facette` garde l'information pour pouvoir changer vite.

## Origines : ce qui est vérifié

- 47 notes : les lieux d'origine ont été retrouvés dans l'article source.
- 5 notes : une partie seulement des lieux a été retrouvée (iris, sauge sclarée, oud, mousse de chêne, clou de girofle). Le champ `origine_statut` liste ce qui est confirmé.
- 20 notes : accords ou molécules de synthèse, sans origine géographique.

## Licences des images et des sons

Uniquement domaine public, CC0, CC BY et CC BY-SA. Toujours afficher le crédit (`auteur`, `licence`, « via Wikimedia Commons »). Une image CC BY-SA modifiée doit rester sous la même licence. Les fichiers sont référencés par URL, pas copiés.

## Ajouts V3

| Fichier (`data/processed/`)             | Contenu                                                                                                 | Source                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `duels.json`                            | 5 duels, 10 choix avec image, son et mot, poids sur les familles                                        | format : maquette V3 ; contenu : équipe Data                                   |
| `radar.json`                            | 6 axes du radar et regroupement des 9 familles                                                          | maquette V3 (Voix 06)                                                          |
| `modele_brief.json`                     | 11 champs à compléter et leurs valeurs possibles                                                        | maquette V3 (Voix 05)                                                          |
| `criteres_potentiel.json`               | 7 critères, décisions possibles, délais                                                                 | maquette V3 (Business 05), réponses de Givaudan citées dans la V3              |
| `banque_references.json`                | 34 références **fictives** (24 fragrances, 10 arômes) avec familles, engagements et allergènes calculés | équipe Data, à remplacer par la banque Givaudan                                |
| champ `allergenes_principaux` des notes | allergènes à déclarer les plus connus (28 notes)                                                        | règlement (CE) 1223/2009 annexe III ; à confirmer avec les fiches fournisseurs |
