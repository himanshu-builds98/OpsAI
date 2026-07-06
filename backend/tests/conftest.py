import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app
from app.dependencies import get_rag_pipeline


class MockPipeline:
    def run(self, question: str):
        question_lower = question.lower()

        if "compare" in question_lower or "vs" in question_lower:
            return {
                "answer": (
                    "| Term | Definition | Responsibility |\n"
                    "|------|------------|----------------|\n"
                    "| FOB | Free On Board | Seller |\n"
                    "| CIF | Cost Insurance Freight | Seller + Insurance |"
                ),
                "sources": [
                    {
                        "term": "FOB",
                        "definition": "Free On Board",
                        "created_by": "ICC",
                        "used_by": "Exporters",
                        "purpose": "Shipping",
                        "common_problems": "Risk misunderstanding",
                        "aliases": [],
                        "keywords": [],
                        "score": 0.95,
                    }
                ],
                "confidence": "High",
                "related_topics": ["CIF", "Incoterms"],
            }

        return {
            "answer": (
                "Term: FOB\n\n"
                "Explanation:\n"
                "FOB means Free On Board.\n\n"
                "What is it?\n"
                "A shipping incoterm.\n\n"
                "Created By:\n"
                "ICC\n\n"
                "Used By:\n"
                "Exporters\n\n"
                "Purpose:\n"
                "International trade.\n\n"
                "Common Problems:\n"
                "Risk transfer confusion.\n\n"
                "Operational Tip:\n"
                "Verify delivery point.\n\n"
                "Operational Insight:\n"
                "Clearly define responsibility."
            ),
            "sources": [
                {
                    "term": "FOB",
                    "definition": "Free On Board",
                    "created_by": "ICC",
                    "used_by": "Exporters",
                    "purpose": "Shipping",
                    "common_problems": "Risk misunderstanding",
                    "aliases": [],
                    "keywords": [],
                    "score": 0.95,
                }
            ],
            "confidence": "High",
            "related_topics": ["Bill of Lading", "Incoterms"],
        }


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_rag_pipeline] = lambda: MockPipeline()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c