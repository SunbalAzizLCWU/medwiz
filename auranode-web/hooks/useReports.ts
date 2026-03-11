"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase";
import type { Report, ReportStatus } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetcher(url: string): Promise<Report[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

async function singleFetcher(url: string): Promise<Report> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export function useReports(status?: ReportStatus) {
  const url = status ? `/api/reports?status=${status}` : "/api/reports";
  const { data, error, isLoading, mutate } = useSWR<Report[]>(
    [url, status],
    ([u]) => fetcher(u as string)
  );

  return {
    reports: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useSingleReport(reportId: string) {
  const { data, error, isLoading, mutate } = useSWR<Report>(
    reportId ? `/api/reports/${reportId}` : null,
    singleFetcher
  );

  return {
    report: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
