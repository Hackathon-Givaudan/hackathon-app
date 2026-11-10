"""Spike : le modèle traduit-il des envies en notes du référentiel ?

Lancer le service, puis : python evaluation/evaluate.py http://localhost:8000
Pour chaque envie de envies.json, on vérifie qu'une des notes attendues est proposée, et en combien de temps.
"""

import json
import sys
import time
from pathlib import Path

import httpx

base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
cases = json.loads((Path(__file__).parent / "envies.json").read_text(encoding="utf-8"))
found = 0
slowest = 0.0

for case in cases:
    start = time.perf_counter()
    response = httpx.post(f"{base_url}/notes", json={"universe": case["universe"], "wishes": case["wishes"]}, timeout=60)
    seconds = time.perf_counter() - start
    slowest = max(slowest, seconds)
    ids = [note["id"] for note in response.json().get("notes", [])] if response.status_code == 200 else []
    ok = any(note in ids for note in case["expected"])
    found += ok
    print(f"{'OK ' if ok else 'NON'} {seconds:4.1f} s  {case['wishes'][:50]:50}  {', '.join(ids)}")

print(f"\n{found}/{len(cases)} envies avec la note attendue, réponse la plus lente : {slowest:.1f} s")
