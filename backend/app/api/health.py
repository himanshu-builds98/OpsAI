import os
from fastapi import APIRouter

from app.dependencies import get_vector_store
from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        vector_store = get_vector_store()

        # Force initialization
        vector_store._load_collection()

        collection_names = []
        try:
            collections = vector_store.client.list_collections()

            for c in collections:
                if hasattr(c, "name"):
                    collection_names.append(c.name)
                else:
                    collection_names.append(str(c))

        except Exception as e:
            collection_names = [f"Unable to list collections: {str(e)}"]

        return {
            "status": "healthy",
            "database": "connected",
            "records_indexed": vector_store.get_count(),

            # Chroma Diagnostics
            "chroma_path": settings.chroma_dir,
            "path_exists": os.path.exists(settings.chroma_dir),
            "files": os.listdir(settings.chroma_dir)
            if os.path.exists(settings.chroma_dir)
            else [],

            "collections": collection_names,
            "active_collection": (
                vector_store.collection.name
                if vector_store.collection
                else None
            ),

            # Model Information
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