"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { QuestionCardSkeleton } from "@/components/ui/Skeleton";
import { questionsApi, Question, QuestionListResponse } from "@/lib/api/questions";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "48px 0" }}>Loading questions...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}

function QuestionsContent() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const tag = searchParams.get("tag") ?? "";
  useEffect(() => { document.title = "Questions — Immiforum"; }, []);
  const [data, setData] = useState<QuestionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    questionsApi.list({ page, size: 10, search: search || undefined, tag: tag || undefined })
      .then(setData)
      .catch((err) => setError(err?.message ?? "Failed to load questions"))
      .finally(() => setLoading(false));
  }, [page, search, tag]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const query = formData.get("search")?.toString().trim() ?? "";
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (tag) params.set("tag", tag);
    setPage(1);
    router.push(params.size ? `/questions?${params.toString()}` : "/questions");
  }

  const totalPages = data ? Math.ceil(data.total / data.size) : 1;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>پرسش‌ها</h1>
        {isAuthenticated && (
          <Link href="/questions/ask" style={{ background: "#4f46e5", color: "white", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            بپرسید
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          key={search}
          name="search"
          defaultValue={search}
          placeholder="جست و جو در پرسش‌ها"
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" }}
        />
        <button type="submit" style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          جست و جو
        </button>
        {search && (
          <button type="button" onClick={() => { setPage(1); router.push(tag ? `/questions?tag=${encodeURIComponent(tag)}` : "/questions"); }}
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer" }}>
            پاک کردن جست و جو
          </button>
        )}
      </form>

      {tag && (
        <p style={{ fontSize: 13, color: "#6b7280", margin: "-12px 0 16px" }}>
          Tagged <strong>#{tag}</strong>{" "}
          <Link href={search ? `/questions?search=${encodeURIComponent(search)}` : "/questions"} onClick={() => setPage(1)} style={{ color: "#4f46e5" }}>
            Clear tag
          </Link>
        </p>
      )}

      {/* Results count */}
      {data && (
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          {data.total} question{data.total !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}{tag ? ` tagged "${tag}"` : ""}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => <QuestionCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data?.items.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>هنوز پرسشی مطرح نشده</h3>
          <p style={{ fontSize: 14, margin: "0 0 20px" }}>
            {search ? `No results for "${search}"` : tag ? `No questions tagged "${tag}"` : "اولین سؤال را شما بپرسید و گفتگو را شروع کنید"}
          </p>
          {isAuthenticated && (
            <Link href="/questions/ask" style={{ background: "#4f46e5", color: "white", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Ask a Question
            </Link>
          )}
        </div>
      )}

      {/* Question list */}
      {!loading && !error && data && data.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.items.map((q: Question) => (
            <QuestionCard key={q.id} question={q} onTagClick={() => setPage(1)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, background: "white" }}
          >
            Previous
          </button>
          <span style={{ padding: "6px 14px", fontSize: 14, color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, background: "white" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question: q, onTagClick }: { question: Question; onTagClick: () => void }) {
  return (
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, transition: "box-shadow 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          {q.is_pinned && (
            <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
              📌 Pinned
            </span>
          )}
          {q.status === "closed" && (
            <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
              Closed
            </span>
          )}
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            <Link href={`/questions/${q.slug}`} style={{ color: "#111827", textDecoration: "none" }}>{q.title}</Link>
          </h2>
        </div>

        {/* Body preview */}
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {q.body}
        </p>

        {/* Tags */}
        {q.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {q.tags.map((t) => (
              <Link key={t.id} href={`/questions?tag=${encodeURIComponent(t.name)}`} onClick={onTagClick} style={{ background: "#eef2ff", color: "#4338ca", fontSize: 12, padding: "2px 8px", borderRadius: 99, textDecoration: "none" }}>
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#9ca3af" }}>
          <span>by <strong style={{ color: "#374151" }}>{q.author.username}</strong></span>
          <span>{timeAgo(q.created_at)}</span>
          <span>💬 {q.comments_count}</span>
          <span>♥ {q.likes_count}</span>
          <span>🔖 {q.bookmarks_count}</span>
        </div>
      </div>
  );
}
