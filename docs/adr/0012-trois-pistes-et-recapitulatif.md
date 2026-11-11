# 0012. Faire entrer dans le contrat les trois pistes et le récapitulatif

- Statut : proposée. Relue par Maxime le 11 novembre : d'accord sur le fond. À fusionner après le tag m2
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

Le contrat ([ADR 0006](0006-contrat-api-avant-le-code.md)) décrit quatre gestes : décrire son projet, valider des notes, recevoir une formule, l'accepter. Le 10 novembre, le Product a livré sa maquette (Figma « G11 — Écrans »), en cinq étapes : Projet, Récapitulatif, Pistes, LAB, Demande. Le front en reprend ce qui tient dans le contrat actuel (ticket #52). Deux écrans n'y tiennent pas :

- le **récapitulatif** affiche ce que nous avons compris du projet, rangé par produit, usage, ambiance et émotions. Le contrat ne renvoie que des notes, chacune avec une raison en texte libre ;
- les **pistes** sont trois, à comparer, chacune avec « Pourquoi cette piste ». Le contrat renvoie une seule formule.

La branche validée le 9 novembre parlait d'« une première formule ». La maquette du 10 en montre trois : c'est elle qui fait foi ici. L'impact map du FigJam, lue le 10 novembre, dit la même chose (« trois références existantes, chacune expliquée ») et nomme le risque à éviter : des références éloignées des envies, qui font perdre confiance à la marque.

## Options

1. Changer le contrat : un brief porte `understood`, la liste de ce que le service a retenu, par catégorie ; le geste 3 renvoie jusqu'à trois formules ; le geste 4 dit laquelle est choisie. Le parcours du Product devient possible. Coût : l'API, le service `ia/` et le front changent tous les trois, et la table `briefs` aussi.
2. Ne rien changer et tout faire dans le front : il déduit le récapitulatif en lisant le texte des raisons (« Évoque « bord de mer » »), et ne montre qu'une piste. C'est ce que fait la PR du ticket #52. Aucun coût d'API. Mais lire un texte fait pour des humains casse au premier changement de formulation, et la comparaison de trois pistes, le cœur de la maquette, reste impossible.
3. Ajouter les trois pistes sans toucher au geste 4 : la route renvoie trois formules, et l'acceptation prend la première. Moins de changements. Mais la marque ne choisit plus : on lui montre un choix qu'on ignore ensuite.

## Décision

Nous proposons l'option 1. La marque qui ne se reconnaît pas dans une proposition unique n'a aujourd'hui qu'une issue, recommencer ; avec trois pistes, elle compare. Et le récapitulatif est le seul écran où elle voit ce que le modèle a compris : il doit reposer sur un champ du contrat, pas sur un texte à deviner.

Ce que le contrat change, dans [`openapi.yaml`](../../openapi.yaml) :

- `Brief.understood` : une liste de `{ kind, label }`, où `kind` vaut `usage`, `ambiance` ou `emotion`. Ce sont les étiquettes que le service retient déjà au geste 1. Il reste à garder leur catégorie : `references.py` les range aujourd'hui dans une seule liste, sans dire de quelle colonne elles viennent. La valeur `sensation` sert aux arômes.
- `POST /api/briefs/{briefId}/formulas` remplace `/formula` et renvoie `{ formulas }`, une à trois formules, la plus proche d'abord.
- `POST /api/briefs/{briefId}/formulas/{formulaId}/acceptance` remplace `/formula/acceptance`, et `Brief.acceptedFormulaId` dit ensuite quelle piste est choisie.
- Une deuxième ou une troisième piste ne s'ajoute que si elle contient au moins deux notes validées. Simulé par Maxime sur les deux banques : trois pistes dans 40 % des cas, deux dans 33 à 42 %, une seule dans 17 à 28 %. Le Product doit confirmer qu'il préfère moins de pistes à une piste faible.

Le modèle n'est pas appelé une fois de plus : il n'intervient qu'au geste 1, et le classement des formules est du code.

## Conséquences

- Positives : les écrans Récapitulatif et Pistes de la maquette deviennent possibles ; le front ne lit plus le texte des raisons ; retirer ou remettre une note proposée, la version la plus simple du LAB, tient dans ce contrat : la marque revalide ses notes, puis redemande ses pistes. Ajouter une note qui n'a pas été proposée demande une route du référentiel, hors de cette décision.
- Négatives, à accepter : deux routes changent de nom, donc l'API, le front et leurs tests bougent ensemble ; tant que le code n'a pas suivi, le contrat et `develop` divergent ; avec vingt références par univers, la troisième piste sera parfois éloignée des envies, ce que l'impact map demande justement d'éviter. D'où le seuil ci-dessus.
- Hors de cette décision : le LAB avec ses mots (« plus frais », « moins boisé ») et le dépôt d'un document.
- Calendrier : le jalon m2 du 13 novembre ne demande ni les trois pistes ni le récapitulatif. Ce changement sert le dossier du concours, à déposer le 4 décembre, et se fusionne après le tag m2, pour que `openapi.yaml` ne décrive pas sur `develop` des routes absentes du commit montré vendredi.
- À revoir si : le Product préfère toujours trois pistes, ou si le modèle doit rédiger l'explication de chaque piste (ticket #47), ce qui ferait plus d'un appel au geste 3.
