"use client";

import { useState, useEffect } from "react";
import { usersApi } from "@/lib/api/users";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

export default function SettingsPage() {
  const [auth, setAuth] = useState<{ user: { username: string; email: string; bio?: string; avatar_url?: string } } | null>(null);
  const [form, setForm] = useState({ username: "", bio: "", avatar_url: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const a = getAuth();
    if (!a) { window.location.href = "/auth/login"; return; }
    document.title = "تنظیمات — ایمی‌فروم";
    setAuth(a);
    setForm({
      username: a.user.username ?? "",
      bio: a.user.bio ?? "",
      avatar_url: a.user.avatar_url ?? "",
    });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg("");
    setProfileError("");
    try {
      const stored = localStorage.getItem("auth-store");
      const token = stored ? JSON.parse(stored)?.state?.accessToken : null;
      if (!token) { setProfileError("نشست شما منقضی شده است. دوباره وارد شوید."); setSaving(false); return; }

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ username: form.username, bio: form.bio, avatar_url: form.avatar_url }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data?.error?.message ?? "به‌روزرسانی انجام نشد."); return; }

      // Update localStorage
      const raw = localStorage.getItem("auth-store");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.state.user.username = data.username;
        parsed.state.user.bio = data.bio;
        parsed.state.user.avatar_url = data.avatar_url;
        localStorage.setItem("auth-store", JSON.stringify(parsed));
      }
      setProfileMsg("اطلاعات حساب با موفقیت به‌روزرسانی شد.");
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "به‌روزرسانی پروفایل انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg("");
    setPwError("");
    try {
      await usersApi.changePassword(pwForm);
      setPwMsg("گذرواژه تغییر کرد. تا چند لحظه دیگر از حساب خارج می‌شوید.");
      // Backend has no JWT revocation — force logout after password change
      setTimeout(() => {
        localStorage.removeItem("auth-store");
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "تغییر گذرواژه انجام نشد.");
    } finally {
      setSavingPw(false);
    }
  }

  if (!auth) return null;

  const inputStyle = { border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 14, fontWeight: 600 as const, color: "#374151", display: "block" as const, marginBottom: 4 };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>تنظیمات</h1>

      {/* Profile section */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>اطلاعات پروفایل</h2>
        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>نام کاربری</label>
            <input style={inputStyle} value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} required minLength={3} maxLength={50} />
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>فقط از حروف، عدد و زیرخط استفاده کنید.</p>
          </div>
          <div>
            <label style={labelStyle}>درباره من</label>
            <textarea style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} maxLength={500} />
          </div>
          <div>
            <label style={labelStyle}>نشانی تصویر پروفایل</label>
            <input style={inputStyle} type="url" value={form.avatar_url} onChange={(e) => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://example.com/avatar.jpg" />
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>نشانی مستقیم تصویر را وارد کنید؛ امکان بارگذاری فایل وجود ندارد.</p>
          </div>
          {profileMsg && <p style={{ fontSize: 14, color: "#16a34a", margin: 0 }}>✓ {profileMsg}</p>}
          {profileError && <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{profileError}</p>}
          <button type="submit" disabled={saving}
            style={{ background: saving ? "#a5b4fc" : "#0086cd", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", alignSelf: "flex-start" }}>
            {saving ? "در حال ذخیره..." : "ذخیره پروفایل"}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>تغییر گذرواژه</h2>
        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>گذرواژه فعلی</label>
            <input style={inputStyle} type="password" value={pwForm.current_password} onChange={(e) => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>گذرواژه جدید</label>
            <input style={inputStyle} type="password" value={pwForm.new_password} onChange={(e) => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={8} />
          </div>
          {pwMsg && <p style={{ fontSize: 14, color: "#16a34a", margin: 0 }}>✓ {pwMsg}</p>}
          {pwError && <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{pwError}</p>}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
            ⚠️ پس از تغییر گذرواژه، از حساب کاربری خارج خواهید شد.
          </div>
          <button type="submit" disabled={savingPw}
            style={{ background: savingPw ? "#fca5a5" : "#dc2626", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: savingPw ? "not-allowed" : "pointer", alignSelf: "flex-start" }}>
            {savingPw ? "در حال تغییر..." : "تغییر گذرواژه"}
          </button>
        </form>
      </div>
    </div>
  );
}
