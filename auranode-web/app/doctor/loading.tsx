export default function DoctorLoading() {
  return (
    <div className="flex-1 p-6 space-y-5 animate-pulse">
      <div className="h-7 w-40 rounded-xl bg-slate-200" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="h-5 w-28 rounded-lg bg-slate-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
