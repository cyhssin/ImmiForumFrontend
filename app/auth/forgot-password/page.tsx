"use client";

import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setError("ارسال درخواست ممکن نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">بازیابی گذرواژه</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            ایمیل حساب خود را وارد کنید تا پیوند تنظیم گذرواژهٔ تازه برایتان ارسال شود.
          </p>
        </div>

        {submitted ? (
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm leading-6 text-green-800">
            اگر حساب فعالی با این ایمیل وجود داشته باشد، پیوند بازیابی برایتان ارسال می‌شود. پوشهٔ هرزنامه را هم بررسی کنید.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="ایمیل حساب کاربری"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              autoFocus
            />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              ارسال پیوند بازیابی
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
            بازگشت به ورود
          </Link>
        </p>
      </section>
    </div>
  );
}