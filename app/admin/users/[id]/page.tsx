"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import { adminApi, AdminUser } from "@/lib/api/admin";

export default function AdminUserDetailPage() {
  return <AdminGuard><UserDetail /></AdminGuard>;
}

function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([adminApi.getUser(id), adminApi.getRoles()])
      .then(([u, r]) => {
        const usr = u as AdminUser;
        setUser(usr);
        setSelectedRole(usr.role);
        setRoles((r as { items: { id: number; name: string }[] }).items ?? []);
      })
      .catch((err) => setError(err?.message ?? "Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRoleChange() {
    if (!user || selectedRole === user.role) return;
    setSavingRole(true);
    setMsg("");
    try {
      await adminApi.setUserRole(user.id, selectedRole);
      setUser((u) => u ? { ...u, role: selectedRole } : u);
      setMsg("Role updated successfully.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleStatusToggle() {
    if (!user) return;
    setSavingStatus(true);
    setMsg("");
    try {
      await adminApi.setUserStatus(user.id, !user.is_active);
      setUser((u) => u ? { ...u, is_active: !u.is_active } : u);
      setMsg(`User ${!user.is_active ? "activated" : "banned"} successfully.`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>Loading...</div>;
  if (error || !user) return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>{error || "User not found"}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Link href="/admin" style={{ color: "#6b7280", fontSize: 14, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
        {/* User header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>{user.username}</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{user.email}</p>
          </div>
          <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
            <span style={{ background: user.is_active ? "#dcfce7" : "#fee2e2", color: user.is_active ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
              {user.is_active ? "Active" : "Banned"}
            </span>
            <span style={{ background: user.is_verified ? "#dbeafe" : "#f3f4f6", color: user.is_verified ? "#1e40af" : "#6b7280", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
              {user.is_verified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>

        {/* Stats */}
        {(user.questions_count !== undefined || user.comments_count !== undefined) && (
          <div style={{ display: "flex", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{user.questions_count ?? 0}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Questions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{user.comments_count ?? 0}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Comments</div>
            </div>
          </div>
        )}

        {msg && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#166534", marginBottom: 16 }}>
            {msg}
          </div>
        )}

        {/* Role change */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Role</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
              style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", background: "white" }}>
              {roles.length > 0
                ? roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)
                : ["user", "moderator", "admin"].map((r) => <option key={r} value={r}>{r}</option>)
              }
            </select>
            <button onClick={handleRoleChange} disabled={savingRole || selectedRole === user.role}
              style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: selectedRole === user.role ? 0.5 : 1 }}>
              {savingRole ? "Saving..." : "Update Role"}
            </button>
          </div>
        </div>

        {/* Status toggle */}
        <div style={{ paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Account Status</label>
          <button onClick={handleStatusToggle} disabled={savingStatus}
            style={{ background: user.is_active ? "#dc2626" : "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {savingStatus ? "Updating..." : user.is_active ? "Ban User" : "Activate User"}
          </button>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            {user.is_active ? "Banning will prevent this user from logging in." : "Activating will restore access."}
          </p>
        </div>
      </div>

      <Link href={`/u/${user.username}`}
        style={{ fontSize: 14, color: "#4f46e5", textDecoration: "none" }}>
        View public profile →
      </Link>
    </div>
  );
}
