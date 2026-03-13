"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase"; // adjust this import to match your actual supabase client path!
import { ArrowLeft, FileText, Activity, User, AlertCircle, Calendar, CheckCircle } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      if (!params.id) return;
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Supabase Error:", error);
      }

      if (!error && data) {
        setReport(data);
      }
      setIsLoading(false);
    }
    fetchReport();
  }, [params.id]);

  // THE MAGIC SUBMIT BUTTON FUNCTION
  const handleApprove = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from("reports")
      .update({ status: "reviewed" })
      .eq("id", report.id);

    setIsSubmitting(false);
    
    if (!error) {
      // Send them back to the dashboard when finished
      router.push("/dashboard");
    } else {
      alert("Failed to update status. Check console.");
    }
  };

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
        <button onClick={() => router.back()} className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const isPDF = report.file_url?.toLowerCase().includes('.pdf');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
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
        {/* Left Column: File & Patient info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-3">
              Patient Profile
            </h3>
            <p className="font-semibold text-slate-900">{report.patient_name || "Unknown Patient"}</p>
            <p className="text-sm text-slate-500 mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-3">
              Source File
            </h3>
            <div className="bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {report.file_url ? (
                isPDF ? (
                  <iframe src={report.file_url} className="w-full h-[400px]" title="PDF Report" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={report.file_url} alt="Scan" className="object-cover w-full h-full" />
                )
              ) : (
                <p className="text-slate-400 py-20 text-sm font-medium">No file provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic AI Analysis */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6 border-b pb-3">
              <Activity className="w-4 h-4 text-brand-600" /> Diagnostic AI Output
            </h3>
            
            <div className="flex-1">
              {report.status === "failed" ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">AI processing failed.</div>
              ) : report.ai_findings ? (
                
                // --- DYNAMIC RENDERING ---
                report.ai_findings.type === "lab" ? (
                  // LAB REPORT UI
                  <div className="space-y-4">
                    
                    {/* NEW: AI Clinical Assessment Box */}
                    {(report.ai_findings.prediction || report.ai_findings.summary) && (
                      <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
                           <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                             <Activity className="w-4 h-4" /> AI Clinical Assessment
                           </h4>
                           {report.ai_findings.confidence && (
                             <span className="text-[10px] font-bold text-blue-800 bg-blue-200/50 px-2 py-1 rounded uppercase tracking-wider">
                               {typeof report.ai_findings.confidence === 'number' 
                                 ? `${(report.ai_findings.confidence * 100).toFixed(0)}% Confidence` 
                                 : report.ai_findings.confidence}
                             </span>
                           )}
                        </div>
                        <div className="space-y-2">
                          {report.ai_findings.prediction && (
                            <p className="text-sm text-blue-900">
                              <span className="font-bold uppercase text-[11px] tracking-wider text-blue-700 mr-2">Probable Diagnosis:</span> 
                              <span className="font-semibold text-lg">{report.ai_findings.prediction}</span>
                            </p>
                          )}
                          {report.ai_findings.summary && (
                            <p className="text-sm text-blue-800 leading-relaxed font-medium">
                              {report.ai_findings.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-slate-500 mb-4 font-medium">Extracted Biomarkers:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {report.ai_findings.findings?.map((item: any, idx: number) => {
                        const isAbnormal = item.status !== "NORMAL";
                        return (
                          <div key={idx} className={`p-3 rounded-lg border ${isAbnormal ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-100'}`}>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">{item.marker}</p>
                            <div className="flex justify-between items-end mt-1">
                              <p className={`text-xl font-black ${isAbnormal ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {item.value} <span className="text-xs font-medium text-slate-500 ml-1">{item.unit}</span>
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isAbnormal ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // X-RAY REPORT UI
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">AI Prediction</p>
                        <p className={`text-xl font-black ${report.ai_findings.prediction === 'Abnormal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {report.ai_findings.prediction || "Unknown"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Confidence</p>
                        <p className="text-xl font-black text-slate-800">
                          {report.ai_findings.confidence ? `${(report.ai_findings.confidence * 100).toFixed(1)}%` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100 mt-4">
                       <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-2">Clinical Summary</p>
                       <p className="text-sm text-slate-700 leading-relaxed font-medium">
                         {report.ai_findings.summary || "No summary provided."}
                       </p>
                    </div>
                  </div>
                )

              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400 italic">Analysis pending.</div>
              )}
            </div>

            {/* Submit Button */}
            {report.status === "awaiting_doctor" && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                 <button 
                   onClick={handleApprove}
                   disabled={isSubmitting}
                   className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-bold text-sm rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                 >
                   {isSubmitting ? "Approving..." : <><CheckCircle className="w-4 h-4" /> Submit Clinical Review</>}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
