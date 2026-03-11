"use client";

import useSWR, { type Fetcher } from "swr";
import { createClient } from "@/lib/supabase";
import type { Report, ReportStatus } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

const reportsFetcher: Fetcher<Report[], [string, ReportStatus | undefined]> =
  async ([, status]) => {
    const token = await getAccessToken();
    const url = new URL(`${API_URL}/api/reports/`);
    if (status) url.searchParams.set("status", status);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch reports");
    return res.json() as Promise<Report[]>;
  };

const singleReportFetcher: Fetcher<Report, [string, string]> = async ([
  ,
  reportId,
]) => {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json() as Promise<Report>;
};

export function useReports(status?: ReportStatus) {
  const { data, error, isLoading, mutate } = useSWR<
    Report[],
    Error,
    [string, ReportStatus | undefined]
  >(["/api/reports", status], reportsFetcher, { refreshInterval: 30000 });

  return {
    reports: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useSingleReport(reportId: string) {
  const { data, error, isLoading, mutate } = useSWR<
    Report,
    Error,
    [string, string] | null
  >(
    reportId ? (["/api/report", reportId] as [string, string]) : null,
    singleReportFetcher as Fetcher<Report, [string, string]>
  );

  return {
    report: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
