import logging
from typing import List, Dict, Any

from app.config import settings
from app.rag.query_processor import QueryAnalysis
from app.rag.vector_store import VectorStoreManager

logger = logging.getLogger("uvicorn.error")


class Retriever:
    """
    Hybrid Retriever.

    Combines:
    - Semantic Search
    - Exact Term Boosting
    - Query Contains Term Boosting
    """

    def __init__(self, vector_store: VectorStoreManager, threshold: float = 0.25):
        self.vector_store = vector_store
        self.threshold = threshold

    def retrieve(self, analysis: QueryAnalysis) -> List[Dict[str, Any]]:
        semantic_results = self.vector_store.search(
            analysis.search_query,
            limit=max(analysis.top_k * 2, 8),
        )

        query = analysis.search_query.lower().strip()

        reranked = []

        for doc in semantic_results:
            semantic_score = doc.get("score", 0.0)

            boost = 0.0

            if settings.ENABLE_EXACT_MATCH:
                term = doc.get("term", "").lower().strip()

                if term == query:
                    boost += settings.EXACT_MATCH_BOOST
                elif term and term in query:
                    boost += settings.CONTAINS_MATCH_BOOST

            final_score = semantic_score + boost

            doc["final_score"] = final_score

            logger.info("=" * 34)
            logger.info(f"Query          : {analysis.search_query}")
            logger.info(f"Semantic score : {semantic_score:.4f}")
            logger.info(f"Boost applied  : {boost:.4f}")
            logger.info(f"Final score    : {final_score:.4f}")
            logger.info("=" * 34)

            reranked.append(doc)

        reranked.sort(
            key=lambda x: x["final_score"],
            reverse=True,
        )

        filtered = [
            doc
            for doc in reranked
            if doc["final_score"] >= self.threshold
        ]

        return filtered[: analysis.top_k]