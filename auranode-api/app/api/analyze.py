import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.supabase_client import get_supabase
from app.models.report import ReportStatus
from app.services.groq_service import summarize_lab_findings
from app.services.ocr_service import extract_lab_values
from app.services.xray_inference import run_xray_inference

router = APIRouter(tags=["analyze"])


class AnalyzeRequest(BaseModel):
    report_id: str


@router.post("/xray")
async def analyze_xray(
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", body.report_id)
        .eq("org_id", current_user["org_id"])
        .single()
        .execute()
    )
    report = result.data
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.get("upload_type") != "xray":
        raise HTTPException(status_code=400, detail="Report is not an X-ray upload")

    supabase.table("reports").update(
        {"status": ReportStatus.PROCESSING.value}
    ).eq("id", body.report_id).execute()

    background_tasks.add_task(_process_xray, body.report_id, report["file_url"])
    return {"message": "X-ray analysis queued", "report_id": body.report_id}


@router.post("/lab")
async def analyze_lab(
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", body.report_id)
        .eq("org_id", current_user["org_id"])
        .single()
        .execute()
    )
    report = result.data
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.get("upload_type") != "lab":
        raise HTTPException(status_code=400, detail="Report is not a lab upload")

    supabase.table("reports").update(
        {"status": ReportStatus.PROCESSING.value}
    ).eq("id", body.report_id).execute()

    background_tasks.add_task(_process_lab, body.report_id, report["file_url"])
    return {"message": "Lab analysis queued", "report_id": body.report_id}


async def _process_xray(report_id: str, file_url: str) -> None:
    supabase = get_supabase()
    try:
        loop = asyncio.get_event_loop()
        finding = await loop.run_in_executor(None, run_xray_inference, file_url)
        supabase.table("reports").update(
            {
                "status": ReportStatus.AWAITING_DOCTOR.value,
                "ai_findings": finding.model_dump(),
            }
        ).eq("id", report_id).execute()
    except Exception:
        supabase.table("reports").update(
            {"status": ReportStatus.PROCESSING_FAILED.value}
        ).eq("id", report_id).execute()
        raise


async def _process_lab(report_id: str, file_url: str) -> None:
    supabase = get_supabase()
    try:
        loop = asyncio.get_event_loop()
        raw_findings = await loop.run_in_executor(None, extract_lab_values, file_url)
        summary = await summarize_lab_findings(raw_findings)
        supabase.table("reports").update(
            {
                "status": ReportStatus.AWAITING_DOCTOR.value,
                "ai_findings": [f.model_dump() for f in raw_findings],
                "ai_summary": summary,
            }
        ).eq("id", report_id).execute()
    except Exception:
        supabase.table("reports").update(
            {"status": ReportStatus.PROCESSING_FAILED.value}
        ).eq("id", report_id).execute()
        raise
