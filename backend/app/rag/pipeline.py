import time
import logging
from typing import Dict, Any

from app.rag.retriever import Retriever
from app.rag.query_processor import QueryProcessor
from app.rag.response_engine.engine import ResponseEngine
from app.rag.response_engine.related_topics import RelatedTopicsBuilder

logger = logging.getLogger("uvicorn.error")


class RAGPipeline:
    """
    RAG Pipeline coordinator.
    Orchestrates the query-to-response flow:
    analyze query -> retrieve documents -> generate response -> analytics -> cache.
    All response-formatting concerns (prompt construction, LLM calls,
    confidence scoring, source serialization, related-topics selection)
    are delegated to a ResponseEngine. This class only knows about
    query analysis, retrieval, caching, and analytics.
    """

    def __init__(
        self,
        retriever: Retriever,
        response_engine: ResponseEngine,
        analytics_service: Any,
    ):
        self.retriever = retriever
        self.response_engine = response_engine
        self.analytics_service = analytics_service
        self.fallback_msg = response_engine.fallback_msg
        self.cache = {}  # In-memory caching for repeated queries

    def run(self, question: str) -> Dict[str, Any]:
        start_time = time.time()

        analysis = QueryProcessor.process(question)

        # Cache Check
        cache_key = (
            analysis.normalized_query,
            analysis.intent,
            analysis.top_k,
        )
        if cache_key in self.cache:
            logger.info(f"RAG Cache Hit: Query='{question}'")
            cached_res = self.cache[cache_key]
            self.analytics_service.log_query(
                question=question,
                intent=analysis.intent,
                is_unresolved=cached_res["confidence"] == "None",
                execution_time=time.time() - start_time,
                matched_terms=[s["term"] for s in cached_res["sources"]],
            )
            return cached_res

        logger.info(f"RAG Pipeline Run: Query='{question}'")

        # Retrieve Relevant Documents
        docs = self.retriever.retrieve(analysis)

        # Handle Empty Database/No Matches
        if not docs:
            logger.warning(f"No relevant documents retrieved for query: {question}")
            self.analytics_service.log_query(
                question=question,
                intent=analysis.intent,
                is_unresolved=True,
                execution_time=time.time() - start_time,
                matched_terms=[],
            )
            no_match_res = {
                "answer": self.fallback_msg,
                "sources": [],
                "confidence": "None",
                "related_topics": RelatedTopicsBuilder.get_default_related_topics(),
            }
            # Cache the failure response to avoid repeated failed lookups
            self.cache[cache_key] = no_match_res
            return no_match_res

        # Generate the response (prompting/LLM/confidence/sources/related topics)
        engine_payload = self.response_engine.generate(question, analysis, docs)

        # Pull out pipeline-only bookkeeping fields before returning
        is_unresolved = engine_payload.pop("is_unresolved")
        cacheable = engine_payload.pop("cacheable")
        response_payload = engine_payload

        # Record Analytics
        execution_time = time.time() - start_time
        terms_to_log = (
            [s["term"] for s in response_payload["sources"]] if not is_unresolved else []
        )

        self.analytics_service.log_query(
            question=question,
            intent=analysis.intent,
            is_unresolved=is_unresolved,
            execution_time=execution_time,
            matched_terms=terms_to_log,
        )

        if cacheable:
            self.cache[cache_key] = response_payload

        return response_payload
