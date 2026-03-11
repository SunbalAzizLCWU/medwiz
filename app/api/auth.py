import re

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.dependencies import get_current_user, require_role
from app.db.supabase_client import supabase
from app.models.schemas import PMDCVerifyRequest, UpdateUserRequest

router = APIRouter(prefix="", tags=["auth"])

PMDC_PATTERN = re.compile(r"^PMDC-\d{5}$")


@router.post("/verify-pmdc")
async def verify_pmdc(
    body: PMDCVerifyRequest,
    current_user: dict = Depends(require_role("doctor")),
):
    """Validate and store a doctor's PMDC number."""
    if not PMDC_PATTERN.match(body.pmdc_number):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid PMDC number format. Expected: PMDC-XXXXX (5 digits).",
        )

    supabase.table("users").update(
        {"pmdc_number": body.pmdc_number, "verified": True}
    ).eq("id", current_user["id"]).execute()

    supabase.table("audit_log").insert(
        {
            "user_id": current_user["id"],
            "action": "pmdc_verified",
            "metadata": {"pmdc_number": body.pmdc_number},
        }
    ).execute()

    return {"success": True, "message": "PMDC number verified"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.patch("/me")
async def update_me(
    body: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update allowed fields on the current user's profile."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update.",
        )

    result = (
        supabase.table("users")
        .update(updates)
        .eq("id", current_user["id"])
        .single()
        .execute()
    )
    return result.data
