import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import type { ReportStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function generateWhatsAppLink(
  phone: string,
  reportToken: string,
  appUrl: string
): string {
  const message = encodeURIComponent(
    `Your AuraNode medical report is ready. View it here: ${appUrl}/report/${reportToken}`
  );
  // Accepts Pakistani local format (03XXXXXXXXX) or international (923XXXXXXXXX/+923XXXXXXXXX)
  let intlPhone = phone.replace(/\s+/g, "");
  if (intlPhone.startsWith("+")) {
    intlPhone = intlPhone.slice(1);
  } else if (intlPhone.startsWith("0")) {
    intlPhone = `92${intlPhone.slice(1)}`;
  }
  return `https://wa.me/${intlPhone}?text=${message}`;
}

export function maskPhone(phone: string): string {
  return `****${phone.slice(-4)}`;
}

export function getStatusColor(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    uploading: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-600",
    awaiting_doctor: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-green-100 text-green-700",
    delivered: "bg-slate-100 text-slate-500",
    processing_failed: "bg-red-100 text-red-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function getStatusLabel(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    uploading: "Uploading",
    processing: "Processing AI",
    awaiting_doctor: "Awaiting Doctor",
    reviewed: "Ready",
    delivered: "Delivered",
    processing_failed: "Failed",
  };
  return map[status] ?? status;
}
