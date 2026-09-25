"use client";

import { useEffect, useState } from "react";

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/auth/login"; return; }
    const role = auth.user?.role;
    if (role === "admin" || role === "moderator") {
      setAllowed(true);
    } else {
      setAllowed(false);
    }
  }, []);

  if (allowed === null) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>Checking permissions...</div>
  );

  if (!allowed) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Access Denied</h2>
      <p style={{ fontSize: 14, color: "#6b7280" }}>You need moderator or admin privileges to access this page.</p>
    </div>
  );

  return <>{children}</>;
}
