from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "sentinel-ai-api",
        "version": "0.1.0",
    }


def test_root_endpoint_links_to_docs() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"
