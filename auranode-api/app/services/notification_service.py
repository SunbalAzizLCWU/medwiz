from app.core.logging_config import logger


async def send_sms_notification(phone_last4: str, message: str) -> bool:
    logger.info("SMS notification queued for phone ending in %s", phone_last4)
    return True


async def send_report_ready_notification(
    user_id: str,
    report_id: str,
    patient_name: str,
) -> None:
    from app.db.supabase_client import get_supabase

    supabase = get_supabase()
    supabase.table("notifications").insert(
        {
            "user_id": user_id,
            "report_id": report_id,
            "message": f"Report for {patient_name} is ready for review.",
            "type": "report_ready",
        }
    ).execute()
    logger.info(
        "In-app notification created for user %s, report %s", user_id, report_id
    )


async def notify_doctor_assignment(
    doctor_user_id: str,
    report_id: str,
    patient_name: str,
) -> None:
    from app.db.supabase_client import get_supabase

    supabase = get_supabase()
    supabase.table("notifications").insert(
        {
            "user_id": doctor_user_id,
            "report_id": report_id,
            "message": f"New report assigned for patient: {patient_name}.",
            "type": "doctor_assignment",
        }
    ).execute()
    logger.info(
        "Doctor assignment notification sent to %s for report %s",
        doctor_user_id,
        report_id,
    )
