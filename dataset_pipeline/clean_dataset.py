"""
clean_dataset.py (minimal-change version)
------------------------------------------
Cleans Kaizen_Ops_Chatbot_Dataset.csv into trade_knowledge.csv WITHOUT
renaming or restructuring columns, so it drops into your existing
csv_loader.py with no code changes on the loader side.

What it does:
- Drops fully blank rows (source file has ~600 empty padding rows below
  the real data).
- Drops exact duplicate terms (keeps first occurrence).
- Replaces literal "\n" and real newlines inside cells with a space, so
  fields don't fragment mid-sentence when embedded.
- Keeps every original column name exactly as-is.

Usage:
    python clean_dataset.py Kaizen_Ops_Chatbot_Dataset.csv trade_knowledge.csv
"""

import sys
import re
import pandas as pd

TERM_COLUMN = "Terminology / Document"


def clean_cell(val):
    if pd.isna(val):
        return ""
    val = str(val).replace("\\n", " ").replace("\n", " ")
    # Normalize smart punctuation to plain ASCII so the file is safe
    # to read with plain utf-8 regardless of source encoding quirks
    replacements = {
        "\u2018": "'", "\u2019": "'",   # curly single quotes
        "\u201c": '"', "\u201d": '"',   # curly double quotes
        "\u2013": "-", "\u2014": "-",   # en/em dash
        "\u00a0": " ",                   # non-breaking space
    }
    for bad, good in replacements.items():
        val = val.replace(bad, good)
    val = re.sub(r"\s+", " ", val).strip()
    return val


def main(src_path: str, out_path: str):
    df = pd.read_csv(src_path, encoding="cp1252")

    df = df.dropna(subset=[TERM_COLUMN]).copy()

    for col in df.columns:
        df[col] = df[col].apply(clean_cell)

    before = len(df)
    df = df.drop_duplicates(subset=[TERM_COLUMN], keep="first")
    after = len(df)

    df.to_csv(out_path, index=False)

    print(f"Rows with a term: {before}")
    print(f"Dropped duplicate terms: {before - after}")
    print(f"Final rows written: {after}")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "Kaizen_Ops_Chatbot_Dataset.csv"
    out = sys.argv[2] if len(sys.argv) > 2 else "trade_knowledge.csv"
    main(src, out)