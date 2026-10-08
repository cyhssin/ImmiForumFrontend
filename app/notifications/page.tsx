"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationsApi, NotificationItem } from "@/lib/api/notifications";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "همین حالا";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  return `${Math.floor(diff / 86400)} روز پیش`;
}

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch {
    return null;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAuth()) {
      router.push("/auth/login");
      return;
    }
    document.title = "اعلان‌ها — Immiforum";
    notificationsApi.list()
      .then((result) => {
        setItems(result.items);
        setUnreadCount(result.unread_count);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "بارگیری اعلان‌ها ناموفق بود"))
      .finally(() => setLoading(false));
  }, [router]);

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "به‌روزرسانی اعلان‌ها ناموفق بود");
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.read_at) {
      try {
        await notificationsApi.markRead(item.id);
        setItems((current) => current.map((notification) => notification.id === item.id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "به‌روزرسانی اعلان ناموفق بود");
      }
    }
    router.push(`/questions/${item.question_slug}#comment-${item.comment_id}`);
  }

  return (
    <section style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>اعلان‌ها</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{unreadCount} اعلان خوانده‌نشده</p>
        </div>
        <button type="button" onClick={markAllRead} disabled={unreadCount === 0}
          style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", color: unreadCount ? "#374151" : "#9ca3af", background: "white", fontSize: 13, fontWeight: 600, cursor: unreadCount ? "pointer" : "default" }}>
          خواندن همه
        </button>
      </div>

      {loading && <p style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>در حال بارگیری...</p>}
      {error && <p role="alert" style={{ padding: 14, border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", background: "#fef2f2" }}>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div style={{ padding: "56px 20px", textAlign: "center", color: "#6b7280", background: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <h2 style={{ margin: "0 0 8px", color: "#374151", fontSize: 17 }}>هنوز اعلانی ندارید</h2>
          <p style={{ margin: 0, fontSize: 14 }}>پاسخ‌های پرسش‌ها و پاسخ به دیدگاه‌های شما اینجا نمایش داده می‌شوند.</p>
        </div>
      )}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid #e5e7eb" }}>
          {items.map((item) => (
            <li key={item.id} style={{ borderBottom: "1px solid #e5e7eb", background: item.read_at ? "transparent" : "#eff6ff" }}>
              <button type="button" onClick={() => void openNotification(item)}
                style={{ width: "100%", border: 0, background: "transparent", textAlign: "start", padding: "16px 12px", cursor: "pointer", display: "block" }}>
                <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "#374151" }}>
                    <strong style={{ color: "#111827" }}>{item.actor_username}</strong>
                    {item.notification_type === "question_comment" ? " به پرسش شما پاسخ داد" : " به دیدگاه شما پاسخ داد"}
                  </span>
                  <time dateTime={item.created_at} style={{ flexShrink: 0, color: "#9ca3af", fontSize: 12 }}>{timeAgo(item.created_at)}</time>
                </span>
                <span style={{ display: "block", color: "#111827", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.question_title}</span>
                <span style={{ display: "block", color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>{item.comment_body}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}