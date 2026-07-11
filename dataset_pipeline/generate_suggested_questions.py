"""
generate_suggested_questions.py
--------------------------------
Takes the cleaned Kaizen_Ops_Chatbot_Dataset.csv (output of clean_dataset.py)
and generates:

1. full_question_bank.json
   - every term -> 3 question phrasings that should retrieve *that exact
     chunk*. Useful as a regression/eval set (see validate_retrieval.py).

2. suggested_questions.json
   - a small curated pool (default 12) shown as clickable "suggested
     questions" chips in the frontend Chat page. Picked to span different
     categories/terms so the demo doesn't look repetitive, and phrased as
     a real user would type them (not "Explain: <term>" robotic style).

Usage:
    python generate_suggested_questions.py Kaizen_Ops_Chatbot_Dataset.csv
"""

import sys
import json
import random

import pandas as pd

TEMPLATES = [
    "What is {term}?",
    "Who is responsible for the {term_lower}?",
    "What happens if the {term_lower} is missing?",
]


def make_questions(term: str) -> list[str]:
    term_lower = term[0].lower() + term[1:] if term else term
    return [t.format(term=term, term_lower=term_lower) for t in TEMPLATES]


def main(csv_path: str, n_suggested: int = 12, seed: int = 42):
    df = pd.read_csv(csv_path)

    bank = {}
    for _, row in df.iterrows():
        term = row["Terminology / Document"]
        bank[term] = {
            "term": term,
            "questions": make_questions(term),
        }

    with open("full_question_bank.json", "w") as f:
        json.dump(bank, f, indent=2)

    random.seed(seed)
    terms = list(df["Terminology / Document"])
    random.shuffle(terms)
    sample_terms = terms[:n_suggested]

    suggested = []
    for term in sample_terms:
        # only take the first, most natural phrasing for the UI chips
        suggested.append(bank[term]["questions"][0])

    with open("suggested_questions.json", "w") as f:
        json.dump(suggested, f, indent=2)

    print(f"Terms processed: {len(bank)}")
    print(f"full_question_bank.json -> {len(bank)} terms x 3 phrasings each")
    print(f"suggested_questions.json -> {len(suggested)} curated chips")


if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "Kaizen_Ops_Chatbot_Dataset.csv"
    main(csv_path)