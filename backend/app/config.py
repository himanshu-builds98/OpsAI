import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server Configurations
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development" # "development", "production", "test"
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,*"

    # Paths
    BACKEND_ROOT: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    REPO_ROOT: str = os.path.dirname(BACKEND_ROOT)

    TRADE_KNOWLEDGE_CSV: str = os.path.join(REPO_ROOT, "data", "trade_knowledge.csv")
    CHROMA_PERSIST_DIR: str = os.path.join(REPO_ROOT, "vector_store")
    CHROMA_PATH: str = "" # Fallback mapped in property
    CHROMA_SERVER_HOST: str = "" # Set in prod to run standalone container
    CHROMA_SERVER_HTTP_PORT: int = 8000
    ANALYTICS_FILE: str = os.path.join(REPO_ROOT, "data", "analytics.json")
    UPLOADS_DIR: str = os.path.join(REPO_ROOT, "data", "uploads")

    # Embeddings
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"

    # LLM Settings
    LLM_PROVIDER: str = "ollama"  # "ollama" or "openai"
    LLM_MODEL: str = "mistral:7b"    # "mistral", "llama3.1:8b"
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_URL: str = ""          # Fallback mapped in property

    # RAG Settings
    SIMILARITY_THRESHOLD: float = 0.25
    TOP_K: int = 4

    # OpenAI-compatible API Fallback
    OPENAI_API_KEY: str = "placeholder-key"
    OPENAI_API_BASE: str = "https://api.openai.com/v1"

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "opsai"
    JWT_SECRET: str = "changeme"
    JWT_EXPIRE_MINUTES: int = 60
    
    @property
    def chroma_dir(self) -> str:
        if self.CHROMA_PATH:
            return self.CHROMA_PATH
        return self.CHROMA_PERSIST_DIR

    @property
    def ollama_endpoint(self) -> str:
        if self.OLLAMA_URL:
            return self.OLLAMA_URL
        return self.OLLAMA_HOST

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

# Create directories if they do not exist
os.makedirs(os.path.dirname(settings.TRADE_KNOWLEDGE_CSV), exist_ok=True)
os.makedirs(settings.chroma_dir, exist_ok=True)
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.ANALYTICS_FILE), exist_ok=True)
