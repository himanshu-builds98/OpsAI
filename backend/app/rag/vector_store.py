import re
import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from app.config import settings
from app.rag.embeddings import BGEEmbeddings

logger = logging.getLogger("uvicorn.error")

class VectorStoreManager:
    def __init__(self, embedding_service: BGEEmbeddings):
        self.embedding_service = embedding_service
        self.client = MongoClient(settings.MONGODB_URL)
        self.db = self.client[settings.MONGODB_DB_NAME]
        self.collection = self.db["trade_knowledge"]
        logger.info(f"MongoDB Atlas connected. Count: {self.get_count()} records.")

    def add_documents(self, documents: List[Dict[str, Any]], source_name: str) -> int:
        texts, valid_docs = [], []

        for doc in documents:
            term = doc.get("Term", "").strip()
            definition = doc.get("Definition", "").strip()
            if not term or not definition:
                continue

            search_text = f"""
            Term: {term}

            Definition:
            {definition}

            Created By:
            {doc.get("Created By", "")}

            Used By:
            {doc.get("Used By", "")}

            Operational Purpose:
            {doc.get("Purpose", "")}

            Common Problems:
            {doc.get("Common Problems", "")}
            """.strip()

            texts.append(search_text)
            valid_docs.append(doc)

        if not valid_docs:
            return 0

        embeddings = self.embedding_service.embed_documents(texts)

        for doc, embedding in zip(valid_docs, embeddings):
            term = doc["Term"].strip()
            doc_id = f"term_{term.lower().replace(' ', '_').replace('/', '_')}"
            self.collection.update_one(
                {"doc_id": doc_id},
                {"$set": {
                    "doc_id": doc_id,
                    "term": term,
                    "definition": doc.get("Definition", ""),
                    "created_by": doc.get("Created By", ""),
                    "used_by": doc.get("Used By", ""),
                    "purpose": doc.get("Purpose", ""),
                    "common_problems": doc.get("Common Problems", ""),
                    "source": source_name,
                    "embedding": embedding,
                    "aliases": doc.get("Aliases", []),
                    "keywords": doc.get("Keywords", []),
                }},
                upsert=True
            )

        logger.info(f"Ingested {len(valid_docs)} items from '{source_name}' into Atlas.")
        return len(valid_docs)

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        if self.get_count() == 0:
            return []

        query_embedding = self.embedding_service.embed_query(query)

        results = self.collection.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": max(limit * 20, 100),
                    "limit": limit
                }
            },
            {
                "$project": {
                    "term": 1, "definition": 1, "created_by": 1,
                    "used_by": 1, "purpose": 1, "common_problems": 1,
                    "aliases": 1, "keywords": 1,
                }
            },
            {"$match": {"score": {"$gte": settings.SIMILARITY_THRESHOLD}}}
        ])

        return [{
            "term": r.get("term", ""),
            "definition": r.get("definition", ""),
            "created_by": r.get("created_by", ""),
            "used_by": r.get("used_by", ""),
            "purpose": r.get("purpose", ""),
            "common_problems": r.get("common_problems", ""),
            "score": r.get("score", 0.0),
            "doc_id": r.get("doc_id", ""),
            "aliases": r.get("aliases", []),
            "keywords": r.get("keywords", []),
        } for r in results]

    def search_exact_term(self, term: str) -> Optional[Dict[str, Any]]:
        doc = self.collection.find_one(
            {
                "term": {
                    "$regex": f"^{re.escape(term.strip())}$",
                    "$options": "i",
                }
            },
            {"embedding": 0},
        )
        if doc:
            return {
                "term": doc["term"],
                "definition": doc["definition"],
                "created_by": doc.get("created_by", ""),
                "used_by": doc.get("used_by", ""),
                "purpose": doc.get("purpose", ""),
                "common_problems": doc.get("common_problems", ""),
                "score": 1.0,
                "doc_id": doc.get("doc_id", "")
            }
        return None

    def get_count(self) -> int:
        return self.collection.count_documents({})

    def get_all_records(self) -> List[Dict[str, Any]]:
        return list(self.collection.find({}, {"embedding": 0, "_id": 0}))

    def clear(self):
        self.collection.delete_many({})
        logger.info("Atlas collection cleared.")