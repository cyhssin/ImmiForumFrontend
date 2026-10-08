"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("در حال ورود...");

    try {
      const form = new URLSearchParams();
      form.append("grant_type", "password");
      form.append("username", username);
      form.append("password", password);
      form.append("scope", "");
      form.append("client_id", "");
      form.append("client_secret", "");

      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setStatus("خطا: " + (loginData.error?.message ?? JSON.stringify(loginData)));
        return;
      }

      const meRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${loginData.access_token}` },
      });
      const meData = await meRes.json();

      localStorage.setItem("auth-store", JSON.stringify({
        state: {
          user: {
            id: meData.id,
            username: meData.username,
            email: meData.email,
            role: meData.role,
            is_verified: meData.is_verified,
            avatar_url: meData.avatar_url,
            bio: meData.bio,
          },
          accessToken: loginData.access_token,
          refreshToken: loginData.refresh_token,
          isAuthenticated: true,
        },
        version: 0,
      }));

      setStatus("ورود موفق بود! در حال انتقال...");
      setTimeout(() => { window.location.href = "/questions"; }, 800);

    } catch (err) {
      setStatus("خطا: " + String(err));
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 32, background: "white", borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>ورود به حساب کاربری</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="نام کاربری یا ایمیل"
          required
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="گذرواژه"
          required
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}
        />
        <button
          type="submit"
          style={{ background: "#0086cd", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          ورود
        </button>
      </form>

      {status && (
        <div style={{ marginTop: 16, padding: 12, background: "#f3f4f6", borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>
          {status}
        </div>
      )}

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
        حساب کاربری ندارید؟ <a href="/auth/register" style={{ color: "#0086cd", fontWeight: 500 }}>ثبت‌نام کنید</a>
      </p>
    </div>
  );
}
