"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import Button from "@/components/ui/Button";
import { notificationsApi } from "@/lib/api/notifications";
import { useEffect, useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const refreshCount = () => {
      notificationsApi.unreadCount()
        .then((result) => { if (active) setNotificationCount(result.total_count); })
        .catch(() => {});
    };
    refreshCount();
    const interval = window.setInterval(refreshCount, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-indigo-600 text-lg tracking-tight">
          Immiforum
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: "#6b7280" }}>
          <a href="/questions" style={{ textDecoration: "none", color: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0086cd")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
            پرسش‌ها
          </a>
          {isAuthenticated && (
            <a href="/feed" style={{ textDecoration: "none", color: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0086cd")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
              خبرها
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link href="/questions/ask">
                <Button size="sm">بپرسید</Button>
              </Link>
              <Link
                href="/notifications"
                aria-label={`اعلان‌ها، ${notificationCount} اعلان`}
                title="اعلان‌ها"
                style={{ width: 36, height: 36, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", color: "#4b5563", textDecoration: "none" }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {notificationCount > 0 && (
                  <span aria-hidden="true" style={{ position: "absolute", top: -2, insetInlineEnd: -4, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9, background: "#dc2626", color: "white", fontSize: 10, lineHeight: "17px", fontWeight: 700, textAlign: "center", border: "2px solid white", boxSizing: "content-box" }}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: "none", cursor: "pointer", padding: 0, background: "#0086cd" }}
                >
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.username} style={{ width: 32, height: 32, objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    : <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>{user.username.slice(0, 2).toUpperCase()}</span>
                  }
                </button>
                {menuOpen && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                    <Link href={`/u/${user.username}`} className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>پروفایل</Link>
                    <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>داشبورد</Link>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>تنظیمات</Link>
                    {(user.role === "admin" || user.role === "moderator") && (
                      <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50 text-indigo-600" onClick={() => setMenuOpen(false)}>ادمین پنل</Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-start px-4 py-2 hover:bg-gray-50 text-red-600"
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">ورود</Button></Link>
              <Link href="/auth/register"><Button size="sm">ثبت نام</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
