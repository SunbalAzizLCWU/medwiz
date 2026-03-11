from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, require_role
from app.db.supabase_client import get_supabase
from app.models.report import (
    ApproveReportRequest,
    CreateReportRequest,
    ReportResponse,
    ReportStatus,
)

router = APIRouter(tags=["reports"])


@router.post("", response_model=ReportResponse)
async def create_report(
    body: CreateReportRequest,
    current_user: dict = Depends(require_role("clinic_admin", "clinic_worker")),
) -> ReportResponse:
    supabase = get_supabase()
    org_id = current_user["org_id"]

    patient_result = (
        supabase.table("patients")
        .upsert(
            {
                "org_id": org_id,
                "patient_name": body.patient_name,
                "phone_last4": body.patient_phone[-4:],
                "phone_hash": _hash_phone(body.patient_phone),
            },
            on_conflict="org_id,phone_hash",
        )
        .execute()
    )
    patient = patient_result.data[0]

    report_result = (
        supabase.table("reports")
        .insert(
            {
                "org_id": org_id,
                "patient_id": patient["id"],
                "patient_name": body.patient_name,
                "upload_type": body.upload_type.value,
                "file_url": body.file_url,
                "status": ReportStatus.UPLOADING.value,
                "created_by": current_user["id"],
            }
        )
        .execute()
    )
    report = report_result.data[0]
    return _map_report(report)


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    current_user: dict = Depends(get_current_user),
) -> list[ReportResponse]:
    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("*")
        .eq("org_id", current_user["org_id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [_map_report(r) for r in result.data]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
) -> ReportResponse:
    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .eq("org_id", current_user["org_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return _map_report(result.data)


@router.patch("/{report_id}/approve", response_model=ReportResponse)
async def approve_report(
    report_id: str,
    body: ApproveReportRequest,
    current_user: dict = Depends(require_role("doctor")),
) -> ReportResponse:
    from datetime import datetime, timezone  # noqa: PLC0415

    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .update(
            {
                "status": ReportStatus.REVIEWED.value,
                "doctor_notes": body.doctor_notes,
                "doctor_id": current_user["id"],
                "reviewed_at": datetime.now(tz=timezone.utc).isoformat(),
            }
        )
        .eq("id", report_id)
        .eq("org_id", current_user["org_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return _map_report(result.data[0])


def _hash_phone(phone: str) -> str:
    import hashlib

    return hashlib.sha256(phone.encode()).hexdigest()


def _map_report(r: dict) -> ReportResponse:
    return ReportResponse(
        id=str(r["id"]),
        patient_name=r["patient_name"],
        upload_type=r["upload_type"],
        status=r["status"],
        ai_findings=r.get("ai_findings"),
        doctor_notes=r.get("doctor_notes"),
        created_at=str(r["created_at"]),
        reviewed_at=str(r["reviewed_at"]) if r.get("reviewed_at") else None,
        signed_url_token=r.get("signed_url_token"),
    )
