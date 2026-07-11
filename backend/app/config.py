import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,*"

    BACKEND_ROOT: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    REPO_ROOT: str = os.path.dirname(BACKEND_ROOT)

    TRADE_KNOWLEDGE_CSV: str = os.path.join(REPO_ROOT, "data", "Kaizen_Ops_Chatbot_Dataset.csv")
    ANALYTICS_FILE: str = os.path.join(REPO_ROOT, "data", "analytics.json")
    UPLOADS_DIR: str = os.path.join(REPO_ROOT, "data", "uploads")

    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    ANSWER_MODE: str = "verbatim"
    FALLBACK_MESSAGE: str = "I don't have enough verified information on this topic."

    SIMILARITY_THRESHOLD: float = 0.25
    TOP_K: int = 4
    ENABLE_EXACT_MATCH: bool = True
    EXACT_MATCH_BOOST: float = 0.40
    CONTAINS_MATCH_BOOST: float = 0.15

    # ============================================================
    # MongoDB
    # ============================================================
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "opsai"

    JWT_SECRET: str = "changeme"
    JWT_EXPIRE_MINUTES: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            ".env"
        )
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

os.makedirs(os.path.dirname(settings.TRADE_KNOWLEDGE_CSV), exist_ok=True)
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.ANALYTICS_FILE), exist_ok=True)

