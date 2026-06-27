import os
import logging
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from typing import List, Dict, Any
from app.config import settings
from app.rag.embeddings import BGEEmbeddings

logger = logging.getLogger("uvicorn.error")

class ChromaEmbeddingBridge(EmbeddingFunction):
    """
    Bridge connecting our BGE embedding service to ChromaDB.
    """
    def __init__(self, embedding_service: BGEEmbeddings):
        self.embedding_service = embedding_service

    def __call__(self, input: Documents) -> Embeddings:
        return self.embedding_service.embed_documents(input)

class VectorStoreManager:
    """
    ChromaDB persistent vector store manager.
    Handles indexing trade terms and performing similarity searches.
    """
    def __init__(self, embedding_service: BGEEmbeddings):
        self.embedding_service = embedding_service
        self.bridge = ChromaEmbeddingBridge(self.embedding_service)
        
        if settings.CHROMA_SERVER_HOST:
            logger.info(f"Connecting to standalone ChromaDB server at: {settings.CHROMA_SERVER_HOST}:{settings.CHROMA_SERVER_HTTP_PORT}")
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_SERVER_HOST,
                port=settings.CHROMA_SERVER_HTTP_PORT
            )
        else:
            logger.info(f"Initializing persistent ChromaDB client at: {settings.chroma_dir}")
            os.makedirs(settings.chroma_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.chroma_dir)
            
        self.collection = self.client.get_or_create_collection(
            name="trade_knowledge",
            embedding_function=self.bridge,
            metadata={"hnsw:space": "cosine"} # cosine similarity space
        )
        logger.info(f"ChromaDB collection loaded. Count: {self.collection.count()} vectors.")

    def add_documents(self, documents: List[Dict[str, Any]], source_name: str) -> int:
        """
        Adds normalized trade documents to the database.
        Each doc should have: Term, Definition, Created By, Used By, Purpose, Common Problems.
        """
        ids = []
        texts = []
        metadatas = []
        
        for doc in documents:
            term = doc.get("Term", "").strip()
            definition = doc.get("Definition", "").strip()
            created_by = doc.get("Created By", "").strip()
            used_by = doc.get("Used By", "").strip()
            purpose = doc.get("Purpose", "").strip()
            common_problems = doc.get("Common Problems", "").strip()
            
            if not term or not definition:
                continue
                
            # Create a unique document identifier
            doc_id = f"term_{term.lower().replace(' ', '_').replace('/', '_')}"
            ids.append(doc_id)
            
            # Form indexing document content representing the semantic context
            doc_content = (
                f"Term: {term}\n"
                f"Definition: {definition}\n"
                f"Created By: {created_by}\n"
                f"Used By: {used_by}\n"
                f"Purpose: {purpose}\n"
                f"Common Problems: {common_problems}"
            )
            texts.append(doc_content)
            
            metadatas.append({
                "term": term,
                "definition": definition,
                "created_by": created_by,
                "used_by": used_by,
                "purpose": purpose,
                "common_problems": common_problems,
                "source": source_name
            })
            
        if ids:
            self.collection.upsert(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            logger.info(f"Ingested {len(ids)} items from '{source_name}' into ChromaDB.")
        return len(ids)

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB using the similarity query text.
        """
        if self.collection.count() == 0:
            return []

        # We pass query to Chroma; Chroma will automatically embed it using the bridge
        results = self.collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        output = []
        if results and results.get("ids") and len(results["ids"][0]) > 0:
            ids = results["ids"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(ids)
            
            for i in range(len(ids)):
                meta = metadatas[i]
                # Chroma cosine distance is (1 - similarity)
                dist = distances[i] if distances[i] is not None else 1.0
                score = 1.0 - dist
                
                output.append({
                    "term": meta.get("term", ""),
                    "definition": meta.get("definition", ""),
                    "created_by": meta.get("created_by", ""),
                    "used_by": meta.get("used_by", ""),
                    "purpose": meta.get("purpose", ""),
                    "common_problems": meta.get("common_problems", ""),
                    "score": score,
                    "doc_id": ids[i]
                })
        return output

    def get_count(self) -> int:
        return self.collection.count()

    def get_all_records(self) -> List[Dict[str, Any]]:
        """
        Returns all metadata currently stored in ChromaDB.
        """
        data = self.collection.get(include=["metadatas"])
        if data and data.get("metadatas"):
            return [m for m in data["metadatas"] if m is not None]
        return []

    def clear(self):
        try:
            self.client.delete_collection("trade_knowledge")
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name="trade_knowledge",
            embedding_function=self.bridge,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("ChromaDB collection cleared.")
