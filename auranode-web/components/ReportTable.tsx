"use client";

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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 rounded w-full max-w-[120px]" />
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
    <div className="bg-white rounded-xl border border-surface-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">
            {report.patient_name || report.patient?.name || "Unknown"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            ****{(report.patient_phone || "").slice(-4)}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {report.upload_type === "xray" ? (
          <span className="flex items-center gap-1 text-blue-600">
            <Activity className="w-3.5 h-3.5" /> X-Ray
          </span>
        ) : (
          <span className="flex items-center gap-1 text-purple-600">
            <FlaskConical className="w-3.5 h-3.5" /> Lab
          </span>
        )}
        <span className="text-slate-300">·</span>
        <span>{formatRelativeTime(report.created_at)}</span>
      </div>
      <div className="flex gap-2">
        {onViewReport && (
          <button
            onClick={() => onViewReport(report)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
        )}
        {report.status === "reviewed" && (
          <>
            <a
              href={report.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
            <a
              href={generateWhatsAppLink(
                report.patient_phone || "",
                report.signed_url_token,
                appUrl
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
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
        const name =
          report.patient_name || report.patient?.name || "Unknown";
        const phone = report.patient_phone || "";
        return (
          <div>
            <p className="font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">****{phone.slice(-4)}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("upload_type", {
      header: "Type",
      cell: (info) =>
        info.getValue() === "xray" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Activity className="w-3 h-3" /> X-Ray
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <FlaskConical className="w-3 h-3" /> Lab
          </span>
        ),
    }),
    columnHelper.accessor("created_at", {
      header: "Uploaded",
      cell: (info) => (
        <span className="text-sm text-slate-500">
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
          <span className="text-sm text-slate-600">
            {report.doctor?.full_name ?? "Unassigned"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center gap-2">
            {onViewReport && (
              <button
                onClick={() => onViewReport(report)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {report.status === "reviewed" && (
              <>
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
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
                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
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
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {["Patient", "Type", "Uploaded", "Status", "Doctor", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
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
              className="bg-white rounded-xl border border-surface-border p-4 animate-pulse space-y-2"
            >
              <div className="h-4 bg-slate-200 rounded w-40" />
              <div className="h-3 bg-slate-100 rounded w-24" />
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
        <p className="text-lg font-semibold text-slate-600">No reports yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Reports will appear here once uploaded
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-surface-border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
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
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
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
