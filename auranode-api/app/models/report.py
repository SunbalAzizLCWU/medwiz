from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UploadType(str, Enum):
    XRAY = "xray"
    LAB = "lab"


class ReportStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    AWAITING_DOCTOR = "awaiting_doctor"
    REVIEWED = "reviewed"
    DELIVERED = "delivered"
    PROCESSING_FAILED = "processing_failed"


class AIFinding(BaseModel):
    marker: str
    value: float | str
    unit: str = ""
    status: Literal["LOW", "NORMAL", "HIGH", "N/A"] = "N/A"


class XRayFinding(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    prediction: Literal["Normal", "Abnormal"]
    confidence: float
    model_version: str


class CreateReportRequest(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=100)
    patient_phone: str = Field(..., pattern=r"^03[0-9]{9}$")
    upload_type: UploadType
    file_url: str = Field(..., min_length=10)


class ApproveReportRequest(BaseModel):
    doctor_notes: str = Field(..., min_length=5, max_length=2000)


class ReportResponse(BaseModel):
    id: str
    patient_name: str
    upload_type: str
    status: str
    ai_findings: dict | list | None
    doctor_notes: str | None
    created_at: str
    reviewed_at: str | None
    signed_url_token: str | None
