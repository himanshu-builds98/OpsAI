from fastapi import APIRouter, Depends
from app.dependencies import get_vector_store
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health_check(vector_store = Depends(get_vector_store)):
    """
    Standard health check endpoint.
    Verifies database connection and lists model configurations.
    """
    db_ok = True
    db_count = 0
    try:
        db_count = vector_store.get_count()
    except Exception:
        db_ok = False
        
    return {
        "status": "healthy",
        "database": "connected" if db_ok else "error",
        "records_indexed": db_count,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL_NAME
    }
