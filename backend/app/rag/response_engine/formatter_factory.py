"""Factory for selecting the active ResponseFormatter implementation.

Reads settings.ANSWER_MODE so that dependencies.py (and any other
caller) doesn't need to know which formatter classes exist or how they
are constructed.

Imports of the concrete formatter modules are deliberately deferred to
inside each branch, rather than at module load time. LLMFormatter pulls
in PromptBuilder; if that import happened unconditionally at the top of
this file, PromptBuilder would be imported into every process even when
settings.ANSWER_MODE == "verbatim" and no LLM is ever used.
"""
from typing import Optional

from app.config import settings
from app.llm.base import BaseLLM
from app.rag.response_engine.formatter import ResponseFormatter


class FormatterFactory:
    """Builds the ResponseFormatter to use, based on settings.ANSWER_MODE."""

    @staticmethod
    def create(llm: Optional[BaseLLM] = None) -> ResponseFormatter:
        if settings.ANSWER_MODE == "llm":
            if llm is None:
                raise ValueError(
                    "ANSWER_MODE='llm' requires an llm instance to be "
                    "passed to FormatterFactory.create(llm=...)."
                )

            from app.rag.response_engine.llm_formatter import LLMFormatter

            return LLMFormatter(llm=llm, fallback_message=settings.FALLBACK_MESSAGE)

        if settings.ANSWER_MODE == "verbatim":
            from app.rag.response_engine.verbatim_formatter import VerbatimFormatter

            return VerbatimFormatter()

        raise ValueError(f"Unknown ANSWER_MODE: {settings.ANSWER_MODE}")
