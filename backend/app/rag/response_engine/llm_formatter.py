"""LLM-backed response formatter.

Moves ALL LLM prompt-building and generation logic out of the RAG
pipeline (Sprint 2 refactor). Prompts are unchanged from the original
pipeline.py implementation. This is the ONLY formatter that talks to an
LLM; a future VerbatimFormatter (Sprint 3) will implement the same
ResponseFormatter interface without touching an LLM at all.
"""
import time
import logging
from typing import List, Dict, Any

from app.llm.base import BaseLLM
from app.rag.prompt_builder import PromptBuilder
from app.rag.query_processor import QueryAnalysis
from app.rag.response_engine.formatter import ResponseFormatter, FormatterResult

logger = logging.getLogger("uvicorn.error")


class LLMGenerationError(Exception):
    """
    Raised when the underlying LLM call fails. Carries a
    user-presentable message matching the original pipeline's
    "LLM Connection Error: ..." format.
    """

    pass


class LLMFormatter(ResponseFormatter):
    """
    Formats an answer by building a prompt from retrieved context and
    calling an LLM (Ollama/OpenAI, via the BaseLLM interface).
    """

    def __init__(self, llm: BaseLLM, fallback_message: str):
        """
        Args:
            llm: Any BaseLLM implementation (Ollama/OpenAI/etc.).
            fallback_message: The exact "insufficient information"
                message used both as the returned answer text and as
                the marker string used to detect an unresolved answer
                in the LLM's raw output.
        """
        self.llm = llm
        self.fallback_message = fallback_message

    def format(
        self,
        question: str,
        analysis: QueryAnalysis,
        docs: List[Dict[str, Any]],
    ) -> FormatterResult:
        context_str = self._build_context(docs)

        system_prompt = PromptBuilder.build_system_prompt()
        user_prompt = PromptBuilder.build_user_prompt(
            question,
            context_str,
            analysis.intent,
        )

        logger.info("=" * 60)
        logger.info("Calling LLM...")
        logger.info(f"System Prompt Length : {len(system_prompt)} characters")
        logger.info(f"User Prompt Length   : {len(user_prompt)} characters")
        logger.info(f"Intent             : {analysis.intent}")
        logger.info(f"Search Query       : {analysis.search_query}")
        logger.info(f"Retrieved Documents: {len(docs)}")

        try:
            llm_start = time.time()

            answer = self.llm.generate(
                user_prompt,
                system_prompt=system_prompt,
            )

            logger.info(f"LLM completed in {time.time() - llm_start:.2f} seconds")

            answer = answer.strip()

        except Exception as e:
            logger.exception("LLM generation failed")
            raise LLMGenerationError(f"LLM Connection Error: {str(e)}") from e

        # Check if the LLM response indicates a lack of information
        is_unresolved = (
            self.fallback_message.lower() in answer.lower()
            or "not enough information" in answer.lower()
        )

        if is_unresolved:
            return FormatterResult(answer=self.fallback_message, is_unresolved=True)

        return FormatterResult(answer=answer, is_unresolved=False)

    @staticmethod
    def _build_context(docs: List[Dict[str, Any]]) -> str:
        """
        Formulate the context string passed to the prompt builder from
        retrieved documents. Format is unchanged from the original
        pipeline.py implementation.
        """
        context_blocks = []

        for doc in docs:
            term_name = doc["term"]
            context_blocks.append(
                f"Term: {term_name}\n"
                f"Aliases: {', '.join(doc.get('aliases', []))}\n"
                f"Keywords: {', '.join(doc.get('keywords', []))}\n"
                f"Definition: {doc['definition']}\n"
                f"Created By: {doc['created_by']}\n"
                f"Used By: {doc['used_by']}\n"
                f"Purpose: {doc['purpose']}\n"
                f"Common Problems: {doc['common_problems']}\n"
                f"---"
            )

        return "\n".join(context_blocks)
