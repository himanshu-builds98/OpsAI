"""Verbatim response formatter.

Returns the top-matched document's definition as-is, without invoking
an LLM. This is the second ResponseFormatter implementation referenced
by formatter_factory.py, selected when settings.ANSWER_MODE == "verbatim".
"""
import logging
from typing import List, Dict, Any

from app.rag.query_processor import QueryAnalysis
from app.rag.response_engine.formatter import ResponseFormatter, FormatterResult

logger = logging.getLogger("uvicorn.error")


class VerbatimFormatter(ResponseFormatter):
    """
    Formats an answer by returning the top-ranked retrieved document's
    definition directly, with no LLM call and no prompt construction.
    """

    def format(
        self,
        question: str,
        analysis: QueryAnalysis,
        docs: List[Dict[str, Any]],
    ) -> FormatterResult:
        top_doc = docs[0]
        return FormatterResult(answer=top_doc["definition"], is_unresolved=False)
