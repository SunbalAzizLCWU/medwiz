import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DoctorPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "doctor" && profile?.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-surface p-8">
      <h1 className="text-2xl font-bold text-brand-900 mb-2">Doctor Portal</h1>
      <p className="text-slate-600">
        Welcome, Dr. {profile?.full_name ?? user.email}
      </p>
    </main>
  );
}
