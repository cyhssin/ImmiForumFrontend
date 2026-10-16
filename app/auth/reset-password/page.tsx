"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center text-gray-500">در حال بارگذاری...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("پیوند بازیابی معتبر نیست. دوباره درخواست پیوند کنید.");
      return;
    }
    if (password !== confirmPassword) {
      setError("گذرواژه و تکرار آن یکسان نیستند.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر گذرواژه انجام نشد. پیوند ممکن است منقضی شده باشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">🔑</div>
          <h1 className="text-xl font-bold text-gray-900">تنظیم گذرواژهٔ جدید</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">گذرواژهٔ تازهٔ خود را وارد کنید.</p>
        </div>

        {done ? (
          <div className="flex flex-col gap-4 text-center">
            <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              گذرواژه با موفقیت تغییر کرد.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">ورود به حساب</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="گذرواژهٔ جدید"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
            />
            <Input
              label="تکرار گذرواژهٔ جدید"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              ذخیرهٔ گذرواژهٔ جدید
            </Button>
          </form>
        )}

        {!done && (
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:underline">
              درخواست پیوند تازه
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}