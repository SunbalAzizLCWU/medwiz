"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSingleReport } from "@/hooks/useReports";
import { createClient } from "@/lib/supabase";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { XRayAIFinding, LabAIFindings } from "@/types";
import {
  ArrowLeft,
  Activity,
  FlaskConical,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

// ─── Left Panel sub-components ───────────────────────────────────────────────

function XRayViewer({ fileUrl }: { fileUrl: string }) {
  const [scale, setScale] = useState(1);

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Image not available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            disabled={scale <= 0.5}
            title="Zoom out"
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition-colors text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 min-w-[3.5rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            disabled={scale >= 3}
            title="Zoom in"
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition-colors text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View Full Size
        </a>
      </div>

      {/* Image viewport */}
      <div className="flex-1 overflow-auto rounded-xl bg-black flex items-center justify-center min-h-[360px]">
        <div
          style={{
            transform: `scale(${scale})`,
            transition: "transform 0.2s ease",
            transformOrigin: "center",
          }}
        >
          <Image
            src={fileUrl}
            alt="X-Ray Image"
            width={560}
            height={560}
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

function LabViewer({ fileUrl }: { fileUrl: string }) {
  const looksLikePdf =
    fileUrl.toLowerCase().includes(".pdf") ||
    fileUrl.toLowerCase().includes("/pdf") ||
    fileUrl.includes("content-type=application%2Fpdf");

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>File not available</p>
      </div>
    );
  }

  if (looksLikePdf) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-end mb-3">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open PDF in New Tab
          </a>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 min-h-[360px]">
          <object
            data={`${fileUrl}#toolbar=0&view=FitH`}
            type="application/pdf"
            className="w-full h-full min-h-[360px]"
          >
            <div className="flex flex-col items-center justify-center h-64 bg-slate-800 rounded-xl">
              <FileText className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-slate-400 font-medium">
                PDF Preview Unavailable
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm text-brand-400 hover:underline"
              >
                Open Lab Report PDF
              </a>
            </div>
          </object>
        </div>
      </div>
    );
  }

  // Image-based lab report
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-3">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View Full Size
        </a>
      </div>
      <div className="flex-1 overflow-auto rounded-xl border border-slate-700 flex items-center justify-center min-h-[360px] bg-white">
        <Image
          src={fileUrl}
          alt="Lab Report"
          width={560}
          height={720}
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

// ─── Right Panel sub-components ──────────────────────────────────────────────

