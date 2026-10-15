// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      router.push("/questions");
      return;
    }
    router.push(`/questions?search=${encodeURIComponent(query)}`);
  }

  return (
    <div className="flex flex-col items-center gap-10 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          <span className="text-indigo-600">Immigrants Team</span>
        </h1>
        <p className="text-gray-500 text-lg">
          تجربه‌های واقعی، پاسخ‌های مفید، همراهی در مسیر مهاجرت
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/questions"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
          >
            پرسش‌ها را ببینید
          </Link>
          {!isAuthenticated && (
            <Link
              href="/auth/register"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              به انجمن بپیوندید
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar styled identical to /questions */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-xl flex gap-2"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="جستجو در ایمی ..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-3 text-sm font-semibold transition-colors cursor-pointer"
        >
          جستجو
        </button>
      </form>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-center">
        {[
          { icon: "❓", title: "سؤال بپرسید", desc: "پاسخ را از کسانی بگیرید که این مسیر را رفته‌اند." },
          { icon: "🌍", title: "تجربه‌تان را بگویید", desc: "تجربه‌تان می‌تواند راهگشای دیگران باشد." },
          { icon: "🔖", title: "ذخیره و دنبال کنید", desc: "پاسخ‌های مفید را ذخیره کنید و اعضای موردعلاقه‌تان را دنبال کنید." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}