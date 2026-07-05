"""
Unit tests for the response_engine package introduced in Sprint 2.

These tests exercise ConfidenceResolver, SourceBuilder,
RelatedTopicsBuilder, LLMFormatter, and ResponseEngine in isolation,
using a fake BaseLLM so no real Ollama/OpenAI/network calls are made.
"""
import pytest

from app.rag.query_processor import QueryProcessor
from app.rag.response_engine.confidence import ConfidenceResolver
from app.rag.response_engine.source_builder import SourceBuilder
from app.rag.response_engine.related_topics import RelatedTopicsBuilder
from app.rag.response_engine.llm_formatter import LLMFormatter, LLMGenerationError
from app.rag.response_engine.engine import ResponseEngine


DOC_FOB = {
    "term": "FOB",
    "definition": "Free on Board. The seller delivers when the goods pass the ship's rail.",
    "created_by": "Exporter",
    "used_by": "Importer",
    "purpose": "To transfer risk and cost from exporter to importer at the port of shipment.",
    "common_problems": "Disputes on damage during loading.",
    "aliases": ["Free on Board"],
    "keywords": ["fob", "shipment"],
    "final_score": 0.82,
}

DOC_CIF = {
    "term": "CIF",
    "definition": "Cost, Insurance, and Freight.",
    "created_by": "Exporter",
    "used_by": "Importer",
    "purpose": "To bundle freight cost and marine cargo insurance to destination.",
    "common_problems": "Insurance recovery claims processing delays.",
    "aliases": [],
    "keywords": ["cif"],
    "final_score": 0.5,
}


class FakeLLM:
    """Minimal BaseLLM-compatible stub."""

    def __init__(self, answer=None, exception=None):
        self.answer = answer
        self.exception = exception
        self.calls = []

    def generate(self, prompt, system_prompt=None):
        self.calls.append({"prompt": prompt, "system_prompt": system_prompt})
        if self.exception:
            raise self.exception
        return self.answer


@pytest.fixture
def analysis():
    return QueryProcessor.process("What is FOB?")


# ============================================================
# ConfidenceResolver
# ============================================================
def test_confidence_high():
    assert ConfidenceResolver.resolve([{"final_score": 0.70}]) == "High"
    assert ConfidenceResolver.resolve([{"final_score": 0.95}]) == "High"


def test_confidence_medium():
    assert ConfidenceResolver.resolve([{"final_score": 0.45}]) == "Medium"
    assert ConfidenceResolver.resolve([{"final_score": 0.69}]) == "Medium"


def test_confidence_low():
    assert ConfidenceResolver.resolve([{"final_score": 0.0}]) == "Low"
    assert ConfidenceResolver.resolve([{"final_score": 0.44}]) == "Low"


def test_confidence_falls_back_to_score_key():
    # When "final_score" is absent, fall back to "score"
    assert ConfidenceResolver.resolve([{"score": 0.80}]) == "High"


# ============================================================
# SourceBuilder
# ============================================================
def test_source_builder_shape():
    sources = SourceBuilder.build([DOC_FOB, DOC_CIF])

    assert len(sources) == 2
    assert sources[0]["term"] == "FOB"
    assert sources[0]["score"] == 0.82
    assert sources[0]["aliases"] == ["Free on Board"]
    assert sources[1]["term"] == "CIF"
    assert sources[1]["score"] == 0.5
    # Required SourceDoc fields all present
    for key in ("term", "definition", "created_by", "used_by", "purpose", "common_problems", "score"):
        assert key in sources[0]


def test_source_builder_rounds_score():
    doc = dict(DOC_FOB, final_score=0.123456)
    sources = SourceBuilder.build([doc])
    assert sources[0]["score"] == 0.123


# ============================================================
# RelatedTopicsBuilder
# ============================================================
def test_related_topics_from_candidates():
    topics = RelatedTopicsBuilder.build([DOC_FOB, DOC_CIF])
    assert "CIF" in topics
    assert "FOB" not in topics  # primary term excluded
    assert len(topics) <= 3


def test_related_topics_pads_with_defaults_when_insufficient():
    topics = RelatedTopicsBuilder.build([DOC_FOB])
    # Only the primary doc, no other candidates -> padded from defaults
    assert len(topics) >= 2
    for t in topics:
        assert t.lower() != "fob"


