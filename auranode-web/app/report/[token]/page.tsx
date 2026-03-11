import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicReportPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*, patient:patients(*)")
    .eq("signed_url_token", token)
    .single();

  if (!report) notFound();

  return (
    <main className="min-h-screen bg-surface p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-900 mb-2">
        Medical Report
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Patient: {report.patient?.name ?? "—"}
      </p>
      <div className="bg-surface-card rounded-xl border border-surface-border p-6">
        <p className="text-slate-700">
          {report.doctor_notes ?? "No doctor notes available."}
        </p>
      </div>
    </main>
  );
}
