"""Related-topic suggestion logic.

Extracted from RAGPipeline.run() (Sprint 2 refactor). This is also the
single source of truth for the default related-topics list, which was
previously duplicated inline across several branches of the pipeline.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")


class RelatedTopicsBuilder:
    """
    Selects follow-up topic suggestions from retrieved documents, padding
    with defaults when there aren't enough distinct candidates.
    """

    DEFAULT_RELATED_TOPICS = [
        "Shipping Bill overview",
        "What is Packing List?",
        "What is Shipping Bill?",
        "Who creates Commercial Invoice?",
        "Purpose of Packing List?",
        "Who receives Shipping Bill?",
    ]

    MAX_RESULTS = 3
    MIN_BEFORE_PADDING = 2

    @classmethod
    def build(cls, docs: List[Dict[str, Any]]) -> List[str]:
        """
        Build related topics from candidates 2+ in the retrieved docs
        list (docs[0] is treated as the primary/best matched term).

        Args:
            docs: Retrieved documents, ordered by relevance. Must be
                non-empty.

        Returns:
            Up to MAX_RESULTS related topic strings.
        """
        primary_term = docs[0]["term"].lower()

        related_topics = []
        for doc in docs[1:]:
            if doc["term"].lower() != primary_term:
                related_topics.append(doc["term"])

        # Dedup
        related_topics = list(set(related_topics))

        if len(related_topics) < cls.MIN_BEFORE_PADDING:
            for item in cls.get_default_related_topics():
                if item.lower() != primary_term and item not in related_topics:
                    related_topics.append(item)

        return related_topics[: cls.MAX_RESULTS]

    @classmethod
    def get_default_related_topics(cls) -> List[str]:
        """
        Return the default related-topics list used whenever there are
        no matched documents, or an answer could not be resolved.
        """
        return list(cls.DEFAULT_RELATED_TOPICS)
