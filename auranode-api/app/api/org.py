from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, require_role
from app.db.supabase_client import get_supabase
from app.models.org import CreateOrgRequest, OrgResponse

router = APIRouter(tags=["org"])


@router.post("", response_model=OrgResponse)
async def create_org(
    body: CreateOrgRequest,
    current_user: dict = Depends(require_role("superadmin")),
) -> OrgResponse:
    supabase = get_supabase()
    result = (
        supabase.table("organizations")
        .insert(
            {
                "name": body.name,
                "address": body.address,
                "city": body.city,
                "contact_email": body.contact_email,
            }
        )
        .execute()
    )
    return _map_org(result.data[0])


@router.get("", response_model=OrgResponse)
async def get_my_org(
    current_user: dict = Depends(get_current_user),
) -> OrgResponse:
    supabase = get_supabase()
    result = (
        supabase.table("organizations")
        .select("*")
        .eq("id", current_user["org_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return _map_org(result.data)


@router.patch("/{org_id}/deactivate", response_model=OrgResponse)
async def deactivate_org(
    org_id: str,
    current_user: dict = Depends(require_role("superadmin")),
) -> OrgResponse:
    supabase = get_supabase()
    result = (
        supabase.table("organizations")
        .update({"is_active": False})
        .eq("id", org_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return _map_org(result.data[0])


def _map_org(o: dict) -> OrgResponse:
    return OrgResponse(
        id=str(o["id"]),
        name=o["name"],
        address=o["address"],
        city=o["city"],
        contact_email=o["contact_email"],
        is_active=o["is_active"],
        created_at=str(o["created_at"]),
    )
