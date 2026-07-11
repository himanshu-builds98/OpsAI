"""
validate_retrieval.py (MongoDB Atlas version)
-----------------------------------------------
Run this from backend\ (venv activated) after ingest.py has completed.

Replays every generated question against the real MongoDB Atlas
$vectorSearch pipeline and checks whether the expected term's document
comes back in the top results. Anything that misses gets printed so you
know which suggested-question chips to reword or drop before they go in
the UI.

Usage (from backend\):
    python validate_retrieval.py ..\full_question_bank.json
"""

import sys
import json

from app.config import settings
from app.rag.embeddings import BGEEmbeddings
from app.rag.vector_store import VectorStoreManager

TOP_K = 4


def main(bank_path: str):
    with open(bank_path) as f:
        bank = json.load(f)

    embeddings = BGEEmbeddings()
    vector_store = VectorStoreManager(embeddings)

    total_count = vector_store.get_count()
    print(f"Records currently in MongoDB Atlas: {total_count}\n")

    total = 0
    hits = 0
    misses = []

    for term, entry in bank.items():
        for question in entry["questions"]:
            total += 1
            results = vector_store.search(question, limit=TOP_K)
            retrieved_terms = [r.get("term", "") for r in results]

            if term in retrieved_terms:
                hits += 1
            else:
                misses.append((term, question, retrieved_terms))

    print(f"Total questions tested: {total}")
    print(f"Hits (correct term in top_{TOP_K}): {hits}")
    print(f"Misses: {len(misses)}")
    if total:
        print(f"Hit rate: {hits/total:.1%}\n")

    if misses:
        print("--- Missed questions (reword or drop these from suggested_questions.json) ---")
        for term, question, retrieved in misses[:50]:
            print(f"[expected: {term}] Q: {question!r} -> got: {retrieved}")


if __name__ == "__main__":
    bank_path = sys.argv[1] if len(sys.argv) > 1 else "full_question_bank.json"
    main(bank_path)