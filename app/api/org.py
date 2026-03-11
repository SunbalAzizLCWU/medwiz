from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user, require_role
from app.db.supabase_client import supabase
from app.models.schemas import CreateOrgRequest, OrgResponse

router = APIRouter(prefix="", tags=["org"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_org(
    body: CreateOrgRequest,
    current_user: dict = Depends(require_role("superadmin")),
):
    """Create a new organization (superadmin only)."""
    result = supabase.table("organizations").insert(body.model_dump()).execute()
    return OrgResponse(**result.data[0])


@router.get("/{org_id}/dashboard")
async def get_dashboard(
    org_id: str,
    current_user: dict = Depends(
        require_role("clinic_admin", "clinic_worker", "doctor")
    ),
):
    """Return aggregated stats for an organization."""
    if current_user.get("org_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()

    # Total reports today
    total_today = (
        supabase.table("reports")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .gte("created_at", today_start)
        .execute()
    )

    # Pending AI processing
    pending_ai = (
        supabase.table("reports")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .in_("status", ["uploading", "processing"])
        .execute()
    )

    # Awaiting doctor review
    awaiting_doctor = (
        supabase.table("reports")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .eq("status", "awaiting_doctor")
        .execute()
    )

    # Reviewed today
    reviewed_today = (
        supabase.table("reports")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .eq("status", "reviewed")
        .gte("reviewed_at", today_start)
        .execute()
    )

    # All time
    total_all_time = (
        supabase.table("reports")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .execute()
    )

    return {
        "total_reports_today": total_today.count or 0,
        "pending_ai": pending_ai.count or 0,
        "awaiting_doctor": awaiting_doctor.count or 0,
        "reviewed_today": reviewed_today.count or 0,
        "total_reports_all_time": total_all_time.count or 0,
    }


@router.post("/{org_id}/invite-doctor")
async def invite_doctor(
    org_id: str,
    body: dict,
    current_user: dict = Depends(require_role("clinic_admin")),
):
    """Assign a doctor to an organization."""
    if current_user.get("org_id") != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    doctor_user_id = body.get("doctor_user_id")
    if not doctor_user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="doctor_user_id is required.",
        )

    supabase.table("clinic_doctor_assignments").insert(
        {
            "org_id": org_id,
            "doctor_id": doctor_user_id,
            "is_active": True,
        }
    ).execute()

    return {"success": True}
