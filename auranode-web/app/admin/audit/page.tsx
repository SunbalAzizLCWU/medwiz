"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { formatDate, cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  actor_id: string | null
  actor_name: string | null
  created_at: string
}

/** Shape returned by the Supabase query (raw DB row + joined actor) */
interface AuditLogRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  meta: Record<string, unknown> | null
  actor_id: string | null
  created_at: string
  actor: { full_name: string } | null
}

const PAGE_SIZE = 20
const MODAL_TITLE_ID = "audit-detail-title"

export default function AuditPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [filterAction, setFilterAction] = useState("")
  const [filterEntityType, setFilterEntityType] = useState("")

  const fetchLogs = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    const supabase = createClient()
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Build a base query; filters are conditionally appended below.
    // eslint-disable-next-line
    let query: any = supabase
      .from("audit_logs")
      .select(
        "id, action, entity_type, entity_id, meta, actor_id, created_at, actor:users!actor_id(full_name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filterAction) query = query.ilike("action", `%${filterAction}%`)
    if (filterEntityType) query = query.ilike("entity_type", `%${filterEntityType}%`)

    const { data, count, error } = await query

    if (!error && data) {
      setLogs(
        (data as AuditLogRow[]).map((row) => ({
          id: row.id,
          action: row.action,
          entity_type: row.entity_type,
          entity_id: row.entity_id ?? null,
          metadata: row.meta ?? {},
          actor_id: row.actor_id ?? null,
          actor_name: row.actor?.full_name ?? null,
          created_at: row.created_at,
        }))
      )
      setTotal(count ?? 0)
    }
    setIsLoading(false)
  }, [user, page, filterAction, filterEntityType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedLog) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLog(null)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [selectedLog])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide activity and change history
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by action…"
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
        />
        <input
          type="text"
          placeholder="Filter by entity type…"
          value={filterEntityType}
          onChange={(e) => {
            setFilterEntityType(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-border">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Activity</h2>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-surface-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Timestamp
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                logs.map((log) => (
                  <tr
                    key={log.id}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-slate-50 cursor-pointer focus:outline-none focus:bg-brand-50"
                    onClick={() => setSelectedLog(log)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedLog(log)
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="capitalize">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="ml-1.5 font-mono text-xs text-slate-400">
                          {log.entity_id.slice(0, 8)}&hellip;
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.actor_name ?? (
                        <span className="text-slate-400 italic">system</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(log)
                        }}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className={cn(
                  "p-1.5 rounded-lg border border-surface-border transition-colors",
                  page === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className={cn(
                  "p-1.5 rounded-lg border border-surface-border transition-colors",
                  page === totalPages
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={MODAL_TITLE_ID}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3
                  id={MODAL_TITLE_ID}
                  className="text-lg font-semibold text-slate-900"
                >
                  Audit Log Detail
                </h3>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                aria-label="Close"
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <dl className="space-y-3">
              {(
                [
                  ["Action", selectedLog.action],
                  ["Entity Type", selectedLog.entity_type],
                  ["Entity ID", selectedLog.entity_id ?? "—"],
                  ["Actor", selectedLog.actor_name ?? "System"],
                  ["Timestamp", formatDate(selectedLog.created_at)],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <dt className="w-28 shrink-0 text-sm font-medium text-slate-500">
                    {label}
                  </dt>
                  <dd className="text-sm text-slate-800 break-all">{value}</dd>
                </div>
              ))}
              {Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1.5">
                    Metadata
                  </dt>
                  <dd>
                    <pre className="text-xs bg-slate-50 rounded-lg p-3 overflow-auto max-h-48 text-slate-700 border border-surface-border">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
