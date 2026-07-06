"""Builds serializable source documents from retrieved documents.

Extracted from RAGPipeline.run() (Sprint 2 refactor). Output shape is
unchanged: it must remain compatible with app.models.schemas.SourceDoc,
as consumed directly by app/api/chat.py.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")


class SourceBuilder:
    """
    Converts raw retrieved document dicts (as returned by Retriever) into
    the source payload shape expected by the API layer.
    """

    @staticmethod
    def build(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Args:
            docs: Retrieved documents, each containing at minimum term,
                definition, created_by, used_by, purpose,
                common_problems, and either final_score or score.

        Returns:
            A list of plain dicts matching the SourceDoc schema shape.
        """
        return [
            {
                "term": doc["term"],
                "definition": doc["definition"],
                "created_by": doc["created_by"],
                "used_by": doc["used_by"],
                "purpose": doc["purpose"],
                "common_problems": doc["common_problems"],
                "aliases": doc.get("aliases", []),
                "keywords": doc.get("keywords", []),
                "score": round(doc.get("final_score", doc.get("score", 0)), 3),
            }
            for doc in docs
        ]
