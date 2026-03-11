import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { ReportStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy, hh:mm aa");
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function generateWhatsAppLink(
  phone: string,
  reportToken: string,
  appUrl: string,
  countryCode = "92"
): string {
  const message = encodeURIComponent(
    `Your AuraNode medical report is ready. View it here: ${appUrl}/report/${reportToken}`
  );
  return `https://wa.me/${countryCode}${phone}?text=${message}`;
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
