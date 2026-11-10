# 0008. Utiliser `mistral:7b` comme modèle local par défaut

- Statut : proposée, à relire par la Data
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

L'[ADR 0003](0003-fournisseur-ia.md) retient Ollama en local, avec `llama3.2:1b`, et note que ses réponses sont médiocres. Le service `ia/` demande au modèle une tâche précise : lire les envies d'une marque et choisir jusqu'à 5 étiquettes dans une liste fermée. Le spike de l'équipe fixe un seuil : 8 envies sur 10 bien traduites, en moins de 5 s.

Mesure du 10 novembre, sur dix envies (`ia/evaluation/envies.json`), Mac M3 Pro, modèle déjà chargé. Une envie est réussie si une des notes attendues est proposée.

| Modèle        | Taille | Envies réussies | Réponse la plus lente |
| ------------- | ------ | --------------- | --------------------- |
| Sans modèle   |        | 6 / 10          | 0,1 s                 |
| `llama3.2:1b` | 1,3 Go | 4 / 10          | 16,2 s                |
| `mistral:7b`  | 4,4 Go | 9 / 10          | 4,4 s                 |
| `qwen2.5:7b`  | 4,7 Go | 9 / 10          | 13,0 s                |

## Options

1. `mistral:7b` : seul modèle sous le seuil de temps avec 9 envies sur 10. 4,4 Go à télécharger par personne.
2. Garder `llama3.2:1b` : léger, déjà installé partout. Mais il fait moins bien que le recoupement de mots sans modèle.
3. `qwen2.5:7b` : même qualité que `mistral:7b`, mais jusqu'à 13 s par réponse.
4. Un fournisseur commercial : qualité et vitesse sans téléchargement. Mais une clé à distribuer et un coût à l'usage, écartés par l'ADR 0003 pour le développement.

## Décision

Nous choisissons l'option 1 : `mistral:7b` devient le modèle par défaut du service `ia/`, parce que c'est le seul des modèles mesurés à tenir le seuil du spike. Le fournisseur reste interchangeable par `AI_BASE_URL` et `AI_MODEL`, comme le veut l'ADR 0003, que cette décision complète.

## Conséquences

- Positives : les notes proposées en développement ressemblent à celles de la démo ; le service garde le recoupement de mots si le modèle est éteint.
- Négatives, à accepter : 4,4 Go à télécharger sur chaque machine, contre 1,3 Go ; la mesure ne porte que sur dix envies, écrites par l'auteur du code et pas encore jugées par le Product ; aucune mesure sur une machine moins puissante.
- À revoir si : le Product juge moins de 8 envies sur 10 bien traduites sur son propre jeu d'envies, ou si une machine de l'équipe dépasse 5 s par réponse, modèle déjà chargé (le premier appel, qui le charge, est plus long).
