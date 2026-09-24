"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.register(form);
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}&just_registered=1`);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const fe: Record<string, string> = {};
        err.details.forEach((d) => { fe[d.field] = d.message; });
        setFieldErrors(fe);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join the Immiforum community</p>
        </div>

        {error && <ErrorMessage error={error} />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            required
            autoFocus
          />
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="your_username"
            value={form.username}
            onChange={handleChange}
            error={fieldErrors.username}
            required
          />
          <p className="text-xs text-gray-400 -mt-2">
            3–50 characters, letters, numbers and underscores only.
          </p>
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            required
          />
          <Button type="submit" loading={loading} className="w-full mt-1">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
