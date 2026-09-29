"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-indigo-600 text-lg tracking-tight">
          Immiforum
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: "#6b7280" }}>
          <a href="/questions" style={{ textDecoration: "none", color: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
            Questions
          </a>
          {isAuthenticated && (
            <a href="/feed" style={{ textDecoration: "none", color: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
              Feed
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link href="/questions/ask">
                <Button size="sm">Ask Question</Button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: "none", cursor: "pointer", padding: 0, background: "#4f46e5" }}
                >
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.username} style={{ width: 32, height: 32, objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    : <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>{user.username.slice(0, 2).toUpperCase()}</span>
                  }
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                    <Link href={`/u/${user.username}`} className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Settings</Link>
                    {(user.role === "admin" || user.role === "moderator") && (
                      <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50 text-indigo-600" onClick={() => setMenuOpen(false)}>Admin Console</Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/auth/register"><Button size="sm">Register</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
