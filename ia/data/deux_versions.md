# Deux versions d'une formule : plus fraîche, plus chaude

Règle reprise du moteur de l'équipe Data (branche `feature/data-ia-v3`, `proposer_formule`), adaptée aux formules de `ia/`. Elle s'applique aux parfums (`parfums.csv`). Les arômes ne sont pas concernés pour l'instant.

## La règle

1. **Point de départ.** On part des notes de la formule, ou des seules notes validées par la marque si elle en a validé.
2. **Version A, plus fraîche.** On classe les notes par fraîcheur décroissante. Les 2 premières sont l'**accent** de la version A : elles passent en premier dans leur étage.
3. **Version B, plus chaude.** Même chose avec la chaleur : les 2 notes les plus chaudes sont l'accent de la version B.
4. **À égalité**, on départage par ordre alphabétique de l'identifiant de note (`note_id`). Le résultat est toujours le même.
5. **La pyramide reste la même.** Chaque note garde son étage (tête, cœur, fond). Si la marque n'a validé aucune note d'un étage, on reprend une note de cet étage dans la formule de référence : la plus fraîche pour la version A, la plus chaude pour la version B.
6. **Pas de dosage.** Les proportions sont fixées par le parfumeur. Les deux versions changent l'accent, pas les parts.
7. **Si les deux accents sont identiques** (toutes les notes ont les mêmes axes), on le dit : une seule version est possible.

Exemple, `DEMO-F-012` (feuille de figuier, bergamote ; lait de figue ; cèdre, coco) :

- version A, plus fraîche : accent **bergamote** (5) et **feuille de figuier** (4) ;
- version B, plus chaude : **coco** et **lait de figue** sont à égalité (3), l'accent est donc coco puis lait de figue (ordre alphabétique).

## Les axes (`axes_notes.csv`)

Une ligne par note du référentiel Product (les 78 notes de `parfums.csv`), avec son identifiant de `ia/` (`note_id`, même calcul que `slug`) :

| Colonne     | Contenu                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `fraicheur` | de 0 (aucune fraîcheur) à 5 (très fraîche)                                                       |
| `chaleur`   | de 0 (aucune chaleur) à 5 (très chaude)                                                          |
| `source`    | `fiche <id>` : repris de `notes_atelier.json` ; `estimation : …` : note sans fiche, axes estimés |

- **39 notes** reprennent les axes de leur fiche, et 5 de plus (`menthe`, `sauge`, `mousse`, `musc`, `coco`) ceux de la fiche de la même matière sous un autre nom.
- **34 notes** n'ont pas de fiche : leurs axes sont estimés, avec la raison en quelques mots.

Tous les axes sont des **estimations de l'équipe Data, à faire valider par une personne externe** (parfumeur ou Givaudan), comme ceux des fiches.
