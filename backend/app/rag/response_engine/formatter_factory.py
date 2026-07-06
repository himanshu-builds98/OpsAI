"""Factory for selecting the active ResponseFormatter implementation.

Reads settings.ANSWER_MODE so that dependencies.py (and any other
caller) doesn't need to know which formatter classes exist or how they
are constructed.
"""
from typing import Optional

from app.config import settings
from app.llm.base import BaseLLM
from app.rag.response_engine.formatter import ResponseFormatter
from app.rag.response_engine.llm_formatter import LLMFormatter
from app.rag.response_engine.verbatim_formatter import VerbatimFormatter


class FormatterFactory:
    """Builds the ResponseFormatter to use, based on settings.ANSWER_MODE."""

    @staticmethod
    def create(llm: Optional[BaseLLM] = None) -> ResponseFormatter:
        if settings.ANSWER_MODE == "llm":
            return LLMFormatter(llm=llm, fallback_message=settings.FALLBACK_MESSAGE)

        if settings.ANSWER_MODE == "verbatim":
            return VerbatimFormatter()

        raise ValueError(f"Unknown ANSWER_MODE: {settings.ANSWER_MODE}")
