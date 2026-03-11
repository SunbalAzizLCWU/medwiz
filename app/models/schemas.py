from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth / User models
# ---------------------------------------------------------------------------

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class PMDCVerifyRequest(BaseModel):
    pmdc_number: str


# ---------------------------------------------------------------------------
# Report models
# ---------------------------------------------------------------------------

class CreateReportRequest(BaseModel):
    patient_name: str
    patient_phone: str
    upload_type: str = Field(..., pattern="^(xray|lab)$")
    file_url: str


class ApproveReportRequest(BaseModel):
    doctor_notes: str


class ReportResponse(BaseModel):
    id: str
    org_id: str
    patient_name: Optional[str] = None
    upload_type: str
    file_url: str
    status: str
    ai_findings: Optional[Any] = None
    doctor_notes: Optional[str] = None
    doctor_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    signed_url_token: Optional[str] = None
    created_at: Optional[datetime] = None
    version: int = 1


class PublicReportResponse(BaseModel):
    patient_name: Optional[str] = None
    upload_type: str
    ai_findings: Optional[Any] = None
    doctor_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Organization models
# ---------------------------------------------------------------------------

class CreateOrgRequest(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None


class OrgResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[datetime] = None
