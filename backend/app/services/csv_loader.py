import csv
import logging
import os
import re
from typing import Any, Dict, List

logger = logging.getLogger("uvicorn.error")


class CSVLoaderService:
    """
    Service responsible for loading and cleaning raw trade knowledge CSV entries.
    """

    @staticmethod
    def load_and_clean(filepath: str) -> List[Dict[str, Any]]:
        """
        Reads trade knowledge CSV and normalizes the text records.
        """

        if not os.path.exists(filepath):
            logger.error(f"Trade knowledge CSV not found at: {filepath}")
            return []

        cleaned_records = []

        try:
            try:
                with open(filepath, mode="r", encoding="utf-8-sig") as f:
                    content = f.read()
            except UnicodeDecodeError:
                with open(filepath, mode="r", encoding="cp1252") as f:
                    content = f.read()

            import io
            reader = csv.DictReader(io.StringIO(content))
            for line_num, row in enumerate(reader, start=2):

                    cleaned_row = {
                        (k.strip() if k else ""): (v.strip() if v else "")
                        for k, v in row.items()
                    }

                    term = (
                        cleaned_row.get("Term")
                        or cleaned_row.get("Terminology / Document")
                    )

                    definition = (
                        cleaned_row.get("Definition")
                        or cleaned_row.get("Defination")
                    )

                    created_by = (
                        cleaned_row.get("Created By")
                        or cleaned_row.get("Who creates / sends it \n(If any)")
                        or cleaned_row.get("Who creates / sends it (If any)")
                    )

                    used_by = (
                        cleaned_row.get("Used By")
                        or cleaned_row.get("Who recevies  it\n (If Any)")
                        or cleaned_row.get("Who recevies it (If Any)")
                    )

                    purpose = cleaned_row.get("Purpose")

                    common_problems = (
                        cleaned_row.get("Common Problems")
                        or cleaned_row.get("If not available, whats the issue?")
                    )

                    if not term or not definition:
                        logger.debug(
                            f"Skipping row {line_num}: missing Term or Definition."
                        )
                        continue

                    created_by = created_by or "Not Specified"
                    used_by = used_by or "Not Specified"
                    purpose = purpose or "Not Specified"
                    common_problems = common_problems or "Not Specified"

                    aliases = CSVLoaderService.generate_aliases(term)

                    temp_record = {
                        "Term": term,
                        "Definition": definition,
                        "Purpose": purpose,
                        "Common Problems": common_problems,
                    }

                    keywords = CSVLoaderService.generate_keywords(temp_record)

                    search_text = " ".join(
                        [
                            term,
                            definition,
                            created_by,
                            used_by,
                            purpose,
                            common_problems,
                            " ".join(aliases),
                            " ".join(keywords),
                        ]
                    )

                    cleaned_records.append(
                        {
                            "Term": term,
                            "Aliases": aliases,
                            "Keywords": keywords,
                            "SearchText": search_text,
                            "Definition": definition,
                            "Created By": created_by,
                            "Used By": used_by,
                            "Purpose": purpose,
                            "Common Problems": common_problems,
                        }
                    )

            logger.info(
                f"Loaded and cleaned {len(cleaned_records)} trade terms from {filepath}"
            )

            return cleaned_records

        except Exception as e:
            logger.exception("Error parsing trade knowledge CSV")
            raise e

    @staticmethod
    def generate_aliases(term: str) -> List[str]:
        """
        Generate aliases automatically along with manual trade abbreviations.
        """

        aliases = set()

        term = term.strip()

        # Original term
        aliases.add(term)

        # Lowercase
        aliases.add(term.lower())

        # Remove punctuation
        normalized = re.sub(r"[^\w\s]", "", term)
        aliases.add(normalized)

        # Manual domain-specific abbreviations
        manual_mapping = {
            "Bill of Lading": ["BOL", "BL", "B/L"],
            "Letter of Credit": ["LC", "L/C"],
            "Certificate of Origin": ["COO", "CO"],
            "Commercial Invoice": ["CI"],
            "Packing List": ["PL"],
            "Free on Board": ["FOB"],
            "Cost Insurance Freight": ["CIF"],
            "Ex Works": ["EXW"],
            "Air Waybill": ["AWB"],
            "Purchase Order": ["PO"],
        }

        for key, values in manual_mapping.items():
            if key.lower() == term.lower():
                aliases.update(values)

        # Automatic abbreviation
        stop_words = {"of", "and", "the", "&"}

        abbreviation = "".join(
            word[0].upper()
            for word in normalized.split()
            if word.lower() not in stop_words
        )

        if len(abbreviation) >= 2:
            aliases.add(abbreviation)

        # Individual words
        words = normalized.split()

        aliases.update(words)

        # Bigrams
        if len(words) >= 2:
            for i in range(len(words) - 1):
                aliases.add(f"{words[i]} {words[i + 1]}")

        return sorted(aliases)

    @staticmethod
    def generate_keywords(record: Dict[str, Any]) -> List[str]:
        """
        Generate searchable keywords.
        """

        text = " ".join(
            [
                record["Term"],
                record["Definition"],
                record["Purpose"],
                record["Common Problems"],
            ]
        ).lower()

        text = re.sub(r"[^\w\s]", " ", text)

        stop_words = {
            "the", "and", "for", "with", "this", "that", "from",
            "into", "will", "have", "has", "been", "their", "there",
            "they", "them", "what", "when", "where", "which", "while",
            "about", "used", "using", "into", "than", "then", "not", "specified",
        }

        words = []

        for word in text.split():

            if len(word) < 3:
                continue

            if word in stop_words:
                continue

            words.append(word)

        # Generate bigrams
        bigrams = []

        for i in range(len(words) - 1):
            bigrams.append(words[i] + " " + words[i + 1])

        keywords = sorted(set(words + bigrams))

        return keywords