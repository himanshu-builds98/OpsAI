import os
import sys
import pytest
from fastapi.testclient import TestClient

from app.dependencies import (
    get_vector_store,
    get_llm,
    get_rag_pipeline,
    get_analytics_service,
)

from app.rag.pipeline import RAGPipeline

class MockAnalytics:
    def log_query(self, *args, **kwargs):
        pass

mock_pipeline = RAGPipeline(
    retriever=MockRetriever(mock_vs),
    llm=mock_llm,
    analytics_service=MockAnalytics(),
)

app.dependency_overrides[get_rag_pipeline] = lambda: mock_pipeline


# Add backend directory to python path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

# Mock services
class MockVectorStore:
    def __init__(self):
        self.terms = [
            {
                "Term": "FOB",
                "Definition": "Free on Board. The seller delivers when the goods pass the ship's rail.",
                "Created By": "Exporter",
                "Used By": "Importer",
                "Purpose": "To transfer risk and cost from exporter to importer at the port of shipment.",
                "Common Problems": "Disputes on damage during loading."
            },
            {
                "Term": "CIF",
                "Definition": "Cost, Insurance, and Freight. The seller pays for carriage and insurance to destination.",
                "Created By": "Exporter",
                "Used By": "Importer",
                "Purpose": "To bundle freight cost and marine cargo insurance up to the destination port.",
                "Common Problems": "Insurance recovery claims processing delays."
            }
        ]

    def get_status(self):
        return {
            "total_records": len(self.terms),
            "collection_name": "test_collection"
        }

    def search_similarity(self, query, limit=3):
        results = []
        for term in self.terms:
            results.append({
                "term": term["Term"],
                "definition": term["Definition"],
                "created_by": term["Created By"],
                "used_by": term["Used By"],
                "purpose": term["Purpose"],
                "common_problems": term["Common Problems"],
                "score": 0.95
            })
        return results[:limit]

    def add_terms(self, terms, source_name="test.csv"):
        return len(terms)

    def get_all_terms(self):
        return [{"term": t["Term"], "definition": t["Definition"]} for t in self.terms]

class MockLLM:
    def generate(self, prompt, system_prompt=None, model_override=None):
        if "comparison" in prompt.lower() or "comparison mode" in prompt.lower():
            return (
                "| Term | Definition | Responsibility | Risk Transfer | Cost | Best Use Case |\n"
                "|---|---|---|---|---|---|\n"
                "| FOB | Free on Board | Seller loads | Ship's rail | Buyer pays freight | Bulk cargo |\n"
                "| CIF | Cost, Insurance, Freight | Seller pays carriage | Port of shipment | Seller pays freight | Sea transport |"
            )
        elif "detailed" in prompt.lower() or "detailed learning" in prompt.lower():
            return (
                "Term: FOB\n\n"
                "What is it?\n"
                "Free on Board. The seller delivers when the goods pass the ship's rail.\n\n"
                "Created By:\n"
                "Exporter\n\n"
                "Used By:\n"
                "Importer\n\n"
                "Purpose:\n"
                "To transfer risk and cost from exporter to importer at the port of shipment.\n\n"
                "Common Problems:\n"
                "Disputes on damage during loading.\n\n"
                "Operational Insight:\n"
                "Perform clear inspections before loading."
            )
        else:
            return (
                "Term: FOB\n"
                "Explanation: The seller delivers when the goods pass the ship's rail.\n"
                "Used By: Importer\n"
                "Operational Tip: Discharging cost terms should be checked."
            )

    def get_model_name(self):
        return "mock-mistral-7b"

@pytest.fixture
def client():
    # Set environment variables for testing
    os.environ["LLM_PROVIDER"] = "ollama"
    os.environ["EMBEDDING_PROVIDER"] = "local"
    os.environ["TRADE_KNOWLEDGE_CSV"] = "data/trade_knowledge.csv"
    os.environ["CHROMA_PERSIST_DIR"] = "vector_store/chromadb_test"

    from app.main import app
    from app.dependencies import get_vector_store, get_llm, get_rag
    from app.services.rag import RAGPipeline
    
    # Instantiating mocks
    mock_vs = MockVectorStore()
    mock_llm = MockLLM()
    mock_rag = RAGPipeline(mock_vs, mock_llm)

    # Apply FastAPI dependency overrides
    app.dependency_overrides[get_vector_store] = lambda: mock_vs
    app.dependency_overrides[get_llm] = lambda: mock_llm
    app.dependency_overrides[get_rag] = lambda: mock_rag

    with TestClient(app) as test_client:
        yield test_client
        
    # Clear overrides
    app.dependency_overrides.clear()
