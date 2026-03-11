"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useReports } from "@/hooks/useReports";
import { useReportRealtime } from "@/hooks/useRealtime";
import { useAuth } from "@/hooks/useAuth";
import {
  formatRelativeTime,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import type { Report } from "@/types";
import {
  Activity,
  FlaskConical,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";
import { isToday, parseISO } from "date-fns";

type FilterTab = "all" | "awaiting" | "completed";

function ReportTypeIcon({ type }: { type: "xray" | "lab" }) {
  if (type === "xray") {
    return <Activity className="w-5 h-5 text-blue-600" />;
  }
  return <FlaskConical className="w-5 h-5 text-purple-600" />;
}

function ReportCard({
  report,
  onReview,
}: {
  report: Report;
  onReview: (id: string) => void;
}) {
  const isReviewed = report.status === "reviewed";

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          report.upload_type === "xray" ? "bg-blue-50" : "bg-purple-50"
        }`}
      >
        <ReportTypeIcon type={report.upload_type} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-800 truncate">
              {report.patient?.name ?? "Unknown Patient"}
            </p>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(report.created_at)}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              report.status
            )}`}
          >
            {getStatusLabel(report.status)}
          </span>
        </div>

        {isReviewed && report.reviewed_at && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reviewed {formatDate(report.reviewed_at)}
          </p>
        )}
      </div>

      {!isReviewed && (
        <button
          onClick={() => onReview(report.id)}
          className="flex-shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Review
        </button>
      )}
    </div>
  );
}

export default function DoctorQueuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("awaiting");

  const { reports: allReports, isLoading, mutate } = useReports();

  const handleRealtimeUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  useReportRealtime(user?.org_id ?? "", handleRealtimeUpdate);

  const awaitingReports =
    allReports?.filter((r) => r.status === "awaiting_doctor") ?? [];

  const completedToday =
    allReports?.filter(
      (r) =>
        r.status === "reviewed" &&
        r.reviewed_at &&
        isToday(parseISO(r.reviewed_at))
    ) ?? [];

  const displayedReports = (() => {
    switch (activeTab) {
      case "awaiting":
        return awaitingReports;
      case "completed":
        return completedToday;
      case "all":
      default:
        return allReports ?? [];
    }
  })();

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: allReports?.length ?? 0 },
    {
      key: "awaiting",
      label: "Awaiting Review",
      count: awaitingReports.length,
    },
    {
      key: "completed",
      label: "Completed Today",
      count: completedToday.length,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-7 h-7 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Review Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reports requiring your review
          </p>
        </div>
        {awaitingReports.length > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">
            {awaitingReports.length}
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
                  activeTab === tab.key
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-surface-border p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
          <p className="text-lg font-semibold text-slate-700">All caught up!</p>
          <p className="text-slate-500 mt-1">No reports pending review.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {displayedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onReview={(id) => router.push(`/doctor/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
