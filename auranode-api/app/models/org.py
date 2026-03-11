from pydantic import BaseModel, EmailStr, Field


class CreateOrgRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=5)
    city: str = Field(..., min_length=2)
    contact_email: EmailStr


class OrgResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    contact_email: str
    is_active: bool
    created_at: str
