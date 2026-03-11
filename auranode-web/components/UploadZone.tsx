"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { CloudUpload, File, FileImage, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadType } from "@/types";

interface Props {
  uploadType: UploadType;
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

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
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept: Record<string, string[]> =
    uploadType === "xray"
      ? { "image/jpeg": [], "image/png": [] }
      : { "image/jpeg": [], "image/png": [], "application/pdf": [] };

  const acceptedFormats =
    uploadType === "xray"
      ? "JPEG, PNG (max 10 MB)"
      : "JPEG, PNG, PDF (max 10 MB)";

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (
          rejection.errors.some((e) => e.code === "file-too-large")
        ) {
          setError("File is too large. Maximum size is 10 MB.");
        } else if (
          rejection.errors.some((e) => e.code === "file-invalid-type")
        ) {
          setError(
            `Invalid file format. Accepted formats: ${acceptedFormats}.`
          );
        } else {
          setError("File was rejected. Please check the format and size.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected, acceptedFormats]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // Uploading state
  if (isUploading) {
    return (
      <div className="border-2 border-brand-300 rounded-xl p-8 text-center bg-brand-50">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-brand-700 mb-3">
          Uploading... {uploadProgress}%
        </p>
        <div className="w-full bg-blue-100 rounded-full h-2.5">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // File selected state
  if (selectedFile) {
    const isImage = selectedFile.type.startsWith("image/");
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            {isImage ? (
              <FileImage className="w-6 h-6 text-green-600" />
            ) : (
              <File className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatBytes(selectedFile.size)} · {selectedFile.type || "unknown"}
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        {...getRootProps()}
        className="border-2 border-red-300 bg-red-50 rounded-xl p-8 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
        <p className="text-xs text-red-400">Click to try again</p>
      </div>
    );
  }

  // Idle / drag state
  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-brand-500 bg-brand-50"
          : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
      )}
    >
      <input {...getInputProps()} />
      <CloudUpload
        className={cn(
          "w-12 h-12 mx-auto mb-4",
          isDragActive ? "text-brand-600" : "text-gray-400"
        )}
      />
      <p className="text-sm font-medium text-gray-700 mb-1">
        {isDragActive
          ? "Drop your file here"
          : "Drop your file here or click to browse"}
      </p>
      <p className="text-xs text-gray-400">Accepted formats: {acceptedFormats}</p>
    </div>
  );
}
