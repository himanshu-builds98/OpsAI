import logging
from typing import List
from fastembed import TextEmbedding

logger = logging.getLogger("uvicorn.error")

class BGEEmbeddings:
    def __init__(self):
        self.model = None

    def _load_model(self):
        if self.model is None:
            logger.info("Loading fastembed all-MiniLM-L6-v2...")
            self.model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
            logger.info("Embedding model loaded.")

    def embed_query(self, text: str) -> List[float]:
        self._load_model()
        return list(list(self.model.embed([text]))[0])

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        self._load_model()
        return [list(e) for e in self.model.embed(texts)]