def test_related_topics_default_list_is_stable():
    defaults = RelatedTopicsBuilder.get_default_related_topics()
    assert defaults == [
        "Bill of Lading",
        "FOB (Free on Board)",
        "CIF (Cost, Insurance, and Freight)",
        "Incoterms",
    ]
    # Returned list must be a copy, not a reference to internal state
    defaults.append("mutated")
    assert "mutated" not in RelatedTopicsBuilder.get_default_related_topics()


# ============================================================
# LLMFormatter
# ============================================================
def test_llm_formatter_success(analysis):
    llm = FakeLLM(answer="  Term: FOB explanation.  ")
    formatter = LLMFormatter(llm=llm, fallback_message=ResponseEngine.FALLBACK_MESSAGE)

    result = formatter.format("What is FOB?", analysis, [DOC_FOB])

    assert result.answer == "Term: FOB explanation."
    assert result.is_unresolved is False
    assert len(llm.calls) == 1
    assert llm.calls[0]["system_prompt"] is not None


def test_llm_formatter_detects_unresolved_answer(analysis):
    llm = FakeLLM(answer=ResponseEngine.FALLBACK_MESSAGE)
    formatter = LLMFormatter(llm=llm, fallback_message=ResponseEngine.FALLBACK_MESSAGE)

    result = formatter.format("What is XYZ?", analysis, [DOC_FOB])

    assert result.is_unresolved is True
    assert result.answer == ResponseEngine.FALLBACK_MESSAGE


def test_llm_formatter_detects_not_enough_information_phrase(analysis):
    llm = FakeLLM(answer="Sorry, not enough information to answer that.")
    formatter = LLMFormatter(llm=llm, fallback_message=ResponseEngine.FALLBACK_MESSAGE)

    result = formatter.format("What is XYZ?", analysis, [DOC_FOB])

    assert result.is_unresolved is True


def test_llm_formatter_wraps_exceptions(analysis):
    llm = FakeLLM(exception=ConnectionError("connection refused"))
    formatter = LLMFormatter(llm=llm, fallback_message=ResponseEngine.FALLBACK_MESSAGE)

    with pytest.raises(LLMGenerationError) as exc_info:
        formatter.format("What is FOB?", analysis, [DOC_FOB])

    assert str(exc_info.value) == "LLM Connection Error: connection refused"


# ============================================================
# ResponseEngine
# ============================================================
def test_response_engine_success_path(analysis):
    llm = FakeLLM(answer="Term: FOB explanation.")
    engine = ResponseEngine(formatter=LLMFormatter(llm, ResponseEngine.FALLBACK_MESSAGE))

    payload = engine.generate("What is FOB?", analysis, [DOC_FOB, DOC_CIF])

    assert payload["answer"] == "Term: FOB explanation."
    assert payload["confidence"] == "High"
    assert payload["sources"][0]["term"] == "FOB"
    assert payload["is_unresolved"] is False
    assert payload["cacheable"] is True


def test_response_engine_unresolved_path(analysis):
    llm = FakeLLM(answer=ResponseEngine.FALLBACK_MESSAGE)
    engine = ResponseEngine(formatter=LLMFormatter(llm, ResponseEngine.FALLBACK_MESSAGE))

    payload = engine.generate("What is XYZ?", analysis, [DOC_FOB])

    assert payload["answer"] == ResponseEngine.FALLBACK_MESSAGE
    assert payload["confidence"] == "None"
    assert payload["sources"] == []
    assert payload["is_unresolved"] is True
    assert payload["cacheable"] is True


def test_response_engine_llm_error_path(analysis):
    llm = FakeLLM(exception=TimeoutError("timed out"))
    engine = ResponseEngine(formatter=LLMFormatter(llm, ResponseEngine.FALLBACK_MESSAGE))

    payload = engine.generate("What is FOB?", analysis, [DOC_FOB])

    assert payload["answer"] == "LLM Connection Error: timed out"
    assert payload["confidence"] == "Low"
    assert payload["sources"] == []
    assert payload["is_unresolved"] is True
    assert payload["cacheable"] is False
