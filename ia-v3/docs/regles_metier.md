# Règles du modèle V2

Toutes les règles sont dans `app/moteur.py`. Elles sont déterministes : la même entrée donne toujours la même sortie.

## 1. Analyse du brief (`POST /analyse-brief`)

- **Notes citées** : nom de la note, premier mot d'un nom composé (« menthe » pour menthe poivrée) ou synonyme du lexique (« néroli » pour fleur d'oranger). Les noms les plus longs sont cherchés en premier.
- **Notes refusées** : une note précédée, dans la même proposition, de « pas de », « sans », « éviter », « moins de »… est écartée du plateau.
- **Familles** : chaque mot-clé du lexique ajoute 0,7 à sa famille ; précédé d'une négation, il retire 0,7.
- **Champs** : lieu, moment, format, positionnement, intensité, engagements. Chaque champ renvoie sa valeur, la phrase où il a été entendu (`citation`) et le statut « Entendu », pour la carte NoteCard de la maquette.
- **Modificateurs** : « plus frais », « moins boisé », « léger », « intense »… décalent les axes cibles.

## 2. Roue olfactive (`POST /profil`)

1. Chaque réponse ajoute ses poids : 1 pour la famille principale, 0,5 pour la secondaire (`GET /questions`).
2. Le brief ajoute : 1 par note citée (à sa famille), 0,7 par mot-clé de famille, -0,5 par note refusée.
3. Les valeurs négatives sont ramenées à 0, puis la roue est ramenée à 100 %. Sans aucune entrée, la roue est uniforme.
4. Axes cibles = moyenne des axes par défaut des familles, pondérée par la roue, puis décalée par les modificateurs.

## 3. Plateau de notes

1. **Filtres** : vegan, naturel (exclut les accords de synthèse), matières durables (exclut les notes avec un point de vigilance), format (un arôme n'utilise pas une note réservée à la parfumerie), notes refusées.
2. **Score** : 2 × part de la famille dans la roue + 0,6 × proximité des axes + 0,25 par lien d'accord avec une note citée (au plus 2) + 1,5 si la note est citée.
3. **Sélection** : 3 notes de tête, 4 de cœur, 3 de fond ; au plus (10 × part de la famille + 1) notes par famille, sauf pour les notes citées. Si une contrainte vide un étage, la règle est relâchée.
4. **Alertes** : une note citée mais interdite (ex. miel pour un client vegan) produit un message.

## 4. Trois pistes

Les 3 familles en tête de la roue mènent chacune une piste : Signature (1re famille, soutenue par la 2e), Variation (2e famille), Contraste (3e famille). Chaque piste prend dans le plateau 1 note de tête, 2 de cœur et 1 de fond, de sa famille d'abord.

## 5. Kit atelier (30 notes)

Notes les plus citées comme accords par les autres notes, vegan et sans point de vigilance, au moins 2 par famille, environ 10 par étage. Proposition à valider par Hamza et Product (`GET /kit`, `data/processed/kit_atelier.json`).

## 6. Variation de dosages (`POST /variation`)

- « plus frais » = fraîcheur +1, « beaucoup plus frais » = +2, « moins boisé » = boisé -1…
- Pour monter un axe : baisser de 20 % les 2 notes les plus faibles sur cet axe, renforcer une note à 4 ou plus sur cet axe (déjà dans la formule si possible).
- Pour baisser un axe : réduire de 30 % les notes à 4 ou plus, et reporter ce dosage sur les notes de cœur à 1 ou moins.
- Renormaliser à 100 %, recommencer 3 fois au plus tant que la cible n'est pas atteinte.

## 7. Signaux de potentiel business (hypothèse)

Score sur 100 : brief précis (2 notes citées ou plus) 25, gamme prévue 20, calendrier daté 20, positionnement premium ou luxe 15, volume annoncé (boutiques, points de vente) 20. « Fort potentiel » à partir de 60. Non validé sur de vrais clients : à présenter comme une hypothèse, côté espace business uniquement.

## 8. Brief V3 (`POST /brief`)

- **Ce qu'Aurore a entendu** : produit (format), univers (phrase la plus évocatrice), émotions (familles dominantes), usage (moment), inspiration (notes citées).
- **11 champs à compléter**, comme l'écran Brief : chacun est rempli s'il est entendu, avec sa citation, sinon il est listé dans `a_completer`. `completude` vaut « x sur 11 ».
- Budget au kilo et volume annuel : nombres suivis de « € le kilo », « €/kg », « kg par an », « tonnes par an » ; les tonnes sont converties en kg.
- Mise en concurrence et relation : quand deux valeurs sont entendues, la plus prudente l'emporte (« pas encore décidé » avant « d'autres fournisseurs » ; « je ne sais pas » avant « distributeur »).
- `POST /brief/import` lit un modèle rempli et signale les valeurs inconnues (« erreur de format »).

## 9. Duels et radar (`GET /duels`, `POST /profil`)

5 duels de 2 choix, chacun en image, en son ou en mot. Le choix ajoute ses poids aux 9 familles. Le radar regroupe : hespéridé = hespéridée ; marin = marine + iodée ; aromatique = aromatique + verte ; floral = florale + musquée ; boisé = boisée ; ambré = ambrée. Un réglage à la main (+1 ou -1 sur un axe) ajoute ou retire 15 % du total à cet axe. Commentaire : « lumière » si la fraîcheur dépasse la moyenne de chaleur et douceur de plus de 0,5, « velours » dans le cas inverse.

## 10. Trois références proches (`POST /references`)

Score = 0,55 × proximité de la roue (cosinus sur les familles, cœur pondéré 1,2) + 0,3 × part des notes de la référence présentes dans le plateau ou citées + 0,15 si même format ; -0,2 si une note de la référence est interdite par les engagements (elle est alors signalée « à adapter »). Seules les références du domaine choisi sont proposées. Chaque référence donne son lien au projet : même famille, notes citées, notes partagées avec le plateau, même format.

## 11. Potentiel (`POST /potentiel`)

Les 7 critères de l'écran Business 05, chacun « favorable », « à vérifier » ou « à compléter », avec la raison : cible, pays de vente (hors UE : à vérifier), volume (à comparer au seuil Givaudan, inconnu : [X]), mise en concurrence, faisabilité réglementaire (pays hors UE, matières avec vigilance, sans allergènes, contrainte réglementaire), produits similaires (référence à 0,6 ou plus sans adaptation : chemin catalogue, environ un mois ; sinon sur-mesure, six mois en moyenne, d'après les réponses de Givaudan), engagement du client (brief rempli à 6 sur 11 ou plus, budget donné). Suggestion : prioriser (5 favorables ou plus), orienter vers la banque (produit similaire favorable), sinon mettre en attente. Hypothèse : le commercial décide.

## 12. Sans allergènes

Les notes dont un allergène à déclarer est bien connu (28 notes, liste partielle, source : règlement (CE) 1223/2009 annexe III) sont écartées ; une alerte rappelle que les autres doivent être vérifiées par le parfumeur.

## 13. Formule en deux versions (`POST /formule`)

Notes gardées : « j'aime », « un peu », « ça me rappelle ». Version A met en avant les 2 notes les plus fraîches, version B les 2 plus chaudes ; un étage vide est complété par un accord des notes aimées. Pas de dosage : il est fixé par le parfumeur. 3 références proches sont jointes.
