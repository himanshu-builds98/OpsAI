import logging
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import chat, upload, analytics, health, auth
from app.config import settings

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Ingestion Event
    logger.info("Initializing Kaizen Trade Intelligence Assistant (OpsAI)...")
    try:
        from app.dependencies import get_vector_store
        from app.services.csv_loader import CSVLoaderService
        
        vector_store = get_vector_store()
        count = vector_store.get_count()
        
        if count == 0:
            logger.info(f"Vector store is empty. Starting auto-ingestion of: {settings.TRADE_KNOWLEDGE_CSV}")
            records = CSVLoaderService.load_and_clean(settings.TRADE_KNOWLEDGE_CSV)
            if records:
                indexed = vector_store.add_documents(records, source_name="Kaizen_Ops_Chatbot_Dataset.csv")
                logger.info(f"Successfully auto-ingested {indexed} records into ChromaDB.")
            else:
                logger.warning("Default trade knowledge CSV not found or is empty. Ingestion skipped.")
        else:
            logger.info(f"Vector store is ready with {count} indexed records.")
    except Exception as e:
        logger.error(f"Error during startup vector store ingestion: {str(e)}")
        
    yield
    # Shutdown Event
    logger.info("Shutting down Kaizen Trade Assistant backend...")

app = FastAPI(
    title="Kaizen Trade Intelligence Assistant (OpsAI) API",
    description="Production-grade RAG backend supporting logistics, import-export, and compliance learning.",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check mounted at both root and /api/health for routing safety
app.include_router(health.router)
app.include_router(health.router, prefix="/api")

# Ingestion, Chat, and Analytics routers prefix-routed under /api
app.include_router(chat.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])