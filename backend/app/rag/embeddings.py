import os
import logging
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class BGEEmbeddings:
    """
    Embedding service using the local BAAI/bge-small-en-v1.5 model.
    Optimized for high retrieval performance and low latency.
    """
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        
        # Set cache directories to keep weights local to workspace
        cache_dir = os.path.join(settings.REPO_ROOT, "vector_store", "hf_cache")
        os.environ["HF_HOME"] = cache_dir
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = cache_dir

        logger.info(f"Loading local embedding model: {self.model_name}...")
        try:
            self.model = SentenceTransformer(self.model_name, cache_folder=cache_dir)
            logger.info("Local embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model locally: {str(e)}")
            raise e

    def embed_query(self, text: str) -> List[float]:
        """
        Embeds a single query. BGE recommendations include adding a query prefix
        for optimal retrieval quality.
        """
        # BGE small en v1.5 requires prefixing query for asymmetric retrieval
        prefix = "Represent this sentence for searching relevant passages: "
        prefixed_text = prefix + text
        embedding = self.model.encode(prefixed_text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of document chunks.
        """
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()
