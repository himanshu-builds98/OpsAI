import pytest

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "records_indexed" in data

def test_health_api_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_chat_quick_mode(client):
    payload = {
        "question": "What is FOB?",
        "mode": "quick",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "quick"
    assert "Term: FOB" in data["answer"]
    assert "Explanation:" in data["answer"]
    assert "Used By:" in data["answer"]
    assert "Operational Tip:" in data["answer"]
    assert len(data["sources"]) > 0
    assert data["confidence"] == "High"
    assert len(data["related_topics"]) > 0

def test_chat_detailed_mode(client):
    payload = {
        "question": "Give me the details of CIF",
        "mode": "detailed",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "detailed"
    assert "Term: FOB" in data["answer"]  # Returns mock results
    assert "What is it?" in data["answer"]
    assert "Created By:" in data["answer"]
    assert "Used By:" in data["answer"]
    assert "Purpose:" in data["answer"]
    assert "Common Problems:" in data["answer"]
    assert "Operational Insight:" in data["answer"]

def test_chat_comparison_mode(client):
    payload = {
        "question": "Compare FOB vs CIF",
        "mode": "comparison",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "comparison"
    assert "|" in data["answer"]  # Table markdown checks
    assert "Responsibility" in data["answer"]
    assert "Risk Transfer" in data["answer"]

def test_chat_invalid_mode(client):
    payload = {
        "question": "Explain FOB",
        "mode": "ultra-explanation"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 400
    assert "Invalid mode parameter" in response.json()["detail"]

def test_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_questions" in data
    assert "mode_distribution" in data
    assert "popular_terms" in data
    assert "failed_searches_count" in data
    assert "average_response_time" in data
