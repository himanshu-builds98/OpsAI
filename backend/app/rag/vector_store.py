import os
import logging
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from app.config import settings
from app.rag.embeddings import BGEEmbeddings
from typing import List, Dict, Any, Optional

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

        self.client = None
        self.collection = None
        
    def _load_collection(self):
        """
        Lazily initializes the ChromaDB client and collection.
        This is only called on the first operation that actually
        needs the vector store.
        """

        if self.collection is not None:
            return

        if settings.CHROMA_SERVER_HOST:

            logger.info(
                f"Connecting to ChromaDB server at "
                f"{settings.CHROMA_SERVER_HOST}:{settings.CHROMA_SERVER_HTTP_PORT}"
            )

            self.client = chromadb.HttpClient(
                host=settings.CHROMA_SERVER_HOST,
                port=settings.CHROMA_SERVER_HTTP_PORT
            )

        else:
            logger.info(
                f"Opening persistent ChromaDB at: {settings.chroma_dir}"
            )

            os.makedirs(settings.chroma_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(
                path=settings.chroma_dir
            )

        self.collection = self.client.get_or_create_collection(
            name="trade_knowledge",
            embedding_function=self.bridge,
            metadata={
                "hnsw:space": "cosine"
            }
        )

        logger.info(
            f"ChromaDB ready. Collection contains "
            f"{self.collection.count()} vectors."
        )
        
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
            searchable_text = " ".join([
                term,
                definition,
                purpose,
                common_problems,
                created_by,
                used_by
            ]).lower()

            doc_content = f"""
            TERM
            {term}

            DEFINITION
            {definition}

            PURPOSE
            {purpose}

            CREATED BY
            {created_by}

            USED BY
            {used_by}

            COMMON PROBLEMS
            {common_problems}

            SEARCHABLE TEXT
            {searchable_text}
            """.strip()
            texts.append(doc_content)
            
            metadatas.append({
                "term": term,
                "definition": definition,
                "created_by": created_by,
                "used_by": used_by,
                "purpose": purpose,
                "common_problems": common_problems,
                "searchable_text": searchable_text,
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

    def search(
        self,
        query: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Semantic vector search.
        """
        self._load_collection()

        if self.collection.count() == 0:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=limit
        )

        output = []

        if (
            results
            and results.get("ids")
            and len(results["ids"][0]) > 0
        ):

            ids = results["ids"][0]

            metadatas = results["metadatas"][0]

            distances = (
                results["distances"][0]
                if "distances" in results
                else [0.0] * len(ids)
            )

            for i in range(len(ids)):
                meta = metadatas[i]
                dist = distances[i] if distances[i] is not None else 1.0
                score = max(0.0, 1.0 - dist)
                output.append({
                    "term": meta.get("term", ""),
                    "aliases": meta.get("aliases", []),
                    "keywords": meta.get("keywords", []),
                    "definition": meta.get("definition", ""),
                    "created_by": meta.get("created_by", ""),
                    "used_by": meta.get("used_by", ""),
                    "purpose": meta.get("purpose", ""),
                    "common_problems": meta.get("common_problems", ""),
                    "score": score,
                    "doc_id": ids[i]
                })

        output.sort(
            key=lambda x: x["score"],
            reverse=True
        )

        return output

    def search_exact_term(self, term: str) -> Optional[Dict[str, Any]]:
        """
        Performs an exact lookup using metadata before falling back
        to vector similarity.

        This is extremely useful for terminology databases where the
        user directly asks about an indexed trade term.
        """
        self._load_collection()

        if self.collection.count() == 0:
            return None

        try:

            data = self.collection.get(
                where={
                    "term": term
                },
                include=["metadatas"]
            )

            if (
                data
                and data.get("metadatas")
                and len(data["metadatas"]) > 0
            ):

                meta = data["metadatas"][0]

                return {
                    "term": meta["term"],
                    "definition": meta["definition"],
                    "created_by": meta["created_by"],
                    "used_by": meta["used_by"],
                    "purpose": meta["purpose"],
                    "common_problems": meta["common_problems"],
                    "score": 1.0,
                    "doc_id": data["ids"][0]
                }

        except Exception:
            pass

        return None

    def get_count(self) -> int:
        return self.collection.count()

    def get_all_records(self) -> List[Dict[str, Any]]:
        """
        Returns all metadata currently stored in ChromaDB.
        """
        self._load_collection()

        data = self.collection.get(include=["metadatas"])
        if data and data.get("metadatas"):
            return [m for m in data["metadatas"] if m is not None]
        return []

    def clear(self):
        self._load_collection()
        
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
