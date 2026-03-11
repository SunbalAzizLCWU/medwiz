"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import type { UploadType } from "@/types";

interface Props {
  uploadType: UploadType;
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  selectedFile?: File | null;
  onRemoveFile?: () => void;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const acceptMap: Record<UploadType, Record<string, string[]>> = {
  xray: {
    "image/jpeg": [],
    "image/png": [],
  },
  lab: {
    "image/jpeg": [],
    "image/png": [],
    "application/pdf": [],
  },
};

const formatLabels: Record<UploadType, string> = {
  xray: "JPEG, PNG (max 10 MB)",
  lab: "JPEG, PNG, PDF (max 10 MB)",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({
  uploadType,
  onFileSelected,
  isUploading,
  uploadProgress,
  selectedFile,
  onRemoveFile,
}: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFileSelected(accepted[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: acceptMap[uploadType],
      maxSize: MAX_SIZE_BYTES,
      maxFiles: 1,
      disabled: isUploading,
    });

  const rejectionError =
    fileRejections.length > 0
      ? fileRejections[0].errors
          .map((e) =>
            e.code === "file-too-large"
              ? "File is too large (max 10 MB)"
              : e.code === "file-invalid-type"
              ? "Invalid file format"
              : e.message
          )
          .join(", ")
      : null;

  // Uploading state
  if (isUploading) {
    return (
      <div className="border-2 border-brand-300 rounded-xl p-8 bg-brand-50 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-brand-700 font-medium">
          <svg
            className="animate-spin w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Uploading… {uploadProgress}%
        </div>
        <div className="w-full bg-brand-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // File selected state
  if (selectedFile && !isUploading) {
    return (
      <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
            <FileIcon className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="font-medium text-green-800 truncate max-w-[200px] sm:max-w-xs">
              {selectedFile.name}
            </p>
            <p className="text-xs text-green-600">
              {formatBytes(selectedFile.size)} ·{" "}
              {selectedFile.type || "Unknown type"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          {onRemoveFile && (
            <button
              type="button"
              onClick={onRemoveFile}
              className="p-1.5 rounded-lg hover:bg-green-200 text-green-700 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (rejectionError) {
    return (
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-red-400 rounded-xl p-8 bg-red-50 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-red-700">{rejectionError}</p>
        <p className="text-xs text-red-500 mt-1">Click to try again</p>
      </div>
    );
  }

  // Idle state
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-brand-500 bg-brand-50"
          : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud
        className={`w-12 h-12 mx-auto mb-3 ${
          isDragActive ? "text-brand-600" : "text-slate-400"
        }`}
      />
      {isDragActive ? (
        <p className="text-brand-700 font-medium">Drop your file here</p>
      ) : (
        <>
          <p className="text-slate-700 font-medium">
            Drop your file here{" "}
            <span className="text-brand-600">or click to browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Accepted formats: {formatLabels[uploadType]}
          </p>
        </>
      )}
    </div>
  );
}
