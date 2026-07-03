from typing import List, Dict, Any
from app.rag.vector_store import VectorStoreManager
from app.rag.query_processor import QueryAnalysis


class Retriever:
    """
    Hybrid Retriever.

    Combines:
    - Semantic Search (Chroma)
    - Exact Term Match
    - Alias Match
    - Keyword Match
    """

    def __init__(self, vector_store: VectorStoreManager, threshold: float = 0.25):
        self.vector_store = vector_store
        self.threshold = threshold

    def retrieve(self, analysis: QueryAnalysis) -> List[Dict[str, Any]]:

        semantic_results = self.vector_store.search(
            analysis.search_query,
            limit=max(analysis.top_k * 2, 8)
        )

        query = analysis.search_query.lower()
        query_words = set(query.split())

        reranked = []

        for doc in semantic_results:

            score = doc.get("score", 0.0)

            #################################################
            # Exact Term Match
            #################################################

            if doc["term"].lower() == query:
                score += 0.40

            #################################################
            # Alias Match
            #################################################

            aliases = doc.get("aliases", [])

            for alias in aliases:
                if alias.lower() in query:
                    score += 0.30

            #################################################
            # Keyword Match
            #################################################

            keywords = {
                k.lower()
                for k in doc.get("keywords", [])
            }

            overlap = len(query_words & keywords)

            score += overlap * 0.05

            #################################################

            doc["final_score"] = score

            reranked.append(doc)

        reranked.sort(
            key=lambda x: x["final_score"],
            reverse=True
        )

        filtered = [
            d for d in reranked
            if d["final_score"] >= self.threshold
        ]

        return filtered[:analysis.top_k]