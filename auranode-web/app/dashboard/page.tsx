"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useReportRealtime } from "@/hooks/useRealtime";
import { useAuth } from "@/hooks/useAuth";
import { ReportTable } from "@/components/ReportTable";
import type { ReportStatus, DashboardStats } from "@/types";
import useSWR from "swr";
import { createClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/api/org/${orgId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

type FilterTab = "all" | ReportStatus;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Awaiting Doctor", value: "awaiting_doctor" },
  { label: "Ready", value: "reviewed" },
];

function StatCard({
  label,
  value,
  color,
  isLoading,
}: {
  label: string;
  value?: number;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border border-surface-border p-5`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2" />
      ) : (
        <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const { data: stats, isLoading: statsLoading } = useSWR(
    user?.org_id ? `stats-${user.org_id}` : null,
    () => fetchDashboardStats(user!.org_id)
  );

  const { reports, isLoading: reportsLoading, mutate } = useReports(
    activeFilter === "all" ? undefined : (activeFilter as ReportStatus)
  );

  const handleRealTimeUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  useReportRealtime(user?.org_id ?? "", handleRealTimeUpdate);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Today"
          value={stats?.total_reports_today}
          color="text-blue-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Pending AI"
          value={stats?.pending_ai}
          color="text-yellow-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Awaiting Doctor"
          value={stats?.awaiting_doctor}
          color="text-orange-600"
          isLoading={statsLoading}
        />
        <StatCard
          label="Reviewed"
          value={stats?.reviewed_today}
          color="text-green-600"
          isLoading={statsLoading}
        />
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-surface-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Today&apos;s Reports
          </h2>
          <button
            onClick={() => mutate()}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-gray-100 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <ReportTable reports={reports} isLoading={reportsLoading} />
        </div>
      </div>
    </div>
  );
}
