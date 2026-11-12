# 0013. Le front n'a qu'un mode : il appelle l'API réelle

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Wissem, Maxime (tech-leads)

## Contexte

Le contrat ([ADR 0006](0006-contrat-api-avant-le-code.md)) permettait au front de simuler les réponses de l'API avant qu'elle existe. Le front livré le 10 novembre avait donc deux modes : une démonstration par défaut, qui répondait depuis `web/src/api/demo.ts` et une copie des références dans `web/src/api/data/references.json`, et un mode réel, activé par `VITE_API_MODE=live`. Le même jour, les quatre gestes du contrat ont été codés dans l'API et dans `ia/`, et `docker compose up` lance la tranche entière ([ADR 0011](0011-tranche-par-docker-compose.md)). Le jalon m2 demande de dire ce qui est simulé : avec deux modes, la réponse dépendait d'une variable que personne ne voit à l'écran.

## Options

1. Un seul mode, l'API réelle : ce qu'on montre est ce qui tourne, et les références ne vivent plus qu'à un endroit, `ia/data/`. Mais le front ne se développe plus sans l'API, le service `ia/` et PostgreSQL.
2. Garder la démonstration par défaut et le mode réel sur demande : le front se lance seul. Mais deux comportements à tenir d'accord, une copie des références qui vieillit, et le risque de présenter la démonstration en croyant montrer le produit.
3. Inverser : le mode réel par défaut, la démonstration en secours quand le service ne répond pas. La démo ne tombe jamais. Mais une réponse simulée s'afficherait sans que rien ne le dise, ce que le jalon m2 interdit.

## Décision

Nous choisissons l'option 1 : la démonstration doit être le projet complet et réel. La pull request #51 retire `demo.ts`, son test, `references.json` et la variable `VITE_API_MODE`. `web/src/api/http.ts` reste le seul fichier du front qui appelle l'API, une fonction par route.

## Conséquences

- Positives : un seul chemin de code à tester et à montrer ; plus de copie des références dans `web/` ; le test de bout en bout joue sur la tranche réelle.
- Négatives, à accepter : sans l'API, le service `ia/` et PostgreSQL, le front n'affiche que son premier écran ; travailler sur un écran demande le dev container ou `docker compose up` ; le test de bout en bout ne tourne pas sans la tranche, donc pas encore dans la CI. Les tests unitaires du front (`web/src/api/http.test.ts`) simulent `fetch` et restent sans service.
- À revoir si : une démonstration doit tourner sans Docker, par exemple sur un poste du jury. La réponse serait alors une vidéo du parcours réel, pas le retour d'un mode simulé.
