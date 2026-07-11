import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class QueryAnalysis:
    original_query: str
    normalized_query: str
    search_query: str
    intent: str
    entities: List[str]
    exact_term: Optional[str]
    top_k: int


class QueryProcessor:
    STOPWORDS = {
        "what","is","are","the","a","an","please","can","could","would",
        "tell","me","about","define","describe","explain","give","show",
        "for","to","of","in","on","with","its","their",
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

    CREATED_BY_PATTERNS = (r"\bwho created\b", r"\bcreated by\b")
    USED_BY_PATTERNS = (r"\bused by\b", r"\bwho uses\b", r"\bwho use\b")
    PURPOSE_PATTERNS = (r"\bpurpose\b", r"\bused for\b", r"\bwhy\b")
    PROBLEM_PATTERNS = (r"\bproblem\b", r"\bproblems\b", r"\bissue\b", r"\brisks?\b")
    DEFINITION_PATTERNS = (r"\bwhat is\b", r"\bdefine\b", r"\bmeaning\b")

    COMPARISON_PATTERNS = (
        r"\bcompare\b", r"\bcomparison\b", r"\bvs\b",
        r"\bversus\b", r"\bdifference\b", r"\bdifferent\b", r"\bdistinguish\b",
    )

    WORKFLOW_PATTERNS = (
        r"\bworkflow\b", r"\bprocess\b", r"\bsteps\b",
        r"\bprocedure\b", r"\bhow to\b",
    )

    DETAILED_PATTERNS = (
        r"\bin detail\b", r"\bdetailed\b", r"\bdeep dive\b",
        r"\bcomplete\b", r"\bcomprehensive\b", r"\bfull\b",
    )

    IGNORE_ENTITY_WORDS = {
        "created","create","used","uses","using","purpose",
        "workflow","process","define","definition","meaning",
        "what","who","when","where","why","how",
        "problem","problems","issue","issues",
        "risk","risks","compare","comparison",
    }

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
        checks = [
            (cls.CREATED_BY_PATTERNS, "created_by"),
            (cls.USED_BY_PATTERNS, "used_by"),
            (cls.PURPOSE_PATTERNS, "purpose"),
            (cls.PROBLEM_PATTERNS, "common_problems"),
            (cls.DEFINITION_PATTERNS, "definition"),
            (cls.COMPARISON_PATTERNS, "comparison"),
            (cls.WORKFLOW_PATTERNS, "workflow"),
            (cls.DETAILED_PATTERNS, "detailed"),
        ]
        for patterns, intent in checks:
            for pattern in patterns:
                if re.search(pattern, text):
                    return intent
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

    @classmethod
    def _extract_entities(cls, search_query: str) -> List[str]:
        entities = []
        current = []
        for word in search_query.split():
            if len(word) <= 2:
                continue
            if word in cls.IGNORE_ENTITY_WORDS:
                continue
            current.append(word)
        if current:
            entities.append(" ".join(current).title())
        return entities

    @staticmethod
    def _detect_exact_term(search_query: str) -> Optional[str]:
        noise = [
            "what","who","when","where","why","how",
            "created","create","used","uses","using",
            "purpose","define","definition","meaning",
            "detail","details","workflow","process",
            "steps","risk","risks","comparison",
        ]

        cleaned = search_query
        for word in noise:
            cleaned = re.sub(rf"\b{re.escape(word)}\b", "", cleaned)

        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        if len(cleaned) >= 3:
            return cleaned.title()
        return None

    @staticmethod
    def _top_k(intent: str) -> int:
        mapping = {
            "quick": 2,
            "definition": 2,
            "created_by": 2,
            "used_by": 2,
            "purpose": 2,
            "common_problems": 2,
            "workflow": 4,
            "detailed": 4,
            "comparison": 6,
        }
        return mapping.get(intent, 4)
