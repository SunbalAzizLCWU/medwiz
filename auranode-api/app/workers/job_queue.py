from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.logging_config import logger

scheduler = AsyncIOScheduler()


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
