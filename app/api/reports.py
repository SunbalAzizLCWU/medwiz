import hashlib
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.dependencies import get_current_user, require_role
from app.db.supabase_client import supabase
from app.models.schemas import (
    ApproveReportRequest,
    CreateReportRequest,
    PublicReportResponse,
    ReportResponse,
)
from app.workers.job_queue import enqueue_report_job

router = APIRouter(prefix="", tags=["reports"])

limiter = Limiter(key_func=get_remote_address)


def _hash_phone(phone: str) -> str:
    return hashlib.sha256(phone.encode()).hexdigest()


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("30/minute")
async def create_report(
    request: Request,
    body: CreateReportRequest,
    current_user: dict = Depends(
        require_role("clinic_worker", "clinic_admin")
    ),
):
    """Create a new report and enqueue AI processing."""
    org_id = current_user.get("org_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no associated organization.",
        )

    phone_hash = _hash_phone(body.patient_phone)

    # Upsert patient record
    existing_patient = (
        supabase.table("patients")
        .select("id")
        .eq("phone_hash", phone_hash)
        .eq("org_id", org_id)
        .execute()
    )
    if existing_patient.data:
        patient_id = existing_patient.data[0]["id"]
    else:
        new_patient = (
            supabase.table("patients")
            .insert(
                {
                    "phone_hash": phone_hash,
                    "patient_name": body.patient_name,  # FIXED
                    "phone_last4": body.patient_phone[-4:],  # FIXED (Added required column)
                    "org_id": org_id,
                }
            )
            .execute()
        )
        patient_id = new_patient.data[0]["id"]

    signed_url_token = str(uuid4())
    report_data = {
        "org_id": org_id,
        "patient_id": patient_id,
        "patient_name": body.patient_name,
        "upload_type": body.upload_type,
        "file_url": body.file_url,
        "status": "uploading",
        "signed_url_token": signed_url_token,
        # FIXED: Removed 'version' as it does not exist in schema.sql
    }

    result = supabase.table("reports").insert(report_data).execute()
    report = result.data[0]
    report_id = report["id"]

    enqueue_report_job(report_id, body.upload_type, body.file_url, org_id)

    # FIXED: Table name is 'audit_logs' and column names mapped to schema
    supabase.table("audit_logs").insert(
        {
            "actor_id": current_user["id"],
            "action": "report_created",
            "entity_type": "report",
            "entity_id": report_id,
            "meta": {"upload_type": body.upload_type},
        }
    ).execute()

    return ReportResponse(**report)


@router.get("/")
async def list_reports(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(
        require_role("clinic_worker", "clinic_admin", "doctor")
    ),
):
    """List reports for the current user's organization."""
    org_id = current_user.get("org_id")
    query = supabase.table("reports").select("*").eq("org_id", org_id)

    if status:
        query = query.eq("status", status)

    if current_user.get("role") == "doctor":
        # Doctors see their assigned reports or unassigned ones
        query = query.or_(
            f"doctor_id.eq.{current_user['id']},doctor_id.is.null"
        )

    query = query.range(offset, offset + limit - 1)
    result = query.execute()
    return [ReportResponse(**r) for r in (result.data or [])]


@router.get("/public/{token}")
async def get_public_report(token: str):
    """Patient-facing public report endpoint (no auth required)."""
    result = (
        supabase.table("reports")
        .select("patient_name,upload_type,ai_findings,doctor_notes,reviewed_at,status")
        .eq("signed_url_token", token)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    report = result.data[0]
    if report.get("status") != "reviewed":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet available.",
        )
    return PublicReportResponse(
        patient_name=report.get("patient_name"),
        upload_type=report["upload_type"],
        ai_findings=report.get("ai_findings"),
        doctor_notes=report.get("doctor_notes"),
        reviewed_at=report.get("reviewed_at"),
    )


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch a single report by ID (must belong to same org)."""
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    report = result.data[0]
    if report.get("org_id") != current_user.get("org_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )
    return ReportResponse(**report)


@router.patch("/{report_id}/approve")
async def approve_report(
    report_id: str,
    body: ApproveReportRequest,
    current_user: dict = Depends(require_role("doctor")),
):
    """Doctor approves/reviews a report."""
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    report = result.data[0]

    if report.get("status") != "awaiting_doctor":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Report is not in 'awaiting_doctor' state.",
        )

    now = datetime.now(timezone.utc).isoformat()
    updated = (
        supabase.table("reports")
        .update(
            {
                "doctor_notes": body.doctor_notes,
                "doctor_id": current_user["id"],
                "status": "reviewed",
                "reviewed_at": now,
                # FIXED: Removed version increment as it's not in schema
            }
        )
        .eq("id", report_id)
        .execute()
    )

    # FIXED: Table name is 'audit_logs' and column names mapped to schema
    supabase.table("audit_logs").insert(
        {
            "actor_id": current_user["id"],
            "action": "report_approved",
            "entity_type": "report",
            "entity_id": report_id,
            "meta": {
                "doctor_id": current_user["id"],
                "timestamp": now,
            },
        }
    ).execute()

    reviewed_report = updated.data[0] if updated.data else report
    return {
        "success": True,
        "signed_url_token": reviewed_report.get("signed_url_token"),
    }
