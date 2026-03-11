export type UserRole =
  | "clinic_admin"
  | "clinic_worker"
  | "doctor"
  | "superadmin";

export type UploadType = "xray" | "lab";

export type ReportStatus =
  | "uploading"
  | "processing"
  | "awaiting_doctor"
  | "reviewed"
  | "delivered"
  | "processing_failed";

export interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
  contact_email: string;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  role: UserRole;
  full_name: string;
  pmdc_number: string | null;
  verified: boolean;
  is_active: boolean;
}

export interface Patient {
  id: string;
  org_id: string;
  name: string;
  phone_last4: string;
  created_at: string;
}

export interface AILabFinding {
  marker: string;
  value: number | string;
  unit: string;
  status: "LOW" | "NORMAL" | "HIGH" | "N/A";
}

export interface XRayAIFinding {
  prediction: "Normal" | "Abnormal";
  confidence: number;
  model_version: string;
  summary: string;
  type: "xray";
}

export interface LabAIFindings {
  type: "lab";
  status: "ok" | "manual_review";
  findings: AILabFinding[];
  reason?: string;
  message?: string;
}

export interface Report {
  id: string;
  org_id: string;
  patient_id: string;
  upload_type: UploadType;
  file_url: string;
  signed_url_token: string;
  ai_findings: XRayAIFinding | LabAIFindings | null;
  doctor_notes: string | null;
  status: ReportStatus;
  doctor_id: string | null;
  version: number;
  created_at: string;
  reviewed_at: string | null;
  patient?: Patient;
}

export interface DashboardStats {
  total_reports_today: number;
  pending_ai: number;
  awaiting_doctor: number;
  reviewed_today: number;
  total_reports_all_time: number;
}

export interface Notification {
  id: string;
  user_id: string;
  report_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
