from fastapi import APIRouter
from app.dependencies import get_vector_store
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    db_ok = True
    db_count = 0
    try:
        vector_store = get_vector_store()
        db_count = vector_store.get_count()
    except Exception:
        db_ok = False

    return {
        "status": "healthy",
        "database": "connected" if db_ok else "error",
        "records_indexed": db_count,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "vector_store": "MongoDB Atlas Vector Search",
    }