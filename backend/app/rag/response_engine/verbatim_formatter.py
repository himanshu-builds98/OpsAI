"""
Verbatim response formatter.

Returns the most relevant field from the highest-ranked retrieved
document based on the detected query intent.
"""

import logging
from typing import List, Dict, Any

from app.rag.query_processor import QueryAnalysis
from app.rag.response_engine.formatter import (
    ResponseFormatter,
    FormatterResult,
)

logger = logging.getLogger("uvicorn.error")


class VerbatimFormatter(ResponseFormatter):

    FIELD_MAPPING = {
        "definition": ("definition", "Definition"),
        "created_by": ("created_by", "Created By"),
        "used_by": ("used_by", "Used By"),
        "purpose": ("purpose", "Operational Purpose"),
        "common_problems": ("common_problems", "Common Problems"),
    }

    """
    Intent-aware formatter.

    Instead of always returning the definition, this formatter
    returns the field that best matches the user's question.

    Examples
    --------
    "What is Kanban?"
        -> Definition

    "Who created Kanban?"
        -> Created By

    "Who uses Kanban?"
        -> Used By

    "What is the purpose of Kanban?"
        -> Operational Purpose

    "What problems does Kanban solve?"
        -> Common Problems
    """

    FIELD_MAPPING = {
        "definition": ("definition", "Definition"),
        "created_by": ("created_by", "Created By"),
        "used_by": ("used_by", "Used By"),
        "purpose": ("purpose", "Operational Purpose"),
        "common_problems": ("common_problems", "Common Problems"),
    }

    def format(
        self,
        question: str,
        analysis: QueryAnalysis,
        docs: List[Dict[str, Any]],
    ) -> FormatterResult:

        if not docs:
            return FormatterResult(
                answer="I don't have enough verified information on this topic.",
                is_unresolved=True,
            )

        top_doc = docs[0]

        # Select field based on detected intent
        field_name, label = self.FIELD_MAPPING.get(
            analysis.intent,
            ("definition", "Definition"),
        )

        value = str(top_doc.get(field_name, "")).strip()

        # Fallback to definition if requested field is empty
        if not value:
            field_name = "definition"
            label = "Definition"
            value = str(top_doc.get("definition", "")).strip()

        if not value:
            return FormatterResult(
                answer="I don't have enough verified information on this topic.",
                is_unresolved=True,
            )

        term = str(top_doc.get("term", "")).strip()

        # Build answer
        if term:
            answer = (
                f"{term}\n\n"
                f"{label}:\n"
                f"{value}"
            )
        else:
            answer = (
                f"{label}:\n"
                f"{value}"
            )

        return FormatterResult(
            answer=answer,
            is_unresolved=False,
        )