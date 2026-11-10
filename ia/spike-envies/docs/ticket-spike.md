# Spike — Le modèle local traduit-il des envies en notes de notre référentiel ?

**Date :** 10/11/2026 · **Durée :** ≤ ½ journée · **Statut :** décision proposée, jugement humain à confirmer

## Question
Le modèle local (`qwen2.5:7b` via Ollama) traduit-il des envies en texte libre en notes **de notre référentiel** ?
Seuil : **≥ 8 notes sur 10 jugées justes** par Yasmina et Brandon, **en < 5 s** par envie. Sinon : quel modèle faut-il ?

## Protocole
- Référentiel : 94 notes, 13 familles ([data/referentiel_notes.csv](../data/referentiel_notes.csv)).
- Jeu de test : 20 envies variées : faciles, avec exclusions (« pas sucré »), abstraites (« créative, rêveuse »), en anglais ([data/envies_test.jsonl](../data/envies_test.jsonl)).
- Modèle : `qwen2.5:7b`, température 0, référentiel complet dans le prompt, sortie JSON **contrainte à la liste des id du référentiel**, au plus 5 notes.
- Machine : PC de dev, **100 % CPU** (pas de GPU utilisé par Ollama).
- Deux passes : 20 envies sans justification (sortie courte) et 5 envies avec justification.
- Témoin sans IA : recherche par mots-clés du référentiel.
- Script : `python spike/spike_envies.py run …`, puis `score`.

## Résultats

| Mesure | Sans justification (20 envies) | Avec justification (5 envies) | Seuil |
|---|---|---|---|
| Latence médiane | **58 s** | **134 s** | < 5 s |
| Latence p95 / max | 197 s / 205 s | 165 s / 165 s | |
| Notes hors référentiel | **0** | **0** | 0 |
| Notes dans la liste attendue *(indicateur auto)* | 37/92 = **40 %** | 11/23 = 48 % | ≥ 80 % *(jugement humain)* |
| Témoin mots-clés, même indicateur | 44/86 = **51 %** | 10/25 = 40 % | |

Feuilles de jugement à remplir : [spike/resultats_qwen2.5_7b_court.csv](../spike/resultats_qwen2.5_7b_court.csv) et [spike/resultats_qwen2.5_7b.csv](../spike/resultats_qwen2.5_7b.csv).

> L'indicateur auto compare à **une** liste de 5 notes attendues par envie. Il est donc sévère : une note hors liste peut être jugée juste. Le seuil officiel reste le jugement de Yasmina et Brandon (`spike_envies.py score`).

### Observations qualitatives
- ✅ **Contrainte de référentiel efficace** : aucune note inventée, grâce au schéma JSON avec la liste des id.
- ✅ Bons résultats quand l'envie cite les notes : plage (E01), tropical (E10), café-chocolat (E11), après l'orage (E13), sport (E14).
- ❌ **Notes « passe-partout »** qui reviennent hors sujet : gaïac ×6, cacao ×5, cannelle ×5, herbe coupée ×5, osmanthus ×4. Par exemple, osmanthus et cacao pour « le rouge à lèvres de grand-mère » (E09), caramel et cacao pour « un pull en cachemire » (E15).
- ❌ Envies abstraites ou en anglais mal traitées : « fresh n clean, after shower » donne gaïac et herbe coupée (E19).
- ❌ Le modèle ne fait pas mieux que le simple témoin par mots-clés (40 % contre 51 %).
- ⚠️ Les latences des dernières envies (E19, E20 : environ 200 s) ont peut-être été gonflées par d'autres tâches sur la machine. Même la meilleure (36 s) reste 7 fois au-dessus du seuil.

## Décision
**NO-GO pour `qwen2.5:7b` sur CPU tel quel.**
- Latence : échec net, 10 à 40 fois le seuil, quel que soit le résultat du jugement humain.
- Justesse : l'indicateur auto (40 %) et la comparaison au témoin laissent prévoir un échec du seuil de 8/10. **À confirmer** par Yasmina et Brandon sur la feuille de jugement.

## Sinon, quel modèle faut-il ? (recommandation)
1. **Architecture hybride (recommandée)** :
   - présélection des 15 à 20 notes candidates par **embeddings** multilingues locaux (ex. `multilingual-e5-small` ou `bge-m3`), en quelques dizaines de ms sur CPU ;
   - puis choix final par un LLM sur ce prompt réduit, d'environ 300 tokens au lieu de 3 000.

   Cette approche attaque à la fois la latence (le prompt est 10 fois plus court) et les notes passe-partout.
2. **Si le service tourne sur un GPU en production** : refaire la mesure avec `qwen2.5:7b` sur GPU, où l'on attend un gain d'environ 10 fois.
3. **Modèle plus petit sur CPU** (`qwen2.5:3b`, `1.5b`) : plus rapide, mais il est peu probable qu'il soit plus juste que le 7B mesuré ici. À n'utiliser qu'avec la présélection du point 1.
4. **API hébergée** (modèle léger d'un fournisseur commercial, cf. ADR 0003) : latence de l'ordre de la seconde et meilleure compréhension des envies abstraites. Uniquement si les envies des clients peuvent sortir de notre infrastructure (à valider côté données personnelles).

## Suites proposées
- [ ] Yasmina et Brandon remplissent la feuille de jugement, puis `python spike/spike_envies.py score spike/resultats_qwen2.5_7b_court.csv`.
- [ ] Spike n° 2 (½ journée) : présélection par embeddings + `qwen2.5:3b`/`7b`, même jeu de test et mêmes seuils.
- [ ] Savoir si la production dispose d'un GPU (point de 9 h).
- [ ] Enrichir les mots-clés du référentiel : ils servent à la fois au témoin et au prompt.
