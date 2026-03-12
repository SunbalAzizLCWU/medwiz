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
  ShieldCheck,
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

// ─── Left Panel: Medical Image Viewer ────────────────────────────────────────

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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <a href={fileUrl} target="_blank" className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
          <ExternalLink className="w-4 h-4" /> Full View
        </a>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl bg-black flex items-center justify-center relative border border-slate-800">
        <div style={{ transform: `scale(${scale})`, transition: "transform 0.2s" }}>
          <Image
            src={fileUrl}
            alt="Patient X-Ray"
            width={800}
            height={800}
            className="object-contain max-h-[70vh]"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel: AI Findings Rendering ─────────────────────────────────────

function XRayFindings({ findings }: { findings: XRayAIFinding }) {
  const isAbnormal = findings.prediction === "Abnormal";
  const confidencePct = Math.round(findings.confidence * 100);

  return (
    <div className="space-y-6">
      <div className={`p-5 rounded-2xl border-2 ${isAbnormal ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isAbnormal ? "bg-red-100" : "bg-green-100"}`}>
            {isAbnormal ? <AlertTriangle className="text-red-600" /> : <ShieldCheck className="text-green-600" />}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isAbnormal ? "text-red-800" : "text-green-800"}`}>
              {findings.prediction} Detected
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {findings.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">AI Confidence</span>
          <span className="text-2xl font-black text-slate-800">{confidencePct}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className={`h-full transition-all duration-1000 ${isAbnormal ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg w-fit border border-slate-100">
        <Stethoscope className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500 font-mono">Engine: AuraNode-ML {findings.model_version}</span>
      </div>
    </div>
  );
}

// ─── Main Review Page ────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string; // Changed from reportId to id to match file structure [id]

  const { report, isLoading, isError, mutate } = useSingleReport(reportId);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (report?.doctor_notes) setDoctorNotes(report.doctor_notes);
  }, [report]);

  const handleSubmit = async () => {
    if (!doctorNotes.trim()) return toast.error("Notes required.");
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctor_notes: doctorNotes, status: "reviewed" }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Report Finalized");
      mutate();
      router.push("/dashboard");
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (isError || !report) return <div className="p-20 text-center">Report Not Found</div>;

  const isReviewed = report.status === "reviewed";

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Toaster />
      
      {/* Header */}
      <header className="h-20 border-b flex items-center justify-between px-8 bg-white z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-xl font-bold text-slate-900">{report.patient_name || "Unknown Patient"}</h1>
               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">X-RAY</span>
            </div>
            <p className="text-xs text-slate-400">ID: {reportId.slice(0,8)} • Uploaded {formatDate(report.created_at)}</p>
          </div>
        </div>
        {isReviewed && <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-sm"><CheckCircle2 size={18}/> Reviewed</div>}
      </header>

      {/* Main Split Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Visualization */}
        <section className="flex-1 bg-slate-900 p-8 flex flex-col">
          <XRayViewer fileUrl={report.file_url} />
        </section>

        {/* Right: Insights & Input */}
        <aside className="w-[450px] border-l overflow-y-auto p-8 bg-white custom-scrollbar">
          <div className="space-y-10">
            
            {/* AI Analysis Section */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Diagnostic Analysis</h4>
              {report.ai_findings ? (
                <XRayFindings findings={report.ai_findings as XRayAIFinding} />
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-center">
                  Inference data pending...
                </div>
              )}
            </div>

            {/* Doctor's Notes Section */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Clinical Observations</h4>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                disabled={isReviewed}
                placeholder="Type your final observations here..."
                className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm resize-none"
              />
            </div>

            {/* Submission */}
            {!isReviewed && (
              <button
                onClick={handleSubmit}
                disabled={submitting || !doctorNotes}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
              >
                {submitting ? "Processing..." : "Submit Clinical Review"}
              </button>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
