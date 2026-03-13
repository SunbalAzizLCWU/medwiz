from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.logging_config import logger

scheduler = AsyncIOScheduler()


async def _process_report_job(
    report_id: str, upload_type: str, file_url: str, org_id: str
) -> None:
    from app.db.supabase_client import get_supabase
    from app.models.report import ReportStatus

    supabase = get_supabase()
    logger.info("Processing report %s (type=%s)", report_id, upload_type)
    try:
        if upload_type == "xray":
            from app.services.xray_inference import XRayInferenceService

            service = XRayInferenceService()
            findings = await service.run_inference(file_url)
        else:
            from app.services.ocr_service import OCRService

            ocr = OCRService()
            ocr_text = await ocr.extract_text(file_url)
            from app.services.groq_service import groq_service

            findings = await groq_service.parse_lab_report(ocr_text)

        supabase.table("reports").update(
            {"status": ReportStatus.AWAITING_DOCTOR.value, "ai_findings": findings}
        ).eq("id", report_id).execute()
        logger.info("Report %s processed successfully", report_id)
    except Exception:
        logger.exception("Report %s processing failed", report_id)
        supabase.table("reports").update(
            {"status": ReportStatus.PROCESSING_FAILED.value}
        ).eq("id", report_id).execute()


def enqueue_report_job(
    report_id: str, upload_type: str, file_url: str, org_id: str
) -> None:
    scheduler.add_job(
        _process_report_job,
        args=[report_id, upload_type, file_url, org_id],
        id=f"process_report_{report_id}",
        replace_existing=True,
    )
    logger.info("Enqueued processing job for report %s", report_id)


async def _cleanup_stale_processing_reports() -> None:
    from app.db.supabase_client import get_supabase
    from app.models.report import ReportStatus

    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("id, created_at")
        .eq("status", ReportStatus.PROCESSING.value)
        .execute()
    )
    for report in result.data or []:
        logger.debug("Checked stale report %s", report["id"])


def init_scheduler() -> None:
    scheduler.add_job(
        _cleanup_stale_processing_reports,
        trigger=IntervalTrigger(minutes=30),
        id="cleanup_stale_reports",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started with job: cleanup_stale_reports")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")
