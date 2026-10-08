"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import { adminApi, AdminUser } from "@/lib/api/admin";

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [auth] = useState(() => getAuth());

  useEffect(() => {
    setLoading(true);
    adminApi.getUsers(search || undefined)
      .then((res) => { setUsers(res.items ?? []); setTotal(res.total ?? 0); })
      .catch((err) => setError(err?.message ?? "Failed to load users"))
      .finally(() => setLoading(false));
  }, [search]);

  async function toggleStatus(user: AdminUser) {
    if (user.id === auth?.user?.id) { alert("You cannot change your own status."); return; }
    setTogglingId(user.id);
    try {
      await adminApi.setUserStatus(user.id, !user.is_active);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      admin: { bg: "#fef3c7", color: "#92400e" },
      moderator: { bg: "#ede9fe", color: "#5b21b6" },
      user: { bg: "#f3f4f6", color: "#374151" },
    };
    const c = colors[role] ?? colors.user;
    return (
      <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize" as const }}>
        {role}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Admin Console</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{total} total users</p>
        </div>
        <Link href="/admin/moderation-logs"
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          📋 Moderation Logs
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
        style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by username or email..."
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" }}
        />
        <button type="submit"
          style={{ background: "#0086cd", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }}
            style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer" }}>
            Clear
          </button>
        )}
      </form>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Loading...</div>}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["User", "Email", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0086cd", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <Link href={`/admin/users/${user.id}`} style={{ fontSize: 14, fontWeight: 600, color: "#111827", textDecoration: "none" }}>
                        {user.username}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{user.email}</td>
                  <td style={{ padding: "12px 16px" }}>{roleBadge(user.role)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: user.is_active ? "#dcfce7" : "#fee2e2", color: user.is_active ? "#166534" : "#991b1b", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                      {user.is_active ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/admin/users/${user.id}`}
                        style={{ fontSize: 12, color: "#0086cd", textDecoration: "none", padding: "4px 10px", border: "1px solid #a5b4fc", borderRadius: 6 }}>
                        View
                      </Link>
                      <button
                        onClick={() => toggleStatus(user)}
                        disabled={togglingId === user.id || user.id === auth?.user?.id}
                        style={{ fontSize: 12, color: user.is_active ? "#dc2626" : "#16a34a", background: "none", border: `1px solid ${user.is_active ? "#fca5a5" : "#86efac"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: user.id === auth?.user?.id ? 0.4 : 1 }}>
                        {togglingId === user.id ? "..." : user.is_active ? "Ban" : "Unban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
