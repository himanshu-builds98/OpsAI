"""Response generation orchestration.

The ResponseEngine is the sole owner of "how a resolved query with
retrieved documents becomes a final answer payload". RAGPipeline no
longer knows about prompts, LLMs, confidence thresholds, source
serialization, or related-topics logic - it just calls generate().
"""
import logging
from typing import List, Dict, Any, Optional

from app.rag.query_processor import QueryAnalysis
from app.rag.response_engine.formatter import ResponseFormatter
from app.rag.response_engine.llm_formatter import LLMGenerationError
from app.rag.response_engine.confidence import ConfidenceResolver
from app.rag.response_engine.source_builder import SourceBuilder
from app.rag.response_engine.related_topics import RelatedTopicsBuilder

logger = logging.getLogger("uvicorn.error")


class ResponseEngine:
    """
    Orchestrates response generation: delegates answer-text production to
    a ResponseFormatter (e.g. LLMFormatter, selected via
    settings.ANSWER_MODE), then attaches confidence, sources, and
    related topics around it.

    Returned payloads always contain the public keys the API layer
    expects (answer, sources, confidence, related_topics), plus two
    pipeline-only bookkeeping keys the caller (RAGPipeline) is expected
    to pop before returning to its own caller:

    - is_unresolved: whether this should be logged/counted as an
      unresolved query in analytics.
    - cacheable: whether RAGPipeline should cache this payload. LLM
      connection errors are never cached, matching original behaviour.
    """

    FALLBACK_MESSAGE = "I don't have enough verified information on this topic."

    def __init__(
        self,
        formatter: ResponseFormatter,
        confidence_resolver: Optional[ConfidenceResolver] = None,
        source_builder: Optional[SourceBuilder] = None,
        related_topics_builder: Optional[RelatedTopicsBuilder] = None,
        fallback_message: Optional[str] = None,
    ):
        self.formatter = formatter
        self.confidence_resolver = confidence_resolver or ConfidenceResolver()
        self.source_builder = source_builder or SourceBuilder()
        self.related_topics_builder = related_topics_builder or RelatedTopicsBuilder()
        self.fallback_msg = fallback_message or self.FALLBACK_MESSAGE

    def generate(
        self,
        question: str,
        analysis: QueryAnalysis,
        docs: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate the final response payload for a query that has at
        least one retrieved document.

        Callers (RAGPipeline) are responsible for handling the "no
        documents retrieved" case before calling this, since that is a
        retrieval-level concern, not a response-formatting concern.
        """
        try:
            result = self.formatter.format(question, analysis, docs)
        except LLMGenerationError as e:
            return {
                "answer": str(e),
                "sources": [],
                "confidence": "Low",
                "related_topics": self.related_topics_builder.get_default_related_topics(),
                "is_unresolved": True,
                "cacheable": False,
            }

        if result.is_unresolved:
            return {
                "answer": self.fallback_msg,
                "sources": [],
                "confidence": "None",
                "related_topics": self.related_topics_builder.get_default_related_topics(),
                "is_unresolved": True,
                "cacheable": True,
            }

        confidence = self.confidence_resolver.resolve(docs)
        sources = self.source_builder.build(docs)
        related_topics = self.related_topics_builder.build(docs)

        return {
            "answer": result.answer,
            "sources": sources,
            "confidence": confidence,
            "related_topics": related_topics,
            "is_unresolved": False,
            "cacheable": True,
        }
