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
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-gray-500">در حال بارگذاری...</div>}>
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
        setMessage(err instanceof ApiError ? err.message : "تأیید ایمیل ناموفق بود.");
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
      setMessage(err instanceof ApiError ? err.message : "ارسال دوباره ایمیل ممکن نشد.");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6 text-center">

        {/* Just registered — waiting for email */}
        {!token && justRegistered && status === "idle" && (
          <>
            <div className="text-5xl">📬</div>
            <h1 className="text-xl font-bold text-gray-900">صندوق ورودی خود را بررسی کنید</h1>
            <p className="text-sm text-gray-500">
              پیوند تأیید را به <strong>{email}</strong> فرستادیم.
              برای فعال‌کردن حساب خود، روی پیوند کلیک کنید.
            </p>
            <p className="text-xs text-gray-400">ایمیلی دریافت نکردید؟ پوشه هرزنامه را بررسی کنید یا از پایین دوباره ارسال کنید.</p>
          </>
        )}

        {/* Generic resend form */}
        {!token && !justRegistered && status === "idle" && (
          <>
            <div className="text-5xl">✉️</div>
            <h1 className="text-xl font-bold text-gray-900">تأیید ایمیل</h1>
            <p className="text-sm text-gray-500">برای دریافت پیوند تازه، ایمیل خود را وارد کنید.</p>
          </>
        )}

        {/* Verifying token */}
        {status === "verifying" && (
          <>
            <div className="text-5xl animate-pulse">🔄</div>
            <p className="text-gray-600">در حال تأیید ایمیل...</p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-bold text-gray-900">ایمیل شما تأیید شد!</h1>
            <p className="text-sm text-gray-500">حساب شما فعال شد. اکنون می‌توانید وارد شوید.</p>
            <Link href="/auth/login">
              <Button className="w-full">ورود به حساب</Button>
            </Link>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-xl font-bold text-gray-900">تأیید ایمیل انجام نشد</h1>
            <p className="text-sm text-red-600">{message}</p>
            <p className="text-xs text-gray-400">ممکن است پیوند منقضی شده باشد. از پایین پیوند تازه‌ای درخواست کنید.</p>
          </>
        )}

        {/* Resent */}
        {status === "resent" && (
          <>
            <div className="text-5xl">📨</div>
            <h1 className="text-xl font-bold text-gray-900">ایمیل ارسال شد!</h1>
            <p className="text-sm text-gray-500">پیوند تأیید تازه را در صندوق ورودی خود بررسی کنید.</p>
          </>
        )}

        {/* Resend form — shown when not verifying/success */}
        {(status === "idle" || status === "error" || status === "resending") && (
          <form onSubmit={handleResend} className="flex flex-col gap-3 mt-2">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="ایمیل شما"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <Button type="submit" variant="secondary" loading={status === "resending"}>
              ارسال دوباره ایمیل تأیید
            </Button>
          </form>
        )}

        <Link href="/auth/login" className="text-sm text-indigo-600 hover:underline">
          بازگشت به صفحه ورود
        </Link>
      </div>
    </div>
  );
}
