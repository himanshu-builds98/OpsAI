"""
Response Engine package.

Decouples response generation (prompting, LLM invocation, confidence
scoring, source serialization, related-topics suggestion) from the RAG
retrieval pipeline. Introduced in Sprint 2 so that the LLM becomes just
one interchangeable ResponseFormatter implementation - Sprint 3 will add
a VerbatimFormatter alongside it, selected via settings.ANSWER_MODE.
"""
from app.rag.response_engine.engine import ResponseEngine
from app.rag.response_engine.formatter import ResponseFormatter, FormatterResult
from app.rag.response_engine.llm_formatter import LLMFormatter, LLMGenerationError
from app.rag.response_engine.confidence import ConfidenceResolver
from app.rag.response_engine.source_builder import SourceBuilder
from app.rag.response_engine.related_topics import RelatedTopicsBuilder

__all__ = [
    "ResponseEngine",
    "ResponseFormatter",
    "FormatterResult",
    "LLMFormatter",
    "LLMGenerationError",
    "ConfidenceResolver",
    "SourceBuilder",
    "RelatedTopicsBuilder",
]
