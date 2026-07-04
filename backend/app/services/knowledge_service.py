import logging
from typing import List, Dict, Any
from app.db.mongodb import MongoDB
logger = logging.getLogger("uvicorn.error")

class KnowledgeService:
    """
    Handles retrieval of trade knowledge from MongoDB.
    Search priority:
        1. Exact Term
        2. Alias
        3. Keyword
        4. Full Text
    """
    def __init__(self):
        self.collection = MongoDB.trade_collection()

    # ==========================================================
    # Public Search
    # ==========================================================
    def search(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        query = query.strip()
        results = []
        results.extend(
            self._exact_term_search(query)
        )
        results.extend(
            self._alias_search(query)
        )
        results.extend(
            self._keyword_search(query)
        )
        results.extend(
            self._text_search(query)
        )
        return self._rank_results(results)[:limit]

    # ==========================================================
    # Exact Match
    # ==========================================================
    def _exact_term_search(
        self,
        query: str
    ) -> List[Dict[str, Any]]:
        docs = list(
            self.collection.find(
                {
                    "term": {
                        "$regex": f"^{query}$",
                        "$options": "i"
                    }
                }
            )
        )

        for doc in docs:
            doc["score"] = 100
        return docs

    # ==========================================================
    # Alias Search
    # ==========================================================
    def _alias_search(
        self,
        query: str
    ) -> List[Dict[str, Any]]:
        docs = list(

            self.collection.find(
                {
                    "aliases": {
                        "$regex": f"^{query}$",
                        "$options": "i"
                    }
                }
            )
        )
        for doc in docs:
            doc["score"] = 90
        return docs

    # ==========================================================
    # Keyword Search
    # ==========================================================
    def _keyword_search(
        self,
        query: str
    ) -> List[Dict[str, Any]]:
        words = query.lower().split()
        docs = list(
            self.collection.find(
                {
                    "keywords": {
                        "$in": words
                    }
                }
            )
        )
        for doc in docs:
            doc["score"] = 70
        return docs

    # ==========================================================
    # Mongo Text Search
    # ==========================================================
    def _text_search(
        self,
        query: str
    ) -> List[Dict[str, Any]]:

        docs = list(
            self.collection.find(
                {
                    "$text": {
                        "$search": query
                    }
                },

                {
                    "score": {
                        "$meta": "textScore"
                    }
                }
            ).sort(
                [(
                        "score",
                        {
                            "$meta": "textScore"
                        }
                )]
            )
        )

        for doc in docs:
            if "score" not in doc:
                doc["score"] = 50

        return docs

    # ==========================================================
    # Ranking
    # ==========================================================
    def _rank_results(
        self,
        docs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:

        unique = {}

        for doc in docs:
            key = doc["term"]
            if key not in unique:
                unique[key] = doc

            else:
                if doc["score"] > unique[key]["score"]:
                    unique[key] = doc

        ranked = list(unique.values())
        ranked.sort(
            key=lambda x: x["score"],
            reverse=True
        )

        logger.info(
            f"KnowledgeService returned {len(ranked)} documents."
        )

        return ranked