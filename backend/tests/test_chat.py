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


def test_chat_returns_response(client):
    response = client.post(
        "/api/chat",
        json={
            "question": "What is FOB?"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "answer" in data
    assert "sources" in data
    assert "confidence" in data
    assert "related_topics" in data

    assert isinstance(data["answer"], str)
    assert isinstance(data["sources"], list)
    assert isinstance(data["related_topics"], list)

    assert len(data["sources"]) > 0


def test_chat_comparison(client):
    response = client.post(
        "/api/chat",
        json={
            "question": "Compare FOB vs CIF"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "|" in data["answer"]
    assert "Responsibility" in data["answer"]


def test_unknown_query(client):
    response = client.post(
        "/api/chat",
        json={
            "question": "asdkjashdkjasdhkjashdkjashdkjashd"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "answer" in data
    assert "confidence" in data


def test_analytics_endpoint(client):
    response = client.get("/api/analytics")

    assert response.status_code == 200

    data = response.json()

    assert "total_questions" in data