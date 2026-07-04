import os
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

        return {
            "status": "healthy",
            "database": "connected",
            "records_indexed": db_count,
            "chroma_path": settings.chroma_dir,
            "path_exists": os.path.exists(settings.chroma_dir),
            "files": os.listdir(settings.chroma_dir)
                if os.path.exists(settings.chroma_dir)
                else [],
            "llm_provider": settings.LLM_PROVIDER,
            "llm_model": settings.LLM_MODEL,
            "embedding_model": settings.EMBEDDING_MODEL_NAME,
        }

    except Exception as e:

        return {
            "status": "error",
            "database": str(e),
            "records_indexed": 0,
            "chroma_path": settings.chroma_dir,
            "path_exists": os.path.exists(settings.chroma_dir),
            "files": os.listdir(settings.chroma_dir)
                if os.path.exists(settings.chroma_dir)
                else [],
        }