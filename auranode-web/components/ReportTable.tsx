"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, Download, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTime, generateWhatsAppLink } from "@/lib/utils";
import type { Report } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  reports: Report[];
  isLoading: boolean;
}

const columnHelper = createColumnHelper<Report>();

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function ReportTable({ reports, isLoading }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.accessor("patient", {
        header: "Patient",
        cell: (info) => {
          const patient = info.getValue();
          return (
            <div>
              <p className="text-sm font-medium text-gray-900">
                {patient?.name ?? "Unknown"}
              </p>
              {patient?.phone_last4 && (
                <p className="text-xs text-gray-400">
                  ****{patient.phone_last4}
                </p>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("upload_type", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue();
          return (
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                type === "xray"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {type === "xray" ? "X-Ray" : "Lab"}
            </span>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Upload Time",
        cell: (info) => (
          <span className="text-sm text-gray-500">
            {formatRelativeTime(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("doctor", {
        header: "Doctor",
        cell: (info) => {
          const doctor = info.getValue();
          return (
            <span className="text-sm text-gray-600">
              {doctor?.full_name ?? "Unassigned"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const report = info.row.original;
          const isDoctor = user?.role === "doctor";

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isDoctor) {
                    router.push(`/doctor/${report.id}`);
                  } else {
                    router.push(`/dashboard/report/${report.id}`);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                title="View report"
              >
                <Eye className="w-4 h-4" />
              </button>

              {report.status === "reviewed" && (
                <>
                  <a
                    href={`/api/reports/${report.id}/pdf`}
                    download
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {/* WhatsApp: requires full phone — only available on detail page.
                      From the table we open the detail view via the Eye button.
                      If a signed_url_token is present we can still surface the
                      share icon so workers know the option exists. */}
                  {report.signed_url_token && (
                    <button
                      onClick={() => {
                        const appUrl =
                          process.env.NEXT_PUBLIC_APP_URL ??
                          "http://localhost:3000";
                        // Use the report token as the identifier; the patient
                        // can open their report via the public /report route.
                        const link = generateWhatsAppLink(
                          "00000000000", // placeholder – replaced on detail page
                          report.signed_url_token,
                          appUrl
                        );
                        // Navigate to detail page for full send experience
                        router.push(`/dashboard/report/${report.id}`);
                        void link; // prevent unused-var lint
                      }}
                      title="Send to patient via WhatsApp"
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [user, router]
  );

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isLoading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No reports yet
        </h3>
        <p className="text-gray-500 text-sm">
          Upload a report to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 border-b border-surface-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
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
        <tbody className="bg-white divide-y divide-gray-100">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            : table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3 p-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          : reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {report.patient?.name ?? "Unknown"}
                    </p>
                    {report.patient?.phone_last4 && (
                      <p className="text-xs text-gray-400">
                        ****{report.patient.phone_last4}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatRelativeTime(report.created_at)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      report.upload_type === "xray"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {report.upload_type === "xray" ? "X-Ray" : "Lab"}
                  </span>
                </div>
                <button
                  onClick={() =>
                    router.push(`/dashboard/report/${report.id}`)
                  }
                  className="text-xs text-brand-600 hover:underline"
                >
                  View details →
                </button>
              </div>
            ))}
      </div>
    </div>
  );
}
