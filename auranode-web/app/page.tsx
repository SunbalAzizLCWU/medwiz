import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-extrabold text-brand-900 mb-4">AuraNode</h1>
      <p className="text-lg text-slate-600 max-w-xl mb-10">
        AI-powered tele-diagnostic platform delivering fast, accurate medical
        reports to rural healthcare facilities.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-brand-600 text-brand-600 hover:bg-brand-50 font-semibold px-6 py-3 transition-colors"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
