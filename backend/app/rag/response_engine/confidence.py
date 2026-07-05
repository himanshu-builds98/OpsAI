"""Confidence scoring for retrieved documents.

Extracted from RAGPipeline.run() (Sprint 2 refactor). Behaviour is
byte-for-byte identical to the original inline logic.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")


class ConfidenceResolver:
    """
    Maps the top-ranked retrieved document's similarity score to a
    coarse confidence label.
    """

    HIGH_THRESHOLD = 0.70
    MEDIUM_THRESHOLD = 0.45

    @classmethod
    def resolve(cls, docs: List[Dict[str, Any]]) -> str:
        """
        Determine confidence level from the top-ranked document's score.

        Args:
            docs: Retrieved documents, ordered by relevance (highest
                first). Must be non-empty - callers are responsible for
                handling the "no documents retrieved" case (-> "None")
                themselves, since that is a retrieval-level concern.

        Returns:
            One of "High", "Medium", "Low".
        """
        top_score = docs[0].get("final_score", docs[0].get("score", 0.0))

        if top_score >= cls.HIGH_THRESHOLD:
            return "High"
        elif top_score >= cls.MEDIUM_THRESHOLD:
            return "Medium"
        else:
            return "Low"
