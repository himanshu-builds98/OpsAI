import re
from dataclasses import dataclass
from typing import List


@dataclass
class QueryAnalysis:
    """
    Structured representation of a processed user query.
    """
    original_query: str
    normalized_query: str
    search_query: str
    intent: str
    entities: List[str]
    top_k: int


class QueryProcessor:
    """
    Performs lightweight NLP preprocessing before vector retrieval.

    Responsibilities:
    - Normalize user queries
    - Detect user intent
    - Extract important entities
    - Remove filler words
    - Expand common trade abbreviations
    - Decide retrieval Top-K
    """

    # Words that usually don't help semantic retrieval
    STOPWORDS = {
        "what", "is", "are", "the", "a", "an",
        "please", "can", "could", "would", "tell",
        "me", "about", "explain", "define", "give",
        "show", "describe", "know", "of", "for",
        "to", "in", "on"
    }

    # Common trade abbreviations
    ACRONYMS = {
        "bol": "bill of lading",
        "bl": "bill of lading",
        "fob": "free on board",
        "cif": "cost insurance freight",
        "exw": "ex works",
        "ddp": "delivered duty paid",
        "lcl": "less than container load",
        "fcl": "full container load",
        "lc": "letter of credit",
        "coo": "certificate of origin"
    }

    COMPARISON_PATTERNS = [
        r"\bcompare\b",
        r"\bcomparison\b",
        r"\bvs\b",
        r"\bversus\b",
        r"\bdifference\b",
        r"\bdifferent\b",
        r"\bdistinguish\b",
    ]

    DETAILED_PATTERNS = [
        r"\bin detail\b",
        r"\bdetailed\b",
        r"\bdeep dive\b",
        r"\bcomplete\b",
        r"\bcomprehensive\b",
        r"\bworkflow\b",
        r"\bprocess\b",
        r"\bhow\b",
        r"\bwhy\b",
    ]

    WORKFLOW_PATTERNS = [
        r"\bworkflow\b",
        r"\bprocess\b",
        r"\bsteps\b",
        r"\bprocedure\b",
        r"\bhow to\b",
    ]

    @classmethod
    def process(cls, query: str) -> QueryAnalysis:
        """
        Main preprocessing entry point.
        """

        original = query.strip()

        normalized = cls._normalize(original)

        intent = cls._detect_intent(normalized)

        entities = cls._extract_entities(normalized)

        search_query = cls._build_search_query(normalized)

        top_k = cls._determine_top_k(intent)

        return QueryAnalysis(
            original_query=original,
            normalized_query=normalized,
            search_query=search_query,
            intent=intent,
            entities=entities,
            top_k=top_k
        )

    @classmethod
    def _normalize(cls, text: str) -> str:
        """
        Lowercase, remove punctuation, normalize whitespace.
        """
        text = text.lower()

        text = re.sub(r"[^\w\s]", " ", text)

        text = re.sub(r"\s+", " ", text)

        return text.strip()

    @classmethod
    def _detect_intent(cls, text: str) -> str:

        for pattern in cls.COMPARISON_PATTERNS:
            if re.search(pattern, text):
                return "comparison"

        for pattern in cls.WORKFLOW_PATTERNS:
            if re.search(pattern, text):
                return "workflow"

        for pattern in cls.DETAILED_PATTERNS:
            if re.search(pattern, text):
                return "detailed"

        return "quick"

    @classmethod
    def _extract_entities(cls, text: str) -> List[str]:
        """
        Extract important trade terms.
        """

        entities = []

        # Known acronyms
        for acronym in cls.ACRONYMS:
            if re.search(rf"\b{re.escape(acronym)}\b", text):
                entities.append(acronym.upper())

        # Extract comparisons
        comparison = re.findall(
            r"([a-zA-Z ]+)\s+(?:vs|versus)\s+([a-zA-Z ]+)",
            text
        )

        for left, right in comparison:
            entities.append(left.strip().title())
            entities.append(right.strip().title())

        # Remove duplicates
        seen = set()
        cleaned = []

        for entity in entities:
            if entity.lower() not in seen:
                cleaned.append(entity)
                seen.add(entity.lower())

        return cleaned

    @classmethod
    def _build_search_query(cls, text: str) -> str:
        """
        Remove filler words and expand common abbreviations.
        """

        words = []

        for token in text.split():

            if token in cls.STOPWORDS:
                continue

            if token in cls.ACRONYMS:
                words.append(cls.ACRONYMS[token])
            else:
                words.append(token)

        return " ".join(words)

    @staticmethod
    def _determine_top_k(intent: str) -> int:

        mapping = {
            "quick": 1,
            "detailed": 2,
            "workflow": 3,
            "comparison": 4,
        }

        return mapping.get(intent, 2)