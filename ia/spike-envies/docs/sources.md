# Sources — notes, arômes et classifications

Les données de `data/` sont **synthétiques** : les noms de notes, familles et facettes s'appuient sur la terminologie publique ci-dessous, mais les mots-clés d'envie et les formules ont été rédigés pour le projet. À faire relire par Yasmina et Brandon avant usage en production.

## Classifications de référence

| Source | Ce qu'elle apporte | Usage dans nos données |
|---|---|---|
| **Société Française des Parfumeurs (SFP)** — *Classification des parfums et terminologie* (1re éd. 1984) | 7 familles : hespéridés, floraux, fougères, chyprés, boisés, ambrés (orientaux), cuirs ; sous-familles ajoutées ensuite | Familles de base du référentiel. Elle classe des **parfums**, pas des notes : nous l'avons adaptée aux notes. Voir [Slate — 7 familles](https://www.slate.fr/story/85833/7-familles), [Osmoz — classification](https://osmoz.com/inspiration/questions-selections/250/the-classification-of-perfumes), [NST Perfume — Classification SFP](https://nstperfume.com/2005/12/01/perfume-books-classification-des-parfums-et-terminologie/) |
| **Roue des parfums de Michael Edwards** | 4 familles (Frais, Floral, Ambré, Boisé) et ~14 sous-familles ; la fougère a changé de place selon les éditions | Ajout des familles « vert », « fruité », « marin », « gourmand », « aromatique ». [Wikipedia — Fragrance wheel](https://en.wikipedia.org/wiki/Fragrance_wheel) |
| **IFRA Fragrance Ingredient Glossary (FIG)**, 2019 | Un descripteur olfactif principal + deux secondaires par ingrédient ; usage volontaire, **sous copyright IFRA** (citer IFRA en cas de réutilisation) | Bonne base pour enrichir les facettes. [Page du glossaire](https://ifrafragrance.org/about-fragrance/fragrance-ingredients-glossary), [PDF avril 2020](https://ifrafragrance.org/docs/default-source/glossary/ifra-fragrance-ingredient-glossary---april-2020.pdf) |
| **The Good Scents Company** | Base gratuite d'ingrédients classés par descripteurs d'odeur (agrume, floral, balsamique…) | Vérifier facettes et ingrédients d'une note. Ex. [liste agrume](https://www.thegoodscentscompany.com/data/fr1114861.html) |

## Jeux de données ouverts (pour aller plus loin)

- **Pyrfume** — archive ouverte de plus de 40 jeux de données olfactifs (molécules indexées par CID PubChem, descripteurs d'experts : Arctander, Leffingwell…). Accès Python / GitHub. [Article bioRxiv](https://www.biorxiv.org/content/10.1101/2022.09.08.507170.full.pdf), [Zenodo v1.0.0](https://zenodo.org/records/13820408). Utile si on veut relier nos notes à des molécules.
- [Mol-PECO (arXiv)](https://arxiv.org/pdf/2305.12424) : exemple de nettoyage de ces sources (8 503 molécules, 118 descripteurs).

## Grand public (vocabulaire d'envie client)

- [Marionnaud — guide des notes olfactives](https://marionnaud.fr/guide-notes-olfactives)
- [Galimard — les familles olfactives](https://galimard.com/en/blog/the-6-olfactive-families)
- [Sylvaine Delacourte — la famille boisée](https://www.sylvaine-delacourte.com/en/guide/the-woody-family)

## Modèles locaux (pour le spike)

Pas de benchmark public couvrant français + JSON structuré + latence CPU. Indications partielles :
- [Ollama, JSON et petits modèles (DEV)](https://dev.to/gurjeet333/running-llms-locally-a-rigorous-benchmark-of-phi-3-mistral-and-llama-32-on-ollama-2289)
- [Qwen 0.8B vs 3B en extraction sur CPU](https://www.iunera.com/kraken/enterprise-ai/best-qwen-model-for-receipt-extraction-0-8b-vs-3b/)
- [LLM sur Ollama avec GPU 16 Go](https://glukhov.org/fr/llm-performance/benchmarks/choosing-best-llm-for-ollama-on-16gb-vram-gpu/)

Conclusion : il faut mesurer nous-mêmes, d'où `spike/spike_envies.py`.
