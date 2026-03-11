import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "Dashboard | AuraNode",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-surface flex flex-col">
        <TopBar title="Dashboard" />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
