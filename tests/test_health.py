"""Tests for the health endpoint."""


def test_health_endpoint(test_client):
    response = test_client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "AuraNode API"
    assert "timestamp" in data
    assert "environment" in data
