from typing import Optional
from app.config import settings
from app.rag.embeddings import BGEEmbeddings
from app.rag.vector_store import VectorStoreManager
from app.rag.retriever import Retriever
from app.rag.pipeline import RAGPipeline
from app.rag.response_engine.engine import ResponseEngine
from app.rag.response_engine.formatter_factory import FormatterFactory
from app.llm.base import BaseLLM
from app.llm.llm_factory import LLMFactory
from app.services.analytics_service import AnalyticsService

# ============================================================
# Singleton Instances
# ============================================================
_embeddings: Optional[BGEEmbeddings] = None
_vector_store: Optional[VectorStoreManager] = None
_retriever: Optional[Retriever] = None
_llm: Optional[BaseLLM] = None
_analytics: Optional[AnalyticsService] = None
_response_engine: Optional[ResponseEngine] = None
_pipeline: Optional[RAGPipeline] = None

# ============================================================
# Embeddings
# ============================================================
def get_embeddings() -> BGEEmbeddings:
    global _embeddings

    if _embeddings is None:
        _embeddings = BGEEmbeddings()

    return _embeddings

# ============================================================
# Vector Store
# ============================================================
def get_vector_store() -> VectorStoreManager:
    global _vector_store

    if _vector_store is None:
        _vector_store = VectorStoreManager(
            get_embeddings()
        )

    return _vector_store

# ============================================================
# Retriever
# ============================================================
def get_retriever() -> Retriever:
    global _retriever

    if _retriever is None:
        _retriever = Retriever(
            vector_store=get_vector_store(),
            threshold=settings.SIMILARITY_THRESHOLD
        )

    return _retriever

# ============================================================
# LLM
# ============================================================
def get_llm() -> BaseLLM:
    global _llm

    if _llm is None:
        _llm = LLMFactory.get_llm()

    return _llm

# ============================================================
# Analytics
# ============================================================
def get_analytics_service() -> AnalyticsService:
    global _analytics

    if _analytics is None:
        _analytics = AnalyticsService()

    return _analytics

# ============================================================
# Response Engine
# ============================================================
def get_response_engine() -> ResponseEngine:
    """
    Builds the ResponseEngine used by the RAG pipeline. The concrete
    formatter (LLMFormatter vs VerbatimFormatter) is selected by
    FormatterFactory based on settings.ANSWER_MODE.

    get_llm() is only called when ANSWER_MODE == "llm" - in "verbatim"
    mode, no BaseLLM (Ollama/OpenAI) is ever constructed.
    """
    global _response_engine

    if _response_engine is None:
        if settings.ANSWER_MODE == "llm":
            formatter = FormatterFactory.create(llm=get_llm())
        else:
            formatter = FormatterFactory.create()

        _response_engine = ResponseEngine(formatter=formatter)

    return _response_engine

# ============================================================
# Pipeline
# ============================================================
def get_rag_pipeline() -> RAGPipeline:
    global _pipeline

    if _pipeline is None:
        _pipeline = RAGPipeline(
            retriever=get_retriever(),
            response_engine=get_response_engine(),
            analytics_service=get_analytics_service()
        )

    return _pipeline

# ============================================================
# Backward Compatibility
# ============================================================
def get_rag() -> RAGPipeline:
    return get_rag_pipeline()