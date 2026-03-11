"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Scan, TestTube } from "lucide-react";
import toast from "react-hot-toast";
import { UploadZone } from "@/components/UploadZone";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { UploadType } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FormErrors {
  patientName?: string;
  patientPhone?: string;
  uploadType?: string;
  file?: string;
}

const steps = ["Patient Info", "File Upload", "Confirmation"];

function StepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isComplete = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                  isComplete
                    ? "bg-brand-600 border-brand-600 text-white"
                    : isCurrent
                    ? "bg-white border-brand-600 text-brand-600"
                    : "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isComplete ? <CheckCircle className="w-5 h-5" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium",
                  isCurrent
                    ? "text-brand-600"
                    : isComplete
                    ? "text-brand-500"
                    : "text-gray-400"
                )}
              >
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-16 mx-2 mb-4 transition-all",
                  currentStep > stepNum ? "bg-brand-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>("xray");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!patientName.trim() || patientName.trim().length < 2) {
      newErrors.patientName = "Patient name must be at least 2 characters.";
    }
    const phonePattern = /^03[0-9]{9}$/;
    if (!phonePattern.test(patientPhone)) {
      newErrors.patientPhone =
        "Phone number must be in format 03XXXXXXXXX (11 digits).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext1 = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleFileSelected = (f: File) => {
    setFile(f);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleUpload = async () => {
    if (!file) {
      setErrors((prev) => ({ ...prev, file: "Please select a file first." }));
      return;
    }
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStep(3);

    try {
      const supabase = createClient();

      // 1. Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 2. Upload to Supabase Storage
      const ext = file.name.split(".").pop();
      const uuid = crypto.randomUUID();
      const storagePath = `${user.org_id}/${uploadType}/${uuid}.${ext}`;

      setUploadProgress(20);

      const { error: storageError } = await supabase.storage
        .from("medical_scans")
        .upload(storagePath, file);

      if (storageError) throw storageError;
      setUploadProgress(50);

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from("medical_scans")
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;
      setUploadProgress(65);

      // 4. POST to backend
      const res = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          patient_name: patientName,
          patient_phone: patientPhone,
          upload_type: uploadType,
          file_url: fileUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? "Failed to create report");
      }

      setUploadProgress(100);
      const data = await res.json();
      setReportId(data.id);
      setUploadSuccess(true);
      toast.success("Report uploaded successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      setCurrentStep(2);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setPatientName("");
    setPatientPhone("");
    setUploadType("xray");
    setFile(null);
    setErrors({});
    setCurrentStep(1);
    setIsUploading(false);
    setUploadProgress(0);
    setReportId(null);
    setUploadSuccess(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <StepIndicator currentStep={currentStep} />

        {/* Step 1: Patient Info */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-surface-border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Patient Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  setErrors((prev) => ({ ...prev, patientName: undefined }));
                }}
                className={cn(
                  "w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500",
                  errors.patientName ? "border-red-400" : "border-gray-300"
                )}
                placeholder="Enter patient full name"
              />
              {errors.patientName && (
                <p className="text-xs text-red-500 mt-1">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => {
                  setPatientPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, patientPhone: undefined }));
                }}
                className={cn(
                  "w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500",
                  errors.patientPhone ? "border-red-400" : "border-gray-300"
                )}
                placeholder="03XXXXXXXXX"
              />
              {errors.patientPhone && (
                <p className="text-xs text-red-500 mt-1">{errors.patientPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadType("xray")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium",
                    uploadType === "xray"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <Scan className="w-6 h-6" />
                  X-Ray / Medical Scan
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("lab")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium",
                    uploadType === "lab"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <TestTube className="w-6 h-6" />
                  Lab Report
                </button>
              </div>
            </div>

            <button
              onClick={handleNext1}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: File Upload */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl border border-surface-border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Upload File
            </h2>
            <p className="text-sm text-gray-500">
              Upload a{" "}
              <span className="font-medium">
                {uploadType === "xray" ? "X-ray / medical scan image" : "lab report"}
              </span>{" "}
              for{" "}
              <span className="font-medium">{patientName}</span>.
            </p>

            <UploadZone
              uploadType={uploadType}
              onFileSelected={handleFileSelected}
              isUploading={false}
              uploadProgress={0}
            />

            {errors.file && (
              <p className="text-xs text-red-500">{errors.file}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleUpload}
                disabled={!file}
                className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Report
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border border-surface-border p-6 text-center space-y-5">
            {!uploadSuccess ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">
                  Uploading...
                </h2>
                <UploadZone
                  uploadType={uploadType}
                  onFileSelected={() => {}}
                  isUploading={true}
                  uploadProgress={uploadProgress}
                />
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Upload Successful!
                  </h2>
                  {reportId && (
                    <p className="text-sm text-gray-500">
                      Report ID:{" "}
                      <span className="font-mono text-brand-700">
                        {reportId.slice(0, 8).toUpperCase()}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  The AI is now processing the report. You&apos;ll be notified
                  when it&apos;s ready for doctor review.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                  >
                    View Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
