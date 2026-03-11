"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Subscribe to real-time changes for an organisation's reports.
 *
 * NOTE: Pass a stable `onUpdate` reference (e.g. wrapped with `useCallback`)
 * to avoid unnecessary re-subscriptions.
 */
export function useReportRealtime(orgId: string, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`org_reports_${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
          filter: `org_id=eq.${orgId}`,
        },
        () => onUpdateRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);
}
