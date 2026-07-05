"""
Response Engine package.

Decouples response generation (prompting, LLM invocation, confidence
scoring, source serialization, related-topics suggestion) from the RAG
retrieval pipeline. The active ResponseFormatter (LLMFormatter vs
VerbatimFormatter) is selected by FormatterFactory based on
settings.ANSWER_MODE.

Note: LLMFormatter and VerbatimFormatter are intentionally NOT
re-exported here. Importing this package must not import
llm_formatter.py (which pulls in PromptBuilder) when
settings.ANSWER_MODE == "verbatim" - so formatter selection/import is
left entirely to FormatterFactory, which imports each formatter module
lazily, only inside the branch that needs it. Import the formatters
directly from their own modules if needed
(app.rag.response_engine.llm_formatter / .verbatim_formatter).
"""
from app.rag.response_engine.engine import ResponseEngine
from app.rag.response_engine.formatter import (
    ResponseFormatter,
    FormatterResult,
    LLMGenerationError,
)
from app.rag.response_engine.formatter_factory import FormatterFactory
from app.rag.response_engine.confidence import ConfidenceResolver
from app.rag.response_engine.source_builder import SourceBuilder
from app.rag.response_engine.related_topics import RelatedTopicsBuilder

__all__ = [
    "ResponseEngine",
    "ResponseFormatter",
    "FormatterResult",
    "LLMGenerationError",
    "FormatterFactory",
    "ConfidenceResolver",
    "SourceBuilder",
    "RelatedTopicsBuilder",
]
