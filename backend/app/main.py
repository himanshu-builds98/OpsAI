import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import chat, upload, analytics, health, auth
from app.db.mongodb import MongoDB

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ==========================================================
    # Startup
    # ==========================================================
    logger.info("Initializing Kaizen Trade Intelligence Assistant (OpsAI)...")

    # Connect MongoDB
    MongoDB.connect()

    try:
        from app.dependencies import get_vector_store
        from app.services.csv_loader import CSVLoaderService

        vector_store = get_vector_store()

        if vector_store.get_count() == 0:

            logger.info(
                f"Vector store is empty. Building index from "
                f"{settings.TRADE_KNOWLEDGE_CSV}"
            )

            records = CSVLoaderService.load_and_clean(
                settings.TRADE_KNOWLEDGE_CSV
            )

            if records:

                indexed = vector_store.add_documents(
                    records,
                    source_name="trade_knowledge.csv"
                )

                logger.info(
                    f"Successfully indexed {indexed} trade records."
                )

            else:

                logger.warning(
                    "trade_knowledge.csv not found or contains no records."
                )

        else:

            logger.info(
                f"Vector store already contains "
                f"{vector_store.get_count()} vectors."
            )

    except Exception as e:

        logger.exception(
            f"Startup vector indexing failed: {e}"
        )

    yield

    # ==========================================================
    # Shutdown
    # ==========================================================
    MongoDB.close()

    logger.info("Shutting down Kaizen Trade Assistant backend...")


app = FastAPI(
    title="Kaizen Trade Intelligence Assistant (OpsAI) API",
    description="Production-grade RAG backend supporting logistics, import-export, and compliance learning.",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(health.router, prefix="/api")

app.include_router(chat.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])