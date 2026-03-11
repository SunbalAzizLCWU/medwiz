import logging

from app.db.supabase_client import supabase


class NotificationService:
    async def send(
        self,
        user_id: str,
        report_id: str,
        type: str,
        message: str,
    ):
        """Insert a notification record into Supabase."""
        try:
            supabase.table("notifications").insert(
                {
                    "user_id": user_id,
                    "report_id": report_id,
                    "type": type,
                    "message": message,
                    "is_read": False,
                }
            ).execute()
        except Exception as e:
            logging.getLogger("auranode.notification").error(
                f"Failed to send notification: {e}"
            )


notification_service = NotificationService()
