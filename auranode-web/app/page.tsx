import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Globe,
  Brain,
  Clock,
  ArrowRight,
  FileText,
  Activity,
  Users,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-slate-900">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-400/30">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              AuraNode
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/20 hover:opacity-90 transition-opacity"
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"
        />

        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          AuraNode v2.0 is Live — Powered by ONNX &amp; Groq AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-5">
          Tele-diagnostics,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            instantly.
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-lg text-slate-500 leading-relaxed mb-10">
          AI-powered X-Ray and lab-report analysis delivered in seconds — not
          days. Built for rural clinics where every minute counts.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-xl shadow-blue-500/25 hover:opacity-90 transition-opacity text-sm"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/70 backdrop-blur border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-white transition-colors text-sm"
          >
            View Demo
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-slate-400 font-medium tracking-wide uppercase">
          Trusted by 200+ rural health facilities · 50k+ reports processed
        </p>
      </section>

      {/* ── Bento Grid ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 – Speed */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md hover:shadow-slate-200/60 transition-shadow overflow-hidden">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              &lt; 90s Report Turnaround
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              ONNX inference on the edge processes X-Rays and lab reports in
              under 90 seconds, replacing 24–48 hour courier wait times.
            </p>
          </div>

          {/* Card 2 – AI Brain (large) */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-500/20 text-white sm:col-span-2 lg:col-span-1 overflow-hidden">
            <div
              aria-hidden
              className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl"
            />
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 mb-4">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-bold tracking-tight mb-1">
              Multi-modal AI Engine
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Groq-accelerated LLM reasoning paired with ONNX vision models
              for pneumonia detection, fracture grading, and CBC interpretation.
            </p>
          </div>

          {/* Card 3 – Security */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              HIPAA-ready Security
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              End-to-end encrypted data pipelines, Supabase Row-Level Security,
              and ephemeral file storage ensure patient privacy.
            </p>
          </div>

          {/* Card 4 – Reach */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 mb-4">
              <Globe className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              Works on 2G Networks
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Lightweight frontend, progressive image compression, and
              offline-first design keep the app usable in low-bandwidth
              environments.
            </p>
          </div>

          {/* Card 5 – Roles */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 mb-4">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              Role-based Workflows
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Separate portals for clinic workers, reviewing doctors, and
              admins — each seeing only what they need.
            </p>
          </div>

          {/* Card 6 – Reports */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 mb-4">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              Shareable PDF Reports
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Doctors annotate AI findings, generate branded PDF reports, and
              share them via a secure token link — no login required for
              patients.
            </p>
          </div>

          {/* Card 7 – Monitoring (full-width) */}
          <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow col-span-1 sm:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 shrink-0">
                <Activity className="w-5 h-5 text-slate-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                  Real-time Job Queue &amp; Audit Logs
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Admins monitor every inference job — from upload to final
                  report — with live status updates, error tracing, and a
                  full immutable audit trail.
                </p>
              </div>
              <Link
                href="/signup"
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Start free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-700">AuraNode</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AuraNode. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
