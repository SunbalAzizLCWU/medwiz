import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "mock_key")
os.environ.setdefault("GROQ_API_KEY", "mock_key")
os.environ.setdefault("ONNX_MODEL_URL", "https://mock.url/model.onnx")
os.environ.setdefault("JWT_SECRET", "mock_secret_32_chars_minimum_here")
os.environ.setdefault("ENVIRONMENT", "test")


@pytest.fixture(scope="session")
def mock_supabase_client():
    mock = MagicMock()
    with patch("app.db.supabase_client.get_supabase", return_value=mock), patch(
        "app.db.supabase_client.create_client", return_value=mock
    ):
        yield mock


@pytest.fixture(scope="session")
def client(mock_supabase_client):
    from app.main import app

    with TestClient(app) as c:
        yield c
