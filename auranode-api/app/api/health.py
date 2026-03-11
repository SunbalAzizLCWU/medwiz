from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("")
async def health_check() -> dict:
    return {"status": "ok", "service": "auranode-api"}
