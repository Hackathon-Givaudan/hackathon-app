# Service Data/IA — routes pour le contrat d'API

> Le schéma complet (types, erreurs) est dans [openapi-data-ia.yaml](openapi-data-ia.yaml) : à reprendre tel quel dans le contrat d'API.
> L'emplacement du service dans le dépôt se décide au point de 9 h.

## Parcours

```
Client ──texte libre──▶ POST /v1/envies/notes ──▶ notes proposées (référentiel uniquement)
                                                        │
                                       le client / conseiller valide ou retire
                                                        ▼
Client ──notes validées──▶ POST /v1/formules/proches ──▶ formules classées par similarité
```

## Routes

| Méthode | Route | Rôle | Appelle le modèle ? |
|---|---|---|---|
| GET | `/health` | État du service, du modèle et version du référentiel | non (ping) |
| GET | `/v1/notes?famille=&etage=` | Liste le référentiel (pour l'écran de validation) | non |
| POST | `/v1/envies/notes` | Texte libre → notes du référentiel, triées par pertinence | **oui** |
| POST | `/v1/formules/proches` | Notes validées → formules les plus proches | non |
| GET | `/v1/formules/{id}` | Détail d'une formule | non |

### `POST /v1/envies/notes`

Requête :
```json
{ "texte": "Je veux un parfum frais pour l'été, qui sent le citron et la mer.",
  "max_notes": 5,
  "exclure_notes": ["vanille"] }
```
Réponse `200` :
```json
{ "request_id": "6f1c…",
  "notes": [
    { "id": "citron", "nom": "Citron", "famille": "hesperide", "etage": "tete", "score": 0.94,
      "justification": "« citron » cité explicitement" },
    { "id": "accord_marin", "nom": "Accord marin", "famille": "marin", "etage": "tete", "score": 0.9,
      "justification": "« la mer »" }
  ],
  "notes_ecartees": [],
  "modele": "qwen2.5:7b",
  "latence_ms": 2300,
  "version_referentiel": "2026-11-10" }
```
Règles :
- **Aucune note hors référentiel** n'est renvoyée : la sortie du modèle est contrainte par un schéma JSON (`enum` des id), et tout id inconnu est filtré puis journalisé dans `notes_ecartees`.
- `exclure_notes` est retiré après génération (filet de sécurité, en plus du prompt).
- Délai max 5 s : au-delà, `504 DELAI_DEPASSE` ; modèle absent : `503 MODELE_INDISPONIBLE`.

### `POST /v1/formules/proches`

Requête :
```json
{ "notes_validees": [ { "note_id": "citron" }, { "note_id": "accord_marin", "poids": 2 }, { "note_id": "sel" } ],
  "limite": 3 }
```
Réponse `200` (extrait, calcul réel sur `data/formules.json`) :
```json
{ "formules": [
  { "formule": { "id": "F005", "nom": "Embruns", "notes": [ … ] },
    "similarite": 0.458,
    "notes_communes": ["accord_marin", "sel"],
    "notes_manquantes": ["citron"] } ] }
```
Calcul : similarité cosinus entre le vecteur des notes validées (poids, 1 par défaut) et le vecteur des pourcentages de chaque formule. Déterministe et rapide (pas de modèle). Id inconnu → `422 NOTE_INCONNUE`.
Pistes d'amélioration : bonus si la famille correspond, pondération par étage.

## Erreurs

| HTTP | `code` | Cas |
|---|---|---|
| 400 | `TEXTE_INVALIDE` | texte vide, trop long |
| 404 | `FORMULE_INCONNUE` | id de formule absent |
| 422 | `NOTE_INCONNUE` | note validée hors référentiel (`details.ids`) |
| 503 | `MODELE_INDISPONIBLE` | Ollama / modèle injoignable |
| 504 | `DELAI_DEPASSE` | génération > 5 s |

## Données

- [data/referentiel_notes.json](../data/referentiel_notes.json) (+ `.csv` pour Excel) : 94 notes, 13 familles, étage, nature (naturel / synthèse / accord), mots-clés d'envie.
- [data/formules.json](../data/formules.json) : 32 formules (notes, étage, pourcentage).
- [data/envies_test.jsonl](../data/envies_test.jsonl) : 20 envies de test avec notes attendues (jeu du spike).
- Régénérer : `python data/build_data.py`.
