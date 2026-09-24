"use client";

import Link from "next/link";
import { useAuthStore } from "../../store/auth";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-indigo-600 text-lg tracking-tight">
          Immiforum
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
          <Link href="/questions" className="hover:text-indigo-600 transition-colors">Questions</Link>
          {isAuthenticated && (
            <Link href="/feed" className="hover:text-indigo-600 transition-colors">Feed</Link>
          )}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link href="/questions/ask">
                <Button size="sm">Ask Question</Button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Avatar src={user.avatar_url} username={user.username} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                    <Link
                      href={`/u/${user.username}`}
                      className="block px-4 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    {(user.role === "admin" || user.role === "moderator") && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-gray-50 text-indigo-600"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin Console
                      </Link>
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
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
