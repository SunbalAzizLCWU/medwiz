import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Panel | AuraNode",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="w-60 bg-white border-r border-surface-border flex flex-col shrink-0">
        <div className="p-5 border-b border-surface-border">
          <p className="text-lg font-bold text-brand-900">AuraNode</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors"
          >
            Audit Logs
          </Link>
        </nav>
        <div className="p-4 border-t border-surface-border">
          <p className="text-sm font-medium text-slate-800 truncate">
            {profile?.full_name ?? user.email}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Super Admin</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
