import os
import logging
from typing import List
from app.config import settings

logger = logging.getLogger("uvicorn.error")


class BGEEmbeddings:
    """
    Lazy-loading embedding service.
    The SentenceTransformer model is loaded only when first used.
    """

    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME

        self.cache_dir = os.path.join(
            settings.REPO_ROOT,
            "vector_store",
            "hf_cache"
        )

        os.environ["HF_HOME"] = self.cache_dir
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = self.cache_dir

        self.model = None

    def _load_model(self):
        if self.model is None:
            logger.info(f"Loading embedding model: {self.model_name}")

            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(
                self.model_name,
                cache_folder=self.cache_dir
            )

            logger.info("Embedding model loaded.")

    def embed_query(self, text: str) -> List[float]:

        self._load_model()

        prefix = "Represent this sentence for searching relevant passages: "

        embedding = self.model.encode(
            prefix + text,
            normalize_embeddings=True
        )

        return embedding.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:

        self._load_model()

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True
        )

        return embeddings.tolist()