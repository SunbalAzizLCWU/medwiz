"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, FileText, Activity, User, AlertCircle, Calendar } from "lucide-react";

// Standardizing the badge so we don't rely on external imports
function DetailStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    uploading: "bg-slate-100 text-slate-600 border-slate-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    awaiting_doctor: "bg-yellow-50 text-yellow-700 border-yellow-200",
    reviewed: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    uploading: "Uploading...",
    processing: "AI Processing",
    awaiting_doctor: "Awaiting Doctor",
    reviewed: "Reviewed",
    failed: "Failed",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${styles[status] || styles.failed}`}>
      {labels[status] || "Failed"}
    </span>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      if (!params.id) return;
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("reports")
        .select("*, patient(*)")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setReport(data);
      }
      setIsLoading(false);
    }
    fetchReport();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="w-10 h-10 text-brand-500 animate-bounce mb-4" />
          <p className="text-slate-500 font-medium">Loading medical data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">This report may have been deleted or is unavailable.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-surface-border shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Analysis Details</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {report.id}</p>
          </div>
        </div>
        <DetailStatusBadge status={report.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Info & Image Viewer */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-surface-border shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3">
              <User className="w-4 h-4 text-brand-600" /> Patient Profile
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium">Full Name</p>
                <p className="font-semibold text-slate-900">{report.patient?.name || report.patient_name || "Unknown Patient"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Upload Date</p>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-surface-border shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3">
              <FileText className="w-4 h-4 text-brand-600" /> Source File
            </h3>
            <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative group">
              {report.file_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.file_url} alt="Medical Scan" className="object-cover w-full h-full" />
              ) : (
                <p className="text-slate-400 text-sm font-medium">No image provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Results */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-surface-border shadow-sm h-full">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6 border-b pb-3">
              <Activity className="w-4 h-4 text-brand-600" /> Diagnostic AI Output
            </h3>
            
            {report.status === "failed" ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                The AI inference engine failed to process this document. It may be blurry, unreadable, or corrupted.
              </div>
            ) : report.ai_analysis ? (
              <div className="prose prose-slate max-w-none text-sm">
                {/* Assuming ai_analysis is a text block. If it's JSON, we'd stringify it here */}
                <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {typeof report.ai_analysis === 'string' ? report.ai_analysis : JSON.stringify(report.ai_analysis, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-medium italic">
                Analysis data is currently unavailable or pending.
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-surface-border flex justify-end gap-3">
               <button className="px-5 py-2.5 bg-brand-600 text-white font-bold text-sm rounded-lg hover:bg-brand-700 shadow-sm transition-colors">
                 Submit Clinical Review
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}