"""Tests for the reports API endpoints."""
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _auth_headers():
    return {"Authorization": "Bearer test-token"}


def _mock_user(supabase_mock, user_dict):
    """Configure supabase mock to return the given user on auth check."""
    auth_mock = MagicMock()
    auth_mock.user = MagicMock()
    auth_mock.user.id = user_dict["id"]
    supabase_mock.auth.get_user.return_value = auth_mock

    users_chain = MagicMock()
    users_chain.execute.return_value = MagicMock(data=user_dict)
    (
        supabase_mock.table.return_value
        .select.return_value
        .eq.return_value
        .single.return_value
    ) = users_chain


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_create_report_requires_auth(test_client):
    """POST /api/reports/ without a token should return 403 or 401."""
    response = test_client.post(
        "/api/reports/",
        json={
            "patient_name": "Test Patient",
            "patient_phone": "03001234567",
            "upload_type": "xray",
            "file_url": "https://storage.example.com/xray.jpg",
        },
    )
    assert response.status_code in (401, 403)


def test_create_report_valid_payload(
    test_client, mock_supabase_client, sample_user_dict
):
    """Authenticated clinic_worker can create a report."""
    sample_user_dict["role"] = "clinic_worker"
    _mock_user(mock_supabase_client, sample_user_dict)

    # Mock patient check (no existing patient)
    patient_check = MagicMock()
    patient_check.execute.return_value = MagicMock(data=[])

    # Mock patient insert
    patient_insert = MagicMock()
    patient_insert.execute.return_value = MagicMock(
        data=[{"id": "patient-001"}]
    )

    # Mock report insert
    report_result = MagicMock()
    report_result.execute.return_value = MagicMock(
        data=[
            {
                "id": "report-789",
                "org_id": "org-abc",
                "patient_name": "Jane Doe",
                "patient_id": "patient-001",
                "upload_type": "xray",
                "file_url": "https://storage.example.com/xray.jpg",
                "status": "uploading",
                "ai_findings": None,
                "doctor_notes": None,
                "doctor_id": None,
                "reviewed_at": None,
                "signed_url_token": "token-abc123",
                "created_at": "2026-01-01T10:00:00",
                "version": 1,
            }
        ]
    )

    # Mock audit log insert
    audit_mock = MagicMock()
    audit_mock.execute.return_value = MagicMock(data=[])

    table_mock = mock_supabase_client.table
    table_mock.return_value.select.return_value.eq.return_value.eq.return_value = (
        patient_check
    )
    table_mock.return_value.insert.return_value = report_result

    with patch("app.api.reports.enqueue_report_job") as mock_enqueue:
        response = test_client.post(
            "/api/reports/",
            headers=_auth_headers(),
            json={
                "patient_name": "Jane Doe",
                "patient_phone": "03001234567",
                "upload_type": "xray",
                "file_url": "https://storage.example.com/xray.jpg",
            },
        )

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "uploading"
    assert data["upload_type"] == "xray"
    mock_enqueue.assert_called_once()


def test_get_reports_filters_by_org(
    test_client, mock_supabase_client, sample_user_dict
):
    """List reports returns only reports for the user's org."""
    _mock_user(mock_supabase_client, sample_user_dict)

    reports_data = [
        {
            "id": "r1",
            "org_id": "org-abc",
            "patient_name": "Alice",
            "upload_type": "lab",
            "file_url": "https://x.com/lab.jpg",
            "status": "reviewed",
            "ai_findings": None,
            "doctor_notes": "All normal.",
            "doctor_id": "doc-456",
            "reviewed_at": "2026-01-02T12:00:00",
            "signed_url_token": "tok1",
            "created_at": "2026-01-01T10:00:00",
            "version": 2,
        }
    ]
    list_mock = MagicMock()
    list_mock.execute.return_value = MagicMock(data=reports_data)
    (
        mock_supabase_client.table.return_value
        .select.return_value
        .eq.return_value
        .range.return_value
    ) = list_mock

    response = test_client.get("/api/reports/", headers=_auth_headers())
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["org_id"] == "org-abc"


def test_approve_report_requires_doctor_role(
    test_client, mock_supabase_client, sample_user_dict
):
    """Non-doctor user cannot approve reports."""
    sample_user_dict["role"] = "clinic_worker"
    _mock_user(mock_supabase_client, sample_user_dict)

    response = test_client.patch(
        "/api/reports/report-789/approve",
        headers=_auth_headers(),
        json={"doctor_notes": "Looks fine."},
    )
    assert response.status_code == 403


def test_public_token_returns_reviewed_report_only(
    test_client, mock_supabase_client, sample_report_dict
):
    """Public token endpoint returns 404 for non-reviewed reports."""
    # Non-reviewed report
    pending_report = {**sample_report_dict, "status": "awaiting_doctor"}
    token_mock = MagicMock()
    token_mock.execute.return_value = MagicMock(data=[pending_report])
    (
        mock_supabase_client.table.return_value
        .select.return_value
        .eq.return_value
    ) = token_mock

    response = test_client.get("/api/reports/public/token-abc123")
    assert response.status_code == 404

    # Reviewed report
    reviewed_report = {
        **sample_report_dict,
        "status": "reviewed",
        "doctor_notes": "Normal findings.",
        "reviewed_at": "2026-01-02T12:00:00",
    }
    token_mock.execute.return_value = MagicMock(data=[reviewed_report])

    response = test_client.get("/api/reports/public/token-abc123")
    assert response.status_code == 200
    data = response.json()
    assert "patient_name" in data
    assert "ai_findings" in data
    assert "doctor_notes" in data
    # Internal fields must NOT be present
    assert "file_url" not in data
    assert "id" not in data
