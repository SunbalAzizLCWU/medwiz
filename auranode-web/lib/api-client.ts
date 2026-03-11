import { createClient } from "@/lib/supabase";
import type {
  DashboardStats,
  Organization,
  Report,
  ReportStatus,
  UploadType,
  User,
} from "@/types";

// In production NEXT_PUBLIC_API_URL must be set to an HTTPS URL.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CreateReportRequest {
  patient_name: string;
  patient_phone: string;
  upload_type: UploadType;
  file_url: string;
}

export interface ApproveReportRequest {
  doctor_notes: string;
}

export interface AnalyzeResponse {
  message: string;
  report_id: string;
}

export interface CreateOrgRequest {
  name: string;
  address: string;
  city: string;
  contact_email: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(detail || `Request failed: ${res.status}`);
  }

  // 204 No Content — return empty object cast to T
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  logout(): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },

  getMe(): Promise<User> {
    return request<User>("/api/auth/me");
  },
};

// ---------------------------------------------------------------------------
// Reports API
// ---------------------------------------------------------------------------

export const reportsApi = {
  create(body: CreateReportRequest): Promise<Report> {
    return request<Report>("/api/reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  list(status?: ReportStatus): Promise<Report[]> {
    const url = new URL(`${API_URL}/api/reports`);
    if (status) url.searchParams.set("status", status);
    // Strip origin so `request` can prepend API_URL again
    const path = url.pathname + url.search;
    return request<Report[]>(path);
  },

  get(reportId: string): Promise<Report> {
    return request<Report>(`/api/reports/${reportId}`);
  },

  approve(reportId: string, body: ApproveReportRequest): Promise<Report> {
    return request<Report>(`/api/reports/${reportId}/approve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};

// ---------------------------------------------------------------------------
// Analyze API
// ---------------------------------------------------------------------------

export const analyzeApi = {
  xray(reportId: string): Promise<AnalyzeResponse> {
    return request<AnalyzeResponse>("/api/analyze/xray", {
      method: "POST",
      body: JSON.stringify({ report_id: reportId }),
    });
  },

  lab(reportId: string): Promise<AnalyzeResponse> {
    return request<AnalyzeResponse>("/api/analyze/lab", {
      method: "POST",
      body: JSON.stringify({ report_id: reportId }),
    });
  },
};

// ---------------------------------------------------------------------------
// Organization API
// ---------------------------------------------------------------------------

export const orgApi = {
  create(body: CreateOrgRequest): Promise<Organization> {
    return request<Organization>("/api/org", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getMy(): Promise<Organization> {
    return request<Organization>("/api/org");
  },

  deactivate(orgId: string): Promise<Organization> {
    return request<Organization>(`/api/org/${orgId}/deactivate`, {
      method: "PATCH",
    });
  },
};

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

export const dashboardApi = {
  getStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/api/dashboard/stats");
  },
};
