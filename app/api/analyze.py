from fastapi import APIRouter, Depends, HTTPException, status
from app.db.supabase_client import supabase
from app.core.dependencies import require_role
from app.workers.job_queue import enqueue_report_job

# Re-routing for analysis jobs
router = APIRouter(prefix="", tags=["analyze"])

@router.post("/retry/{report_id}")
async def retry_report(
    report_id: str,
    current_user: dict = Depends(require_role("clinic_admin")),
):
    """Re-enqueue a failed report job."""
    # Fetch report data directly from supabase
    res = supabase.table("reports").select("*").eq("id", report_id).execute()
    
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    
    report_data = res.data[0]

    if report_data.get("status") != "processing_failed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Report is not in 'processing_failed' state.",
        )

    # Reset status and requeue
    supabase.table("reports").update({"status": "uploading"}).eq("id", report_id).execute()

    enqueue_report_job(
        report_id,
        report_data["upload_type"],
        report_data["file_url"],
        report_data["org_id"],
    )

    return {"message": "Job requeued", "report_id": report_id}
