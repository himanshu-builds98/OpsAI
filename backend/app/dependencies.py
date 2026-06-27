from app.rag.embeddings import BGEEmbeddings
from app.rag.vector_store import VectorStoreManager
from app.rag.retriever import Retriever
from app.rag.pipeline import RAGPipeline
from app.llm.llm_factory import LLMFactory
from app.services.analytics_service import AnalyticsService

# Singletons initialization
_embeddings = None
_vector_store = None
_retriever = None
_llm = None
_analytics = None
_pipeline = None

def get_embeddings() -> BGEEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = BGEEmbeddings()
    return _embeddings

def get_vector_store() -> VectorStoreManager:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreManager(get_embeddings())
    return _vector_store

def get_retriever() -> Retriever:
    global _retriever
    if _retriever is None:
        from app.config import settings
        _retriever = Retriever(get_vector_store(), threshold=settings.SIMILARITY_THRESHOLD)
    return _retriever

def get_llm():
    global _llm
    if _llm is None:
        _llm = LLMFactory.get_llm()
    return _llm

def get_analytics_service() -> AnalyticsService:
    global _analytics
    if _analytics is None:
        _analytics = AnalyticsService()
    return _analytics

def get_rag_pipeline() -> RAGPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGPipeline(get_retriever(), get_llm(), get_analytics_service())
    return _pipeline
