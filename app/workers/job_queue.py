import asyncio
import logging

import httpx
from apscheduler.schedulers.background import BackgroundScheduler

from app.db.supabase_client import supabase
from app.services.groq_service import groq_service
from app.services.notification_service import notification_service
from app.services.ocr_service import ocr_service
from app.services.xray_inference import xray_service

scheduler = BackgroundScheduler()
logger = logging.getLogger("auranode.jobs")


def enqueue_report_job(
    report_id: str, upload_type: str, file_url: str, org_id: str
) -> None:
    """Add a job to the scheduler immediately."""
    if upload_type == "xray":
        scheduler.add_job(
            process_xray_job,
            args=[report_id, file_url, org_id],
            id=f"xray_{report_id}",
            replace_existing=True,
        )
    elif upload_type == "lab":
        scheduler.add_job(
            process_lab_job,
            args=[report_id, file_url, org_id],
            id=f"lab_{report_id}",
            replace_existing=True,
        )


def _notify_doctors(org_id: str, report_id: str, message: str) -> None:
    """Notify all active doctors assigned to an org."""
    doctors = (
        supabase.table("clinic_doctor_assignments")
        .select("doctor_id")
        .eq("org_id", org_id)
        .eq("is_active", True)
        .execute()
    )
    for doc in doctors.data or []:
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(
                notification_service.send(
                    user_id=doc["doctor_id"],
                    report_id=report_id,
                    type="report_ready",
                    message=message,
                )
            )
        finally:
            loop.close()


def process_xray_job(report_id: str, file_url: str, org_id: str) -> None:
    """Download image, run ONNX inference, update Supabase."""
    logger.info(f"Starting X-ray job for report {report_id}")
    try:
        # Update status to processing
        supabase.table("reports").update({"status": "processing"}).eq(
            "id", report_id
        ).execute()

        # Download image bytes
        response = httpx.get(file_url, timeout=30.0)
        response.raise_for_status()
        image_bytes = response.content

        # Run ONNX inference (sync wrapper for async predict)
        loop = asyncio.new_event_loop()
        try:
            finding = loop.run_until_complete(xray_service.predict(image_bytes))
            summary = loop.run_until_complete(
                groq_service.generate_xray_summary(finding)
            )
        finally:
            loop.close()

        ai_findings = {**finding, "summary": summary, "type": "xray"}

        # Update report with findings
        supabase.table("reports").update(
            {"ai_findings": ai_findings, "status": "awaiting_doctor"}
        ).eq("id", report_id).execute()

        _notify_doctors(
            org_id, report_id, "New X-ray report is ready for your review."
        )

        logger.info(f"X-ray job completed for report {report_id}")

    except Exception as e:
        logger.error(f"X-ray job FAILED for {report_id}: {e}")
        supabase.table("reports").update(
            {
                "status": "processing_failed",
                "ai_findings": {"error": str(e), "type": "xray"},
            }
        ).eq("id", report_id).execute()


def process_lab_job(report_id: str, file_url: str, org_id: str) -> None:
    """Download image, run OCR, call Groq, update Supabase."""
    logger.info(f"Starting lab job for report {report_id}")
    try:
        # Update status to processing
        supabase.table("reports").update({"status": "processing"}).eq(
            "id", report_id
        ).execute()

        # Download image bytes
        response = httpx.get(file_url, timeout=30.0)
        response.raise_for_status()
        image_bytes = response.content

        # Run OCR
        ocr_text = ocr_service.extract_text(image_bytes)

        # Call Groq to parse lab markers
        loop = asyncio.new_event_loop()
        try:
            ai_findings = loop.run_until_complete(
                groq_service.parse_lab_report(ocr_text)
            )
        finally:
            loop.close()

        # Update report with findings
        supabase.table("reports").update(
            {"ai_findings": ai_findings, "status": "awaiting_doctor"}
        ).eq("id", report_id).execute()

        _notify_doctors(
            org_id, report_id, "New lab report is ready for review."
        )

        logger.info(f"Lab job completed for report {report_id}")

    except Exception as e:
        logger.error(f"Lab job FAILED for {report_id}: {e}")
        supabase.table("reports").update(
            {
                "status": "processing_failed",
                "ai_findings": {"error": str(e), "type": "lab"},
            }
        ).eq("id", report_id).execute()
