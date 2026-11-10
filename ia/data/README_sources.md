# Sources et transformations — profils Scento (hackathon Givaudan)

## Statut

- **50 profils de parfums commercialisés** tirés du jeu public Scento. **Ce ne sont PAS des formules Givaudan** : aucun dosage, pourcentage ou conformité produit n'est fourni.
- Séparés des 20 parfums fictifs et des 20 arômes fictifs de Product. Ne pas remplacer `ia/data/parfums.csv` ni `ia/data/aromes.csv`.
- Chaque profil conserve une URL dans le champ `source`. Source agrégée initiale : https://github.com/Scento-com/perfume-dataset (fichier d'origine `perfumes.csv`). La disponibilité des pages web n'est pas garantie.

## `parfums_scento.csv`

- Format UTF-8 avec BOM pour Excel, CSV délimité par virgules, **13 colonnes dans l'ordre** de `ia/data/parfums.csv` (branche `feature/ia-service`, observée le 10/11/2026).
- Identifiants préfixés `SCENTO-` et uniques.
- `nom` → `nom_reference`, `famille` (catégories éditoriales de Scento) → `famille_olfactive` (traductions proposées, à valider), `note_tete/coeur/fond` → `notes_de_tete/coeur/fond`.
- Notes : valeurs d'origine séparées par `;` deviennent des textes français en minuscules séparés par `|`. Une traduction lexicale et le fichier `correspondance_notes_product_scento.csv` servent de base ; **le lexique non explicitement validé par Product doit être revu** (voir `audit_traductions.csv`). Pas de déduction chimique ni de quantité.
- Les champs **ambiances, emotions, usages_compatibles, intensite_1_5, tenue, origine** restent vides : le fichier source Scento utilisé ne fournit pas des valeurs fiables pour ces rubriques. Aucune inférence de saison ou occasion n'a été effectuée.
- Les profils peuvent donc être **non proposés au geste 1** tant qu'ambiances ou émotions ne sont pas renseignées selon une règle approuvée par Product et Tech.
- Le champ `maison` du dataset d'origine n'est pas dans le contrat 13 colonnes et est volontairement omis du CSV de service (retrouvable dans la source initiale).

## Fichiers complémentaires

- `referentiel_notes_scento.csv` : référentiel brut des associations note/niveau et fréquence d'apparition (fréquences dans le CSV source, **pas des statistiques de marché**).
- `correspondance_notes_product_scento.csv` : mapping Product/Scento avec statuts de validation.
- `audit_traductions.csv` : preuve des transformations de notes pour chaque parfum et indication du niveau de confiance.

## Intégration technique à confirmer avec Wïssem

Le service actuel lit `ia/data/parfums.csv` et `ia/data/aromes.csv`. Il faut que Wïssem ajoute explicitement `parfums_scento.csv` dans `references.py` pour exploiter ces données ; le simple dépôt du CSV ne suffit pas. Ne pas présumer que l'intégration ni la compatibilité ont été testées.

## Contrôles de livraison

- 50 lignes de données et 13 colonnes ; identifiants uniques ; source non vide pour chaque ligne.
- 408 occurrences de notes traduites en suivant des règles documentées.
- Notes sans traduction identifiée : 0 occurrences (0 termes distincts). À vérifier avant usage si non nul.
- `source` reprend une page Scento par profil, pas un contrat industriel Givaudan.

## Licence et attribution

- Auteur / éditeur : Scento
- Jeu de données : Scento Perfume Database
- Source : https://www.scento.com/perfume-database
- Dépôt : https://github.com/Scento-com/perfume-dataset
- Licence : Creative Commons Attribution 4.0 International (CC BY 4.0)
- Texte de licence : https://creativecommons.org/licenses/by/4.0/

Les données ont été sélectionnées, traduites et adaptées au format du prototype Givaudan. Les profils Scento sont des références commerciales publiques et ne constituent pas des formules Givaudan.
