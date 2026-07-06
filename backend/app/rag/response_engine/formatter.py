"""Abstract response formatter interface.

This is the seam Sprint 3 will use to introduce a VerbatimFormatter
alongside (or instead of) LLMFormatter, selected via settings.ANSWER_MODE.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any

from app.rag.query_processor import QueryAnalysis


@dataclass
class FormatterResult:
    """
    Result of a ResponseFormatter's formatting step, before confidence,
    sources, and related topics are attached by the ResponseEngine.
    """

    answer: str
    is_unresolved: bool


class LLMGenerationError(Exception):
    """
    Raised by a ResponseFormatter when answer generation fails in a way
    that ResponseEngine should surface as a formatted error response.

    Defined here (rather than in llm_formatter.py) so that engine.py can
    catch it without importing any LLM-specific formatter module. That
    matters because llm_formatter.py imports PromptBuilder: if engine.py
    imported LLMGenerationError from llm_formatter.py, PromptBuilder
    would get imported on every request, even when
    settings.ANSWER_MODE == "verbatim" and no LLM is ever used.
    """

    pass


class ResponseFormatter(ABC):
    """
    Abstract interface for turning (question, analysis, retrieved docs)
    into a final answer string.

    Concrete implementations (e.g. LLMFormatter, and a future
    VerbatimFormatter) decide *how* the answer text is produced. The
    ResponseEngine decides what happens around that (confidence scoring,
    source serialization, related topics).
    """

    @abstractmethod
    def format(
        self,
        question: str,
        analysis: QueryAnalysis,
        docs: List[Dict[str, Any]],
    ) -> FormatterResult:
        """
        Produce the answer text for a query with at least one retrieved
        document.

        Args:
            question: The original user question.
            analysis: The QueryAnalysis produced by QueryProcessor.
            docs: Retrieved documents (non-empty).

        Returns:
            A FormatterResult with the answer text and whether the
            answer should be treated as "unresolved" (insufficient
            verified information).

        Raises:
            Implementations may raise formatter-specific exceptions
            (e.g. LLMGenerationError) on failure; the ResponseEngine is
            responsible for handling those.
        """
        raise NotImplementedError
