# Spike : envies en notes avec un modèle local, mesuré sur PC Windows sans GPU

Travail de préparation du service Data/IA et du spike « le modèle local traduit-il des envies en notes de notre référentiel ? ». Il **ne remplace pas** le service `ia/app/` : c'est une mesure complémentaire, sur un autre type de machine, avec un jeu de 20 envies et un jugement prévu par le Product (Yasmina et Brandon).

## Ce que ça apporte par rapport à l'ADR 0008

L'ADR 0008 a été mesuré sur un Mac M3 Pro. Ici, PC Windows, Ollama à **100 % CPU**, `qwen2.5:7b` :

- médiane **58 s** par envie (sortie courte), 134 s avec justifications ;
- 0 note hors référentiel, grâce à une sortie JSON contrainte par `enum` ;
- 40 % des notes proposées figurent dans la liste attendue, contre 51 % pour un simple recoupement de mots-clés.

Cela touche la clause « à revoir si une machine de l'équipe dépasse 5 s par réponse » de l'ADR 0008. Décision proposée et suites : [docs/ticket-spike.md](docs/ticket-spike.md). `mistral:7b` n'a pas encore été mesuré sur cette machine.

## Contenu

| Chemin | Rôle |
| --- | --- |
| `data/referentiel_notes.*` | 94 notes, 13 familles, étage, mots-clés d'envie (données fictives) |
| `data/formules.*` | 32 formules avec pourcentages (fictives) |
| `data/envies_test.jsonl` | 20 envies de test avec notes attendues |
| `data/build_data.py` | Régénère les fichiers ci-dessus |
| `spike/spike_envies.py` | `run` (mesure), `fusion` + `score` (jugement Product), `proches` (formules proches) |
| `spike/resultats_*.csv`, `log_*.txt` | Résultats bruts du 10/11/2026 |
| `docs/` | Ticket du spike, sources sur les notes et arômes, proposition de routes |

`docs/openapi-data-ia.yaml` et `docs/api-data-ia.md` sont une **proposition** écrite avant de connaître `openapi.yaml` et `ia/app/`. Le contrat de référence reste `openapi.yaml` (ADR 0006).

## Lancer

```bash
cd ia/spike-envies
python spike/spike_envies.py run --model qwen2.5:7b --sans-justification
python spike/spike_envies.py run --model mistral:7b --sans-justification
python spike/spike_envies.py proches citron accord_marin sel
```

Uniquement la bibliothèque standard Python. Ollama doit tourner sur `localhost:11434`.
