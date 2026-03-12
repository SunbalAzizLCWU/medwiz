"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types";

interface Props {
  title: string;
}

export function TopBar({ title }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as unknown as Notification[]);
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user || notifications.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications([]);
    setOpen(false);
  };

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-surface-border">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-surface-border z-20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                <p className="text-sm font-semibold text-slate-800">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50">
                      <p className="text-sm text-slate-800">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
