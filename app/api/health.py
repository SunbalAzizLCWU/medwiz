from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.api_route("/", methods=["GET", "HEAD"])
async def health_check():
    return {
        "status": "ok",
        "service": "AuraNode API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }
