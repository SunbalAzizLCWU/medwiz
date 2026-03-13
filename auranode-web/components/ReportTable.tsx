"use client";

import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Eye, Download, MessageCircle, Activity, FlaskConical } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import { generateWhatsAppLink } from "@/lib/utils";
import type { Report } from "@/types";

interface Props {
  reports: Report[];
  isLoading: boolean;
  onViewReport?: (report: Report) => void;
}

const columnHelper = createColumnHelper<Report>();

function getPatientName(report: Report): string {
  return report.patient_name || report.patient?.name || "Unknown";
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-surface-border">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-100 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

function MobileCard({
  report,
  onViewReport,
}: {
  report: Report;
  onViewReport?: (r: Report) => void;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">
            {getPatientName(report)}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ID: {report.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
        {report.upload_type === "xray" ? (
          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
            <Activity className="w-3 h-3" /> X-Ray
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
            <FlaskConical className="w-3 h-3" /> Lab
          </span>
        )}
        <span className="text-slate-300">|</span>
        <span>{formatRelativeTime(report.created_at)}</span>
      </div>
      <div className="flex gap-2 pt-1 mt-2 border-t border-slate-100">
        {/* REPLACED BUTTON WITH NEXT.JS LINK FOR ROUTING */}
        <Link
          href={`/dashboard/reports/${report.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors shadow-sm border border-brand-200"
        >
          <Eye className="w-4 h-4" /> View Analysis
        </Link>
        
        {report.status === "reviewed" && (
          <>
            <a
              href={report.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Download PDF"
            >
              <Download className="w-4 h-4" /> PDF
            </a>
            <a
              href={generateWhatsAppLink(
                report.patient_phone || "",
                report.signed_url_token,
                appUrl
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
              title="Send to WhatsApp"
            >
              <MessageCircle className="w-4 h-4" /> WA
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export function ReportTable({ reports, isLoading, onViewReport }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const columns = [
    columnHelper.accessor("patient_name", {
      header: "Patient",
      cell: (info) => {
        const report = info.row.original;
        const name = getPatientName(report);
        return (
          <div>
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {report.id.slice(0, 8)}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("upload_type", {
      header: "Type",
      cell: (info) =>
        info.getValue() === "xray" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            <Activity className="w-3 h-3" /> X-Ray
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
            <FlaskConical className="w-3 h-3" /> Lab
          </span>
        ),
    }),
    columnHelper.accessor("created_at", {
      header: "Uploaded",
      cell: (info) => (
        <span className="text-sm font-medium text-slate-600">
          {formatRelativeTime(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("doctor_id", {
      header: "Doctor",
      cell: (info) => {
        const report = info.row.original;
        return (
          <span className="text-sm italic text-slate-500">
            {report.doctor?.full_name ?? "Unassigned"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {/* REPLACED BUTTON WITH NEXT.JS LINK FOR ROUTING */}
            <Link
              href={`/dashboard/reports/${report.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-lg transition-all font-bold text-xs shadow-sm border border-brand-200 hover:border-brand-600"
            >
              <Eye className="w-4 h-4" /> View Analysis
            </Link>
            
            {report.status === "reviewed" && (
              <>
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200 shadow-sm"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </a>
                <a
                  href={generateWhatsAppLink(
                    report.patient_phone || "",
                    report.signed_url_token,
                    appUrl
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors border border-green-200 shadow-sm"
                  title="Send WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-surface-border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 border-b border-surface-border">
              <tr>
                {["Patient", "Type", "Uploaded", "Status", "Doctor", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-surface-border p-4 animate-pulse space-y-3 shadow-sm"
            >
              <div className="h-4 bg-slate-200 rounded w-40" />
              <div className="h-8 bg-slate-100 rounded-lg w-full mt-4" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="w-16 h-16 text-slate-300 mb-4"
          fill="none"
          viewBox="0 0 64 64"
        >
          <rect x="8" y="8" width="48" height="48" rx="8" stroke="currentColor" strokeWidth="2" />
          <path d="M20 32h24M20 40h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 20v4M32 28h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-lg font-semibold text-slate-700">No reports yet</p>
        <p className="text-sm text-slate-500 mt-1">
          Reports will appear here once uploaded
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-surface-border shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 border-b border-surface-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-surface-border bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {reports.map((report) => (
          <MobileCard
            key={report.id}
            report={report}
            onViewReport={onViewReport}
          />
        ))}
      </div>
    </>
  );
}
