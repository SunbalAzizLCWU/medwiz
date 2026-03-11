from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import require_role
from app.db.supabase_client import supabase
from app.workers.job_queue import enqueue_report_job

router = APIRouter(prefix="", tags=["analyze"])


@router.post("/retry/{report_id}")
async def retry_report(
    report_id: str,
    current_user: dict = Depends(require_role("clinic_admin")),
):
    """Re-enqueue a failed report job."""
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

    if report.get("status") != "processing_failed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Report is not in 'processing_failed' state.",
        )

    supabase.table("reports").update({"status": "uploading"}).eq(
        "id", report_id
    ).execute()

    enqueue_report_job(
        report_id,
        report["upload_type"],
        report["file_url"],
        report["org_id"],
    )

    return {"message": "Job requeued", "report_id": report_id}
