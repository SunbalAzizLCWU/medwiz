import os

os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "mock_key")
os.environ.setdefault("GROQ_API_KEY", "mock_key")
os.environ.setdefault("ONNX_MODEL_URL", "https://mock.url/model.onnx")
os.environ.setdefault("JWT_SECRET", "mock_secret_32_chars_minimum_here")
os.environ.setdefault("ENVIRONMENT", "test")


def test_analyze_xray_unauthenticated(client):
    response = client.post("/api/analyze/xray", json={"report_id": "some-uuid"})
    assert response.status_code == 403


def test_analyze_lab_unauthenticated(client):
    response = client.post("/api/analyze/lab", json={"report_id": "some-uuid"})
    assert response.status_code == 403
