from typing import List, Dict, Any

from app.rag.vector_store import VectorStoreManager
from app.rag.query_processor import QueryAnalysis


class Retriever:
    def __init__(
        self,
        vector_store: VectorStoreManager,
        threshold: float = 0.18,
    ):
        self.vector_store = vector_store
        self.threshold = threshold

    def retrieve(self, analysis: QueryAnalysis) -> List[Dict[str, Any]]:

        semantic_results = []

        if analysis.exact_term:
            exact_doc = self.vector_store.search_exact_term(
                analysis.exact_term
            )

            if exact_doc:
                exact_doc["score"] = 2.0
                semantic_results.append(exact_doc)

        # -------------------------------------------------
        # Semantic search
        # -------------------------------------------------

        semantic_results.extend(
            self.vector_store.search(
                analysis.search_query,
                limit=max(analysis.top_k * 3, 10),
            )
        )

        query = analysis.search_query.lower()

        exact_term = (
            analysis.exact_term.lower()
            if analysis.exact_term
            else ""
        )

        query_words = set(query.split())

        reranked = []

        for doc in semantic_results:

            score = float(doc.get("score", 0))

            term = doc.get("term", "").lower()

            ####################################################
            # Exact terminology match
            ####################################################

            if exact_term and term == exact_term:
                score += 0.50

            ####################################################
            # Partial terminology match
            ####################################################

            elif exact_term and (
                exact_term in term
                or term in exact_term
            ):
                score += 0.60

            ####################################################
            # Query contained inside terminology
            ####################################################

            if query and query in term:
                score += 0.30

            ####################################################
            # Word overlap with terminology
            ####################################################

            term_words = set(term.split())

            overlap = len(query_words & term_words)

            score += overlap * 0.08

            ####################################################
            # Intent-aware boosting
            ####################################################

            intent_field = {
                "definition": "definition",
                "created_by": "created_by",
                "used_by": "used_by",
                "purpose": "purpose",
                "common_problems": "common_problems",
            }

            field = intent_field.get(analysis.intent)

            if field:

                value = str(
                    doc.get(field, "")
                ).lower()

                if value:
                    score += 0.15

            ####################################################
            # Optional keyword boost
            ####################################################

            keywords = {
                str(k).lower()
                for k in doc.get("keywords", [])
            }

            if keywords:
                overlap = len(query_words & keywords)
                score += overlap * 0.05

            ####################################################
            # Optional alias boost
            ####################################################

            aliases = [
                a.lower()
                for a in doc.get("aliases", [])
            ]

            for alias in aliases:
                if alias in query:
                    score += 0.15

            ####################################################

            doc["final_score"] = round(score, 4)

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