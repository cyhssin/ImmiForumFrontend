"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import Button from "@/components/ui/Button";

type Status = "idle" | "verifying" | "success" | "error" | "resending" | "resent";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-gray-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email") ?? "";
  const justRegistered = params.get("just_registered") === "1";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(email);

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("resending");
    try {
      await authApi.resendVerification(resendEmail);
      setStatus("resent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Could not resend email.");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6 text-center">

        {/* Just registered — waiting for email */}
        {!token && justRegistered && status === "idle" && (
          <>
            <div className="text-5xl">📬</div>
            <h1 className="text-xl font-bold text-gray-900">Check your inbox</h1>
            <p className="text-sm text-gray-500">
              We sent a verification link to <strong>{email}</strong>.
              Click it to activate your account.
            </p>
            <p className="text-xs text-gray-400">Did not receive it? Check spam or resend below.</p>
          </>
        )}

        {/* Generic resend form */}
        {!token && !justRegistered && status === "idle" && (
          <>
            <div className="text-5xl">✉️</div>
            <h1 className="text-xl font-bold text-gray-900">Verify your email</h1>
            <p className="text-sm text-gray-500">Enter your email to receive a new verification link.</p>
          </>
        )}

        {/* Verifying token */}
        {status === "verifying" && (
          <>
            <div className="text-5xl animate-pulse">🔄</div>
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-bold text-gray-900">Email verified!</h1>
            <p className="text-sm text-gray-500">Your account is now active. You can sign in.</p>
            <Link href="/auth/login">
              <Button className="w-full">Go to login</Button>
            </Link>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-xl font-bold text-gray-900">Verification failed</h1>
            <p className="text-sm text-red-600">{message}</p>
            <p className="text-xs text-gray-400">The link may have expired. Request a new one below.</p>
          </>
        )}

        {/* Resent */}
        {status === "resent" && (
          <>
            <div className="text-5xl">📨</div>
            <h1 className="text-xl font-bold text-gray-900">Email sent!</h1>
            <p className="text-sm text-gray-500">Check your inbox for the new verification link.</p>
          </>
        )}

        {/* Resend form — shown when not verifying/success */}
        {(status === "idle" || status === "error" || status === "resending") && (
          <form onSubmit={handleResend} className="flex flex-col gap-3 mt-2">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <Button type="submit" variant="secondary" loading={status === "resending"}>
              Resend verification email
            </Button>
          </form>
        )}

        <Link href="/auth/login" className="text-sm text-indigo-600 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
