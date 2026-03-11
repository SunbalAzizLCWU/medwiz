import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "mock_key")
os.environ.setdefault("GROQ_API_KEY", "mock_key")
os.environ.setdefault("ONNX_MODEL_URL", "https://mock.url/model.onnx")
os.environ.setdefault("JWT_SECRET", "mock_secret_32_chars_minimum_here")
os.environ.setdefault("ENVIRONMENT", "test")


def test_list_reports_unauthenticated(client):
    response = client.get("/api/reports")
    assert response.status_code == 403


def test_create_report_unauthenticated(client):
    response = client.post(
        "/api/reports",
        json={
            "patient_name": "Ali Khan",
            "patient_phone": "03001234567",
            "upload_type": "xray",
            "file_url": "https://example.com/file.png",
        },
    )
    assert response.status_code == 403


def test_report_phone_validation(client):
    from pydantic import ValidationError

    from app.models.report import CreateReportRequest

    with pytest.raises(ValidationError):
        CreateReportRequest(
            patient_name="Ali Khan",
            patient_phone="12345",
            upload_type="xray",
            file_url="https://example.com/file.png",
        )


def test_report_patient_name_too_short(client):
    from pydantic import ValidationError

    from app.models.report import CreateReportRequest

    with pytest.raises(ValidationError):
        CreateReportRequest(
            patient_name="A",
            patient_phone="03001234567",
            upload_type="xray",
            file_url="https://example.com/file.png",
        )
