export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 space-y-5 animate-pulse">
      {/* Page header skeleton */}
      <div className="h-7 w-48 rounded-xl bg-slate-200" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-slate-200 border border-slate-200/60"
          />
        ))}
      </div>

      {/* Table / content skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="h-5 w-32 rounded-lg bg-slate-200" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
