from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user, require_role
from app.db.supabase_client import supabase
from app.workers.job_queue import enqueue_report_job

router = APIRouter(prefix="", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    report_id: str


def _queue_analysis(report_id: str, upload_type: str) -> dict:
    result = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    report = result.data[0]
    enqueue_report_job(report_id, upload_type, report["file_url"], report["org_id"])
    return {"message": f"{upload_type.capitalize()} analysis queued", "report_id": report_id}


@router.post("/xray")
async def analyze_xray(
    body: AnalyzeRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return _queue_analysis(body.report_id, "xray")


@router.post("/lab")
async def analyze_lab(
    body: AnalyzeRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return _queue_analysis(body.report_id, "lab")


@router.post("/retry/{report_id}")
async def retry_report(
    report_id: str,
    current_user: dict = Depends(require_role("clinic_admin")),
):
    result = supabase.table("reports").select("*").eq("id", report_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    report = result.data[0]

    if report.get("status") != "processing_failed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Report is not in 'processing_failed' state.",
        )

    supabase.table("reports").update({"status": "uploading"}).eq("id", report_id).execute()

    enqueue_report_job(
        report_id,
        report["upload_type"],
        report["file_url"],
        report["org_id"],
    )

    return {"message": "Job requeued", "report_id": report_id}
