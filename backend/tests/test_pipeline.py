"""
Unit tests for the rewritten RAGPipeline (Sprint 2 refactor).

RAGPipeline is now a thin orchestrator: analyze -> retrieve -> delegate
to ResponseEngine -> analytics -> cache. These tests use fakes for the
retriever, response engine, and analytics service, so no real
retrieval, LLM, or vector store is touched.
"""
import pytest

from app.rag.pipeline import RAGPipeline
from app.rag.response_engine.related_topics import RelatedTopicsBuilder


DOC_FOB = {
    "term": "FOB",
    "definition": "Free on Board.",
    "created_by": "Exporter",
    "used_by": "Importer",
    "purpose": "Transfer risk at port.",
    "common_problems": "Loading disputes.",
    "aliases": [],
    "keywords": ["fob"],
    "final_score": 0.9,
}


class FakeRetriever:
    def __init__(self, docs):
        self.docs = docs
        self.calls = 0

    def retrieve(self, analysis):
        self.calls += 1
        return self.docs


class FakeResponseEngine:
    """
    Stands in for ResponseEngine; returns a scripted payload including
    the pipeline-only bookkeeping keys (is_unresolved, cacheable) that
    the real ResponseEngine also returns.
    """

    fallback_msg = "I don't have enough verified information on this topic."

    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def generate(self, question, analysis, docs):
        self.calls.append((question, analysis, docs))
        return dict(self.payload)


class FakeAnalytics:
    def __init__(self):
        self.calls = []

    def log_query(self, **kwargs):
        self.calls.append(kwargs)


def make_success_payload():
    return {
        "answer": "Term: FOB explanation.",
        "sources": [{"term": "FOB", "definition": "...", "created_by": "...",
                      "used_by": "...", "purpose": "...", "common_problems": "...",
                      "aliases": [], "keywords": [], "score": 0.9}],
        "confidence": "High",
        "related_topics": ["CIF"],
        "is_unresolved": False,
        "cacheable": True,
    }


def test_pipeline_no_docs_short_circuits_response_engine():
    retriever = FakeRetriever(docs=[])
    engine = FakeResponseEngine(payload=make_success_payload())
    analytics = FakeAnalytics()
    pipeline = RAGPipeline(retriever=retriever, response_engine=engine, analytics_service=analytics)

    result = pipeline.run("some unmatched question")

    assert result["confidence"] == "None"
    assert result["answer"] == engine.fallback_msg
    assert result["related_topics"] == RelatedTopicsBuilder.get_default_related_topics()
    assert engine.calls == []  # response engine never invoked when there are no docs
    assert analytics.calls[0]["is_unresolved"] is True


def test_pipeline_success_strips_bookkeeping_keys_and_caches():
    retriever = FakeRetriever(docs=[DOC_FOB])
    engine = FakeResponseEngine(payload=make_success_payload())
    analytics = FakeAnalytics()
    pipeline = RAGPipeline(retriever=retriever, response_engine=engine, analytics_service=analytics)

    result = pipeline.run("What is FOB?")

    assert result["answer"] == "Term: FOB explanation."
    assert "is_unresolved" not in result
    assert "cacheable" not in result
    assert analytics.calls[0]["is_unresolved"] is False
    assert analytics.calls[0]["matched_terms"] == ["FOB"]

    # Second identical call should hit the cache, not call retriever/engine again
    result2 = pipeline.run("What is FOB?")
    assert retriever.calls == 1
    assert len(engine.calls) == 1
    assert result2 == result
    assert len(analytics.calls) == 2  # analytics still logged on cache hit


def test_pipeline_unresolved_answer_is_cached_but_logged_unresolved():
    retriever = FakeRetriever(docs=[DOC_FOB])
    payload = {
        "answer": "I don't have enough verified information on this topic.",
        "sources": [],
        "confidence": "None",
        "related_topics": RelatedTopicsBuilder.get_default_related_topics(),
        "is_unresolved": True,
        "cacheable": True,
    }
    engine = FakeResponseEngine(payload=payload)
    analytics = FakeAnalytics()
    pipeline = RAGPipeline(retriever=retriever, response_engine=engine, analytics_service=analytics)

    result = pipeline.run("What is XYZ?")

    assert result["confidence"] == "None"
    assert analytics.calls[0]["is_unresolved"] is True
    assert analytics.calls[0]["matched_terms"] == []

    # Still cached despite being unresolved
    pipeline.run("What is XYZ?")
    assert retriever.calls == 1


def test_pipeline_llm_error_is_not_cached():
    retriever = FakeRetriever(docs=[DOC_FOB])
    payload = {
        "answer": "LLM Connection Error: connection refused",
        "sources": [],
        "confidence": "Low",
        "related_topics": RelatedTopicsBuilder.get_default_related_topics(),
        "is_unresolved": True,
        "cacheable": False,
    }
    engine = FakeResponseEngine(payload=payload)
    analytics = FakeAnalytics()
    pipeline = RAGPipeline(retriever=retriever, response_engine=engine, analytics_service=analytics)

    result1 = pipeline.run("What is FOB?")
    assert "LLM Connection Error" in result1["answer"]

    # Not cached -> retriever and engine are called again on next identical query
    result2 = pipeline.run("What is FOB?")
    assert retriever.calls == 2
    assert len(engine.calls) == 2
