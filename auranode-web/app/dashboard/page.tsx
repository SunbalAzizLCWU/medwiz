"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Clock,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useReportRealtime } from "@/hooks/useRealtime";
import { ReportTable } from "@/components/ReportTable";
import type { Report, ReportStatus } from "@/types";

type FilterTab = "all" | "processing" | "awaiting_doctor" | "reviewed";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "awaiting_doctor", label: "Awaiting Doctor" },
  { key: "reviewed", label: "Ready" },
];

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatsRow({
  total,
  pending,
  awaiting,
  reviewed,
  isLoading,
}: {
  total: number;
  pending: number;
  awaiting: number;
  reviewed: number;
  isLoading: boolean;
}) {
  const cards: StatCard[] = [
    {
      label: "Total Today",
      value: total,
      icon: <FileText className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Pending AI",
      value: pending,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-yellow-50 text-yellow-700 border-yellow-100",
    },
    {
      label: "Awaiting Doctor",
      value: awaiting,
      icon: <Stethoscope className="w-5 h-5" />,
      color: "bg-orange-50 text-orange-700 border-orange-100",
    },
    {
      label: "Reviewed",
      value: reviewed,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-green-50 text-green-700 border-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 flex items-center gap-3 ${card.color}`}
        >
          <div className="shrink-0">{card.icon}</div>
          <div>
            {isLoading ? (
              <div className="h-6 w-10 bg-current opacity-20 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold">{card.value}</p>
            )}
            <p className="text-xs font-medium opacity-75">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { reports: allReports, isLoading, mutate } = useReports();

  const handleRealtimeUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  useReportRealtime(user?.org_id ?? "", handleRealtimeUpdate);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  const filteredReports: Report[] = (() => {
    if (!allReports) return [];
    if (activeTab === "all") return allReports;
    return allReports.filter((r) => {
      if (activeTab === "processing")
        return r.status === "processing" || r.status === "uploading";
      return r.status === (activeTab as ReportStatus);
    });
  })();

  const pendingCount =
    allReports?.filter(
      (r) => r.status === "processing" || r.status === "uploading"
    ).length ?? 0;
  const awaitingCount =
    allReports?.filter((r) => r.status === "awaiting_doctor").length ?? 0;
  const reviewedCount =
    allReports?.filter((r) => r.status === "reviewed").length ?? 0;
  const totalCount = allReports?.length ?? 0;

  return (
    <div className="p-6 md:p-8">
      <StatsRow
        total={totalCount}
        pending={pendingCount}
        awaiting={awaitingCount}
        reviewed={reviewedCount}
        isLoading={isLoading}
      />

      {/* Reports table section */}
      <div className="bg-white rounded-xl border border-surface-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-wrap gap-3">
          <h2 className="text-base font-semibold text-slate-800">
            {"Today's Reports"}
          </h2>

          <div className="flex items-center gap-3">
            {/* Filter tabs */}
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="p-4">
          <ReportTable reports={filteredReports} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
