# 0002. Utiliser PostgreSQL 17 comme base de données

- Statut : acceptée
- Date : 2026-11-05
- Décideurs : Maxime (tech-lead)

## Contexte

L'application enregistre les questions posées et les réponses de l'IA. Chaque développeur a besoin d'une base avec les mêmes données de test, sans rien installer. Une fonctionnalité de recherche sémantique (RAG) est possible pendant le hackathon.

## Options

1. PostgreSQL 17 en conteneur : image officielle, même version qu'en production, extension pgvector disponible si le RAG arrive. Un service de plus dans `compose.yaml`.
2. SQLite : aucun service, mais un fichier par machine et pas de parité avec un hébergeur.
3. Une base vectorielle dédiée en plus : un service et un outil de plus à apprendre pour un besoin encore hypothétique.

## Décision

Nous choisissons PostgreSQL 17, démarré par `compose.yaml` avec le schéma et les données de test dans `db/init/`, parce que toute l'équipe part des mêmes lignes et que le RAG tiendra dans la même base avec pgvector.

## Conséquences

- Positives : `psql` et un client graphique se connectent sur `localhost:5432` ; les données survivent au Rebuild dans `db/data/`.
- Négatives, à accepter : un conteneur de plus, et un dossier `db/data/` à supprimer pour rejouer le schéma.
- À revoir si : l'hébergeur retenu n'offre pas PostgreSQL.
