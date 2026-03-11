from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.supabase_client import get_supabase

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest) -> dict:
    supabase = get_supabase()
    try:
        response = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc

    session = response.session
    if not session:
        raise HTTPException(status_code=401, detail="Authentication failed")

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
