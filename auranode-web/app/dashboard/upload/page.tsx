"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, User, Activity, FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UploadZone } from "@/components/UploadZone";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { UploadType } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Step = 1 | 2 | 3;

interface FieldErrors {
  patientName?: string;
  patientPhone?: string;
}

const steps = [
  { num: 1 as Step, label: "Patient Info" },
  { num: 2 as Step, label: "Upload File" },
  { num: 3 as Step, label: "Confirmation" },
];

function StepIndicator({
  current,
}: {
  current: Step;
}) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const done = current > step.num;
        const active = current === step.num;
        return (
          <div key={step.num} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  done
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  active ? "text-brand-700" : done ? "text-green-600" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>("xray");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReportId, setUploadedReportId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};
    if (!patientName.trim()) {
      errors.patientName = "Patient name is required";
    }
// Pakistani phone format: 03XXXXXXXXX (11 digits starting with 03)
    const phoneRegex = /^03\d{9}$/;
    if (!patientPhone.trim()) {
      errors.patientPhone = "Phone number is required";
    } else if (!phoneRegex.test(patientPhone)) {
      errors.patientPhone = "Must be in format 03XXXXXXXXX";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleRemoveFile = () => setSelectedFile(null);

  // Upload logic
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const supabase = createClient();

      // 1. Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      setUploadProgress(20);

      // 2. Upload to Supabase Storage
      const ext = selectedFile.name.split(".").pop() ?? "bin";
      const uuid = crypto.randomUUID();
      const path = `${user.org_id}/${uploadType}/${uuid}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("medical_scans")
        .upload(path, selectedFile, { contentType: selectedFile.type });

      if (storageError) throw new Error(storageError.message);

      setUploadProgress(60);

      // 3. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("medical_scans").getPublicUrl(path);

      setUploadProgress(75);

      // 4. POST to backend
      const res = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_name: patientName,
          patient_phone: patientPhone,
          upload_type: uploadType,
          file_url: publicUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? "Failed to create report");
      }

      const report = await res.json();
      setUploadProgress(100);
      setUploadedReportId(report.id ?? "N/A");
      setCurrentStep(3);
      toast.success("Report uploaded successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStep2Next = async () => {
    if (!selectedFile) {
      toast.error("Please select a file before continuing.");
      return;
    }
    setCurrentStep(3);
    await handleUpload();
  };

  const handleReset = () => {
    setCurrentStep(1);
    setPatientName("");
    setPatientPhone("");
    setUploadType("xray");
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadedReportId(null);
    setFieldErrors({});
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Report</h1>
      <p className="text-slate-500 mb-6">
        Upload a new medical report for AI analysis
      </p>

      <StepIndicator current={currentStep} />

      {/* Step 1 — Patient Info */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-surface-border p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Patient Information
            </h2>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (fieldErrors.patientName)
                  setFieldErrors((prev) => ({ ...prev, patientName: undefined }));
              }}
              placeholder="e.g. Muhammad Ali Khan"
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500",
                fieldErrors.patientName
                  ? "border-red-400 focus:ring-red-300"
                  : "border-slate-300"
              )}
            />
            {fieldErrors.patientName && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.patientName}
              </p>
            )}
          </div>

          {/* Patient Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Patient Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => {
                setPatientPhone(e.target.value);
                if (fieldErrors.patientPhone)
                  setFieldErrors((prev) => ({
                    ...prev,
                    patientPhone: undefined,
                  }));
              }}
              placeholder="03XXXXXXXXX"
              maxLength={11}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500",
                fieldErrors.patientPhone
                  ? "border-red-400 focus:ring-red-300"
                  : "border-slate-300"
              )}
            />
            {fieldErrors.patientPhone && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.patientPhone}
              </p>
            )}
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  uploadType === "xray"
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="uploadType"
                  value="xray"
                  checked={uploadType === "xray"}
                  onChange={() => setUploadType("xray")}
                  className="sr-only"
                />
                <Activity
                  className={cn(
                    "w-5 h-5 shrink-0",
                    uploadType === "xray" ? "text-brand-600" : "text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    uploadType === "xray" ? "text-brand-700" : "text-slate-600"
                  )}
                >
                  X-Ray / Medical Scan
                </span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  uploadType === "lab"
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="uploadType"
                  value="lab"
                  checked={uploadType === "lab"}
                  onChange={() => setUploadType("lab")}
                  className="sr-only"
                />
                <FlaskConical
                  className={cn(
                    "w-5 h-5 shrink-0",
                    uploadType === "lab" ? "text-purple-600" : "text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    uploadType === "lab" ? "text-purple-700" : "text-slate-600"
                  )}
                >
                  Lab Report
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleStep1Next}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2 — File Upload */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-surface-border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">Upload File</h2>
          <div className="text-sm text-slate-500 flex flex-wrap gap-3">
            <span>
              Patient:{" "}
              <span className="font-medium text-slate-700">{patientName}</span>
            </span>
            <span>
              Type:{" "}
              <span className="font-medium text-slate-700">
                {uploadType === "xray" ? "X-Ray / Scan" : "Lab Report"}
              </span>
            </span>
          </div>

          <UploadZone
            uploadType={uploadType}
            onFileSelected={handleFileSelected}
            isUploading={false}
            uploadProgress={0}
            selectedFile={selectedFile}
            onRemoveFile={handleRemoveFile}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleStep2Next}
              disabled={!selectedFile}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirmation */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-surface-border p-6">
          {isUploading ? (
            <div className="text-center py-10 space-y-4">
              <UploadZone
                uploadType={uploadType}
                onFileSelected={() => {}}
                isUploading={true}
                uploadProgress={uploadProgress}
              />
              <p className="text-slate-500 text-sm">
                Please wait while we upload and process your file…
              </p>
            </div>
          ) : uploadedReportId ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Upload Successful!
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Report ID:{" "}
                  <span className="font-mono text-slate-700">
                    {uploadedReportId.slice(0, 8)}
                  </span>
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  The AI is now processing the report. You will be notified when
                  it is ready for review.
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Upload Another
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Preparing upload…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
