"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usersApi, FeedItem } from "@/lib/api/users";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/auth/login"; return; }
    document.title = "Feed — Immiforum";
    usersApi.getFeed()
      .then((res) => setItems((res as { items: FeedItem[] }).items ?? []))
      .catch((err) => setError(err?.message ?? "Failed to load feed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Your Feed</h1>

      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>Loading feed...</div>}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Your feed is empty</h3>
          <p style={{ fontSize: 14, margin: "0 0 20px" }}>Follow people to see their activity here.</p>
          <Link href="/questions" style={{ background: "#0086cd", color: "white", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Browse Questions
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0086cd", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                  {item.user.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <Link href={`/u/${item.user.username}`} style={{ fontSize: 14, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                    {item.user.username}
                  </Link>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    {" "}{item.activity_type === "question_created" ? "asked a question" : "commented"}
                  </span>
                </div>
                <span style={{ marginInlineStart: "auto", fontSize: 12, color: "#9ca3af" }}>{timeAgo(item.created_at)}</span>
              </div>

              <Link href={`/questions/${item.question_slug}`} style={{ textDecoration: "none" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{item.question_title}</p>
                {item.snippet && (
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.snippet}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
