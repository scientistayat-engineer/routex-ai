"""Evaluate the rule-based fallback classifier on a labelled set (no API key needed).
Run from the project root:  python tests/eval_fallback.py"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.heuristics import classify_heuristic  # noqa: E402

CATS = ["MATH", "EXPLAIN", "CODE", "TRANSLATE", "SUMMARIZE", "WRITE"]
data = json.load(open(os.path.join(os.path.dirname(__file__), "eval_set.json"), encoding="utf-8"))
matrix = {a: {p: 0 for p in CATS} for a in CATS}
wrong = []
for q, exp in data:
    got = classify_heuristic(q)["category"]
    matrix[exp][got] += 1
    if got != exp:
        wrong.append((q, exp, got))
hits = len(data) - len(wrong)
print(f"Accuracy: {hits}/{len(data)} = {hits / len(data):.1%}")
for a in CATS:
    n = sum(matrix[a].values()); print(f"  {a:<10} {matrix[a][a]}/{n}")
print("Misclassified:")
for q, e, g in wrong:
    print(f"  - {q!r}: expected {e}, got {g}")
json.dump({"accuracy": hits / len(data), "hits": hits, "total": len(data), "matrix": matrix, "wrong": wrong}, open("/tmp/eval_result.json", "w"))
