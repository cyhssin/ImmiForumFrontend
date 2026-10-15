"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { QuestionCardSkeleton } from "@/components/ui/Skeleton";
import { questionsApi, Question, QuestionListResponse } from "@/lib/api/questions";
import { reactionsApi } from "@/lib/api/reactions";
import { toast } from "@/components/ui/Toast";

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
  const [likedQuestionIds, setLikedQuestionIds] = useState<Set<string>>(new Set());
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<Set<string>>(new Set());
  const [reactingQuestionIds, setReactingQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    questionsApi.list({ page, size: 10, search: search || undefined, tag: tag || undefined })
      .then(setData)
      .catch((err) => setError(err?.message ?? "Failed to load questions"))
      .finally(() => setLoading(false));
  }, [page, search, tag]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      reactionsApi.likedQuestionIds(),
      reactionsApi.bookmarkedQuestionIds(),
    ]).then(([likes, bookmarks]) => {
      setLikedQuestionIds(new Set(likes.question_ids));
      setBookmarkedQuestionIds(new Set(bookmarks.question_ids));
    }).catch(() => {});
  }, [isAuthenticated]);

  async function toggleReaction(question: Question, kind: "like" | "bookmark") {
    if (!isAuthenticated || reactingQuestionIds.has(question.id)) return;
    setReactingQuestionIds((current) => new Set(current).add(question.id));
    try {
      if (kind === "like") {
        const result = await reactionsApi.toggleLike(question.id);
        setLikedQuestionIds((current) => {
          const updated = new Set(current);
          if (result.liked) updated.add(question.id);
          else updated.delete(question.id);
          return updated;
        });
        setData((current) => current && ({
          ...current,
          items: current.items.map((item) => item.id === question.id
            ? { ...item, likes_count: result.likes_count }
            : item),
        }));
      } else {
        const result = await reactionsApi.toggleBookmark(question.id);
        setBookmarkedQuestionIds((current) => {
          const updated = new Set(current);
          if (result.bookmarked) updated.add(question.id);
          else updated.delete(question.id);
          return updated;
        });
        setData((current) => current && ({
          ...current,
          items: current.items.map((item) => item.id === question.id
            ? { ...item, bookmarks_count: result.bookmarks_count }
            : item),
        }));
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "واکنش ثبت نشد", "error");
    } finally {
      setReactingQuestionIds((current) => {
        const updated = new Set(current);
        updated.delete(question.id);
        return updated;
      });
    }
  }

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
          <Link href="/questions/ask" style={{ background: "#0086cd", color: "white", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
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
          placeholder="جستجو در ایمی ..."
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" }}
        />
        <button type="submit" style={{ background: "#0086cd", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          جستجو
        </button>
        {search && (
          <button type="button" onClick={() => { setPage(1); router.push(tag ? `/questions?tag=${encodeURIComponent(tag)}` : "/questions"); }}
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer" }}>
            پاک کردن جستجو
          </button>
        )}
      </form>

      {tag && (
        <p style={{ fontSize: 13, color: "#6b7280", margin: "-12px 0 16px" }}>
          Tagged <strong>#{tag}</strong>{" "}
          <Link href={search ? `/questions?search=${encodeURIComponent(search)}` : "/questions"} onClick={() => setPage(1)} style={{ color: "#0086cd" }}>
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
            <Link href="/questions/ask" style={{ background: "#0086cd", color: "white", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Ask a Question
            </Link>
          )}
        </div>
      )}

      {/* Question list */}
      {!loading && !error && data && data.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.items.map((q: Question) => (
            <QuestionCard
              key={q.id}
              question={q}
              onTagClick={() => setPage(1)}
              isAuthenticated={isAuthenticated}
              liked={likedQuestionIds.has(q.id)}
              bookmarked={bookmarkedQuestionIds.has(q.id)}
              reacting={reactingQuestionIds.has(q.id)}
              onToggleReaction={toggleReaction}
            />
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

function QuestionCard({
  question: q,
  onTagClick,
  isAuthenticated,
  liked,
  bookmarked,
  reacting,
  onToggleReaction,
}: {
  question: Question;
  onTagClick: () => void;
  isAuthenticated: boolean;
  liked: boolean;
  bookmarked: boolean;
  reacting: boolean;
  onToggleReaction: (question: Question, kind: "like" | "bookmark") => void;
}) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#9ca3af" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span>by <strong style={{ color: "#374151" }}>{q.author.username}</strong></span>
          <span>{timeAgo(q.created_at)}</span>
          <span>💬 {q.comments_count}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              aria-label={liked ? "Unlike question" : "Like question"}
              aria-pressed={liked}
              title={isAuthenticated ? (liked ? "برداشتن پسند" : "پسندیدن پرسش") : "برای پسندیدن وارد شوید"}
              disabled={!isAuthenticated || reacting}
              onClick={() => onToggleReaction(q, "like")}
              style={{ minHeight: 34, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 8px", border: `1px solid ${liked ? "#0086cd" : "#d1d5db"}`, borderRadius: 7, color: liked ? "#0086cd" : "#4b5563", background: liked ? "#dff2ff" : "white", cursor: !isAuthenticated || reacting ? "not-allowed" : "pointer", opacity: !isAuthenticated || reacting ? 0.6 : 1 }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
              <span>{q.likes_count}</span>
            </button>
            <button
              type="button"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
              aria-pressed={bookmarked}
              title={isAuthenticated ? (bookmarked ? "حذف نشانک" : "ذخیره پرسش") : "برای ذخیره وارد شوید"}
              disabled={!isAuthenticated || reacting}
              onClick={() => onToggleReaction(q, "bookmark")}
              style={{ minHeight: 34, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 8px", border: `1px solid ${bookmarked ? "#0086cd" : "#d1d5db"}`, borderRadius: 7, color: bookmarked ? "#0086cd" : "#4b5563", background: bookmarked ? "#dff2ff" : "white", cursor: !isAuthenticated || reacting ? "not-allowed" : "pointer", opacity: !isAuthenticated || reacting ? 0.6 : 1 }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" />
              </svg>
              <span>{q.bookmarks_count}</span>
            </button>
          </div>
        </div>
      </div>
  );
}