function XRayFindings({ findings }: { findings: XRayAIFinding }) {
  const isNormal = findings.prediction === "Normal";
  const confidencePct = Math.round(findings.confidence * 100);

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border ${
          isNormal
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        {isNormal ? (
          <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
        )}
        <div>
          <p
            className={`text-lg font-bold ${
              isNormal ? "text-green-700" : "text-red-700"
            }`}
          >
            {findings.prediction}
          </p>
          <p className="text-sm text-slate-600 mt-0.5">{findings.summary}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">AI Confidence</span>
          <span className="font-semibold text-slate-700">{confidencePct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNormal ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Stethoscope className="w-3.5 h-3.5" />
        Model: {findings.model_version}
      </div>
    </div>
  );
}

function LabFindings({ findings }: { findings: LabAIFindings }) {
  if (findings.status === "manual_review") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-800">
            Manual Review Required
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            {findings.reason ??
              findings.message ??
              "AI could not process this report automatically."}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    HIGH: {
      color: "text-red-600 bg-red-50",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    LOW: {
      color: "text-blue-600 bg-blue-50",
      icon: <TrendingDown className="w-3.5 h-3.5" />,
    },
    NORMAL: {
      color: "text-green-600 bg-green-50",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    "N/A": {
      color: "text-slate-500 bg-slate-50",
      icon: <Minus className="w-3.5 h-3.5" />,
    },
  };

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-surface-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Marker
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Unit
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {findings.findings.map((f, idx) => {
            const config = statusConfig[f.status] ?? statusConfig["N/A"];
            return (
              <tr key={idx} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {f.marker}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {f.value}
                </td>
                <td className="px-4 py-3 text-slate-500">{f.unit}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                  >
                    {config.icon}
                    {f.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;

  const { report, isLoading, isError, mutate } = useSingleReport(reportId);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const notesInitialized = useRef(false);

  // Pre-fill notes when report loads (only once)
  useEffect(() => {
    if (report?.doctor_notes && !notesInitialized.current) {
      setDoctorNotes(report.doctor_notes);
      notesInitialized.current = true;
    }
  }, [report?.doctor_notes]);

  const handleSubmit = useCallback(async () => {
    if (!doctorNotes.trim()) {
      toast.error("Please enter your clinical notes before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_notes: doctorNotes.trim(),
          status: "reviewed",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? "Failed to submit review"
        );
      }

      toast.success("Review submitted successfully!");
      mutate();
      router.push("/doctor");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }, [doctorNotes, reportId, mutate, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm">Loading report…</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-surface">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-lg font-semibold text-slate-700">
          Report not found
        </p>
        <button
          onClick={() => router.push("/doctor")}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </button>
      </div>
    );
  }

  const isAlreadyReviewed = report.status === "reviewed";

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col h-screen bg-surface overflow-hidden">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="bg-white border-b border-surface-border px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => router.push("/doctor")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
            aria-label="Back to queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                report.upload_type === "xray" ? "bg-blue-50" : "bg-purple-50"
              }`}
            >
              {report.upload_type === "xray" ? (
                <Activity className="w-5 h-5 text-blue-600" />
              ) : (
                <FlaskConical className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {report.upload_type === "xray" ? "X-Ray Report" : "Lab Report"}{" "}
                — {report.patient?.name ?? "Unknown Patient"}
              </h1>
              <p className="text-xs text-slate-500">
                Uploaded {formatRelativeTime(report.created_at)}
              </p>
            </div>
          </div>

          {isAlreadyReviewed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              Reviewed
            </span>
          )}
        </div>

        {/* ── Split Screen ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel — Medical Image / Document (45%) */}
          <div className="lg:w-[45%] bg-slate-900 p-6 flex flex-col overflow-y-auto">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Medical Image / Document
            </h2>
            <div className="flex-1">
              {report.upload_type === "xray" ? (
                <XRayViewer fileUrl={report.file_url} />
              ) : (
                <LabViewer fileUrl={report.file_url} />
              )}
            </div>
          </div>

          {/* Right Panel — AI Findings + Notes (55%) */}
          <div className="lg:w-[55%] bg-white overflow-y-auto">
            <div className="p-6 space-y-6 max-w-xl">
              {/* Patient Info */}
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Patient Information
                </h2>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {report.patient?.name ?? "Unknown Patient"}
                      </p>
                      {report.patient?.phone_last4 && (
                        <p className="text-xs text-slate-500">
                          ****{report.patient.phone_last4}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 pl-11">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(report.created_at)}
                  </div>
                </div>
              </section>

              {/* AI Findings */}
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  AI Analysis
                </h2>
                {report.ai_findings === null ? (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <p className="text-sm text-yellow-700">
                      AI analysis not yet available or processing failed.
                    </p>
                  </div>
                ) : report.ai_findings.type === "xray" ? (
                  <XRayFindings findings={report.ai_findings as XRayAIFinding} />
                ) : (
                  <LabFindings findings={report.ai_findings as LabAIFindings} />
                )}
              </section>

              {/* Clinical Notes */}
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Clinical Notes
                  {!isAlreadyReviewed && (
                    <span className="ml-2 text-red-400 normal-case font-normal text-xs tracking-normal">
                      * Required
                    </span>
                  )}
                </h2>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  disabled={isAlreadyReviewed || submitting}
                  placeholder={
                    isAlreadyReviewed
                      ? "Review already submitted."
                      : "Enter your clinical assessment and recommendations…"
                  }
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </section>

              {/* Submit / Reviewed banner */}
              {!isAlreadyReviewed ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !doctorNotes.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Reviewed
                    </>
                  )}
                </button>
              ) : (
                report.reviewed_at && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-4 border border-green-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Reviewed on {formatDate(report.reviewed_at)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
