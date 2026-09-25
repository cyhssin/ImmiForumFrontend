"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usersApi, MyStats } from "@/lib/api/users";
import { apiFetch } from "@/lib/api/users";

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

type Tab = "questions" | "comments" | "bookmarks" | "liked";

export default function DashboardPage() {
  const [auth, setAuth] = useState<{ user: { username: string; email: string } } | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [tab, setTab] = useState<Tab>("questions");
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getAuth();
    if (!a) { window.location.href = "/auth/login"; return; }
    setAuth(a);
    usersApi.getMyStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!auth) return;
    setLoading(true);
    setItems([]);
    const username = auth.user.username;
    const fetchers: Record<Tab, () => Promise<unknown>> = {
      questions: () => usersApi.getUserQuestions(username),
      comments: () => usersApi.getUserComments(username),
      bookmarks: () => apiFetch("/users/me/bookmarks"),
      liked: () => apiFetch("/users/me/liked"),
    };
    fetchers[tab]()
      .then((res) => {
        const data = res as { items?: unknown[]; question_ids?: string[] };
        setItems(data?.items ?? data?.question_ids ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, auth]);

  if (!auth) return null;

  const statCards = stats ? [
    { label: "Questions", value: stats.questions_count, icon: "❓" },
    { label: "Comments", value: stats.comments_count, icon: "💬" },
    { label: "Likes Given", value: stats.likes_given_count, icon: "♥" },
    { label: "Likes Received", value: stats.likes_received_count, icon: "⭐" },
    { label: "Bookmarks", value: stats.bookmarks_count, icon: "🔖" },
  ] : [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Welcome back, <strong>{auth.user.username}</strong></p>
      </div>

      {/* Stat tiles */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 28 }}>
          {statCards.map((s) => (
            <div key={s.label} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {(["questions", "comments", "bookmarks", "liked"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t ? "#4f46e5" : "#f3f4f6", color: tab === t ? "white" : "#6b7280" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Loading...</div>}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <p style={{ fontSize: 14 }}>Nothing here yet.</p>
          {tab === "questions" && (
            <Link href="/questions/ask" style={{ background: "#4f46e5", color: "white", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 12 }}>
              Ask a Question
            </Link>
          )}
        </div>
      )}

      {!loading && items.length > 0 && (tab === "questions") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(items as Array<{ slug: string; title: string; status: string; likes_count: number; comments_count: number; created_at: string }>).map((q) => (
            <Link key={q.slug} href={`/questions/${q.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{q.title}</p>
                <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", gap: 12 }}>
                  <span style={{ background: q.status === "open" ? "#dcfce7" : "#fee2e2", color: q.status === "open" ? "#166534" : "#991b1b", padding: "1px 8px", borderRadius: 99, fontWeight: 600 }}>{q.status}</span>
                  <span>♥ {q.likes_count}</span>
                  <span>💬 {q.comments_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && tab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(items as Array<{ id: string; body: string; question_slug: string; question_title: string }>).map((c) => (
            <Link key={c.id} href={`/questions/${c.question_slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>on <strong style={{ color: "#4f46e5" }}>{c.question_title}</strong></p>
                <p style={{ fontSize: 14, color: "#374151", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.body}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (tab === "bookmarks" || tab === "liked") && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {items.length} question ID{items.length !== 1 ? "s" : ""} {tab}. Visit <Link href="/questions" style={{ color: "#4f46e5" }}>Questions</Link> to browse them.
          </p>
        </div>
      )}
    </div>
  );
}
