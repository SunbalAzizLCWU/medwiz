"""Pytest configuration and shared fixtures."""
import os
import sys
from unittest.mock import MagicMock, patch

# Set required env vars before any app modules are imported so that
# the Supabase client (and other services) can be instantiated without errors.
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("ONNX_MODEL_URL", "https://example.com/model.onnx")

# Mock heavy ML/AI packages that are not available in the test environment.
for _pkg in ("easyocr", "onnxruntime"):
    if _pkg not in sys.modules:
        sys.modules[_pkg] = MagicMock()

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(autouse=True)
def mock_supabase_client():
    """Patch the lazy Supabase getter so no real connection is made."""
    mock = MagicMock()
    with patch("app.db.supabase_client._get_supabase", return_value=mock):
        yield mock


@pytest.fixture()
def mock_settings():
    """Patch settings with safe test values."""
    with patch("app.core.config.settings") as mock_cfg:
        mock_cfg.ENVIRONMENT = "test"
        mock_cfg.GROQ_API_KEY = "test-groq-key"
        mock_cfg.SUPABASE_URL = "https://test.supabase.co"
        mock_cfg.SUPABASE_KEY = "test-key"
        mock_cfg.SUPABASE_SERVICE_ROLE_KEY = "test-service-key"
        mock_cfg.ONNX_MODEL_URL = "https://example.com/model.onnx"
        mock_cfg.MODEL_CACHE_PATH = "/tmp/test_model.onnx"
        mock_cfg.RATE_LIMIT_PER_MINUTE = 30
        yield mock_cfg


@pytest.fixture()
def mock_supabase():
    """Return a fresh MagicMock for supabase usage in tests."""
    return MagicMock()


@pytest.fixture()
def sample_user_dict():
    return {
        "id": "user-123",
        "org_id": "org-abc",
        "role": "clinic_worker",
        "full_name": "Test Worker",
        "email": "worker@clinic.com",
        "verified": False,
    }


@pytest.fixture()
def sample_doctor_dict():
    return {
        "id": "doc-456",
        "org_id": "org-abc",
        "role": "doctor",
        "full_name": "Dr. Smith",
        "email": "doctor@clinic.com",
        "verified": True,
        "pmdc_number": "PMDC-12345",
    }


@pytest.fixture()
def sample_report_dict():
    return {
        "id": "report-789",
        "org_id": "org-abc",
        "patient_name": "Jane Doe",
        "patient_id": "patient-001",
        "upload_type": "xray",
        "file_url": "https://storage.example.com/xray.jpg",
        "status": "awaiting_doctor",
        "ai_findings": {
            "prediction": "Normal",
            "confidence": 0.92,
            "model_version": "v1.0",
            "type": "xray",
        },
        "doctor_notes": None,
        "doctor_id": None,
        "reviewed_at": None,
        "signed_url_token": "token-abc123",
        "created_at": "2026-01-01T10:00:00",
        "version": 1,
    }


@pytest.fixture()
def test_client(mock_supabase_client):
    """TestClient with all external dependencies mocked."""
    # Patch scheduler so APScheduler doesn't start a background thread
    with patch("app.workers.job_queue.scheduler"):
        from app.main import app
        with TestClient(app, raise_server_exceptions=True) as client:
            yield client
