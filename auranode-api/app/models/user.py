from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    CLINIC_ADMIN = "clinic_admin"
    CLINIC_WORKER = "clinic_worker"
    DOCTOR = "doctor"
    SUPERADMIN = "superadmin"


class UserResponse(BaseModel):
    id: str
    org_id: str
    role: UserRole
    full_name: str
    pmdc_number: str | None
    verified: bool
    is_active: bool


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    pmdc_number: str | None = None
