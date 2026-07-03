import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class QueryAnalysis:
    """
    Result of preprocessing a user query.
    """

    original_query: str
    normalized_query: str
    search_query: str

    intent: str

    entities: List[str]

    exact_term: Optional[str]

    top_k: int


class QueryProcessor:
    """
    Performs lightweight NLP before retrieval.

    Responsibilities
    ----------------
    • Normalize user input
    • Detect query intent
    • Extract entities
    • Expand abbreviations
    • Build a clean retrieval query
    • Detect exact terminology lookups
    """

    STOPWORDS = {
        "what",
        "is",
        "are",
        "the",
        "a",
        "an",
        "please",
        "can",
        "could",
        "would",
        "tell",
        "me",
        "about",
        "define",
        "describe",
        "explain",
        "give",
        "show",
        "for",
        "to",
        "of",
        "in",
        "on",
        "with",
        "its",
        "their",
    }

    ACRONYMS = {
        "bol": "bill of lading",
        "bl": "bill of lading",
        "fob": "free on board",
        "cif": "cost insurance and freight",
        "exw": "ex works",
        "ddp": "delivered duty paid",
        "dap": "delivered at place",
        "fcl": "full container load",
        "lcl": "less than container load",
        "lc": "letter of credit",
        "coo": "certificate of origin",
    }

    COMPARISON_PATTERNS = (
        r"\bcompare\b",
        r"\bcomparison\b",
        r"\bvs\b",
        r"\bversus\b",
        r"\bdifference\b",
        r"\bdifferent\b",
        r"\bdistinguish\b",
    )

    WORKFLOW_PATTERNS = (
        r"\bworkflow\b",
        r"\bprocess\b",
        r"\bsteps\b",
        r"\bprocedure\b",
        r"\bhow to\b",
    )

    DETAILED_PATTERNS = (
        r"\bin detail\b",
        r"\bdetailed\b",
        r"\bdeep dive\b",
        r"\bcomplete\b",
        r"\bcomprehensive\b",
        r"\bfull\b",
    )

    @classmethod
    def process(cls, query: str) -> QueryAnalysis:

        original = query.strip()

        normalized = cls._normalize(original)

        intent = cls._detect_intent(normalized)

        search_query = cls._build_search_query(normalized)

        entities = cls._extract_entities(search_query)

        exact_term = cls._detect_exact_term(search_query)

        top_k = cls._top_k(intent)

        return QueryAnalysis(
            original_query=original,
            normalized_query=normalized,
            search_query=search_query,
            intent=intent,
            entities=entities,
            exact_term=exact_term,
            top_k=top_k,
        )

    @staticmethod
    def _normalize(text: str) -> str:

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
    def _build_search_query(cls, text: str) -> str:

        words = []

        for token in text.split():

            if token in cls.STOPWORDS:
                continue

            if token in cls.ACRONYMS:
                words.extend(cls.ACRONYMS[token].split())
            else:
                words.append(token)

        return " ".join(words)

    @staticmethod
    def _extract_entities(search_query: str) -> List[str]:

        entities = []

        words = search_query.split()

        current = []

        for word in words:

            if len(word) <= 2:
                continue

            current.append(word)

        if current:
            entities.append(" ".join(current).title())

        return entities

    @staticmethod
    def _detect_exact_term(search_query: str) -> Optional[str]:
        """
        Detect whether the query is basically asking
        about a single terminology/document.
        """

        noise = [
            "detail",
            "details",
            "workflow",
            "process",
            "steps",
            "risk",
            "risks",
            "comparison",
        ]

        cleaned = search_query

        for word in noise:
            cleaned = cleaned.replace(word, "")

        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        if len(cleaned) >= 3:
            return cleaned.title()

        return None

    @staticmethod
    def _top_k(intent: str) -> int:

        mapping = {
            "quick": 2,
            "detailed": 4,
            "workflow": 4,
            "comparison": 6,
        }

        return mapping.get(intent, 4)