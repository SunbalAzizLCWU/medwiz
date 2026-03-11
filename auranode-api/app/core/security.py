from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.db.supabase_client import get_supabase

_ALGORITHM = "HS256"


def decode_supabase_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGORITHM])
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(HTTPBearer()),
) -> dict:
    payload = decode_supabase_jwt(credentials.credentials)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    user = result.data
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("is_active", False):
        raise HTTPException(status_code=403, detail="User account is inactive")
    return user


def require_role(*roles: str):
    def _dependency(current_user: dict = Security(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.get('role')}' is not permitted for this action",
            )
        return current_user

    return _dependency
