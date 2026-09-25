"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import { adminApi, ModerationLog } from "@/lib/api/admin";

export default function ModerationLogsPage() {
  return <AdminGuard><LogsTable /></AdminGuard>;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  pin: { bg: "#fef9c3", color: "#854d0e" },
  unpin: { bg: "#f3f4f6", color: "#374151" },
  close: { bg: "#fee2e2", color: "#991b1b" },
  reopen: { bg: "#dcfce7", color: "#166534" },
  delete_question: { bg: "#fce7f3", color: "#9d174d" },
  delete_comment: { bg: "#fce7f3", color: "#9d174d" },
  ban_user: { bg: "#fee2e2", color: "#991b1b" },
  unban_user: { bg: "#dcfce7", color: "#166534" },
  change_role: { bg: "#ede9fe", color: "#5b21b6" },
};

function LogsTable() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    adminApi.getModerationLogs(actionFilter ? { action: actionFilter } : undefined)
      .then((res) => { setLogs(res.items ?? []); setTotal(res.total ?? 0); })
      .catch((err) => setError(err?.message ?? "Failed to load logs"))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const actions = ["pin", "unpin", "close", "reopen", "delete_question", "delete_comment", "ban_user", "unban_user", "change_role"];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <Link href="/admin" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>← Admin</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "4px 0 0" }}>Moderation Logs</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{total} total entries</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setActionFilter("")}
          style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: !actionFilter ? "#4f46e5" : "#f3f4f6", color: !actionFilter ? "white" : "#6b7280" }}>
          All
        </button>
        {actions.map((a) => (
          <button key={a} onClick={() => setActionFilter(a)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: actionFilter === a ? "#4f46e5" : "#f3f4f6", color: actionFilter === a ? "white" : "#6b7280" }}>
            {a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Loading...</div>}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Action", "Target", "Moderator", "Detail", "When"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const c = ACTION_COLORS[log.action] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                      <span style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{log.target_type}</span>
                      <span style={{ marginLeft: 6, fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{log.target_id ? log.target_id.slice(0, 8) + '...' : '—'}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", fontWeight: 600 }}>
                      {log.moderator_username ?? (log.moderator_id ? log.moderator_id.slice(0, 8) : '—')}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", maxWidth: 200 }}>
                      {log.detail ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" as const }}>
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>No logs found.</div>
          )}
        </div>
      )}
    </div>
  );
}
