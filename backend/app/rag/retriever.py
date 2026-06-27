from typing import List, Dict, Any
from app.rag.vector_store import VectorStoreManager

class Retriever:
    """
    RAG Retriever class.
    Retrieves and filters candidate knowledge documents from ChromaDB.
    """
    def __init__(self, vector_store: VectorStoreManager, threshold: float = 0.25):
        self.vector_store = vector_store
        self.threshold = threshold

    def retrieve(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves matching trade documentation.
        Applies a minimum similarity score threshold to prevent hallucinated matches.
        """
        raw_results = self.vector_store.search(query, limit=limit)
        
        # Filter results by threshold score (if the database has contents)
        filtered = []
        for result in raw_results:
            if result.get("score", 0.0) >= self.threshold:
                filtered.append(result)
                
        return filtered
