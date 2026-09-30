"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { questionsApi, Question } from "@/lib/api/questions";
import { QuestionCardSkeleton, CommentSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import CommentsSection from "@/components/comments/CommentsSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getAuthStore() {
  try {
    const raw = localStorage.getItem("auth-store");
    if (!raw) return null;
    return JSON.parse(raw)?.state ?? null;
  } catch { return null; }
}

export default function QuestionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [auth, setAuth] = useState<{ user: { id: string; role: string; is_verified: boolean }; accessToken: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const store = getAuthStore();
    if (store?.user && store?.accessToken) setAuth(store);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    questionsApi.get(slug)
      .then((q) => {
        setQuestion(q);
        setLikesCount(q.likes_count);
        setBookmarksCount(q.bookmarks_count);
      })
      .catch((err) => setError(err?.message ?? "Question not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!auth || !question) return;
    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    Promise.all([
      fetch(`${API_URL}/users/me/likes`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/users/me/bookmarks`, { headers }).then(r => r.json()),
    ]).then(([likesData, bookmarksData]) => {
      setLiked((likesData.question_ids ?? []).includes(question.id));
      setBookmarked((bookmarksData.question_ids ?? []).includes(question.id));
    }).catch(() => {});
  }, [auth, question]);

  async function toggleLike() {
    if (!auth || !question || reacting) return;
    setReacting(true);
    try {
      const res = await fetch(`${API_URL}/questions/${question.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likes_count);
      toast(data.liked ? "Added to likes" : "Removed from likes");
    } catch {}
    setReacting(false);
  }

  async function toggleBookmark() {
    if (!auth || !question || reacting) return;
    setReacting(true);
    try {
      const res = await fetch(`${API_URL}/questions/${question.id}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await res.json();
      setBookmarked(data.bookmarked);
      setBookmarksCount(data.bookmarks_count);
      toast(data.bookmarked ? "Bookmarked" : "Bookmark removed");
    } catch {}
    setReacting(false);
  }

  async function handleDelete() {
    if (!question || !confirm("Delete this question? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const canModerate = auth?.user?.role === "admin" || auth?.user?.role === "moderator";
      if (canModerate) {
        await questionsApi.forceDelete(question.id);
      } else {
        await questionsApi.delete(question.id);
      }
      router.push("/questions");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  const isAuthor = auth?.user?.id === question?.author.id;

  async function handleModAction(action: "pin" | "unpin" | "close" | "reopen") {
    if (!question) return;
    try {
      const res = await fetch(`${API_URL}/admin/questions/${question.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Action failed");
      setQuestion((q) => q ? { ...q, status: data.status, is_pinned: data.is_pinned } : q);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  }
  const isMod = auth?.user?.role === "admin" || auth?.user?.role === "moderator";

  if (loading) return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <QuestionCardSkeleton />
      <div style={{ marginTop: 24 }}>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    </div>
  );

  if (error || !question) return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626", fontSize: 14 }}>
        {error ?? "Question not found"}
      </div>
      <Link href="/questions" style={{ display: "inline-block", marginTop: 16, color: "#4f46e5", fontSize: 14 }}>
        ← Back to questions
      </Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Link href="/questions" style={{ color: "#6b7280", fontSize: 14, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        ← Back to questions
      </Link>

      {/* Question card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28 }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {question.is_pinned && (
            <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>📌 Pinned</span>
          )}
          <span style={{ background: question.status === "open" ? "#dcfce7" : "#fee2e2", color: question.status === "open" ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>
            {question.status === "open" ? "Open" : "Closed"}
          </span>
          {question.category && (
            <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>
              {question.category.name}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px", lineHeight: 1.4 }}>
          {question.title}
        </h1>

        <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 20, whiteSpace: "pre-wrap" }}>
          {question.body}
        </div>

        {question.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {question.tags.map((t) => (
              <Link key={t.id} href={`/questions?tag=${encodeURIComponent(t.name)}`} style={{ background: "#eef2ff", color: "#4338ca", fontSize: 13, padding: "3px 10px", borderRadius: 99, textDecoration: "none" }}>
                {t.name}
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
            {question.author.username.slice(0, 2).toUpperCase()}
          </div>
          <Link href={`/u/${question.author.username}`} style={{ color: "#374151", fontWeight: 600, textDecoration: "none" }}>
            {question.author.username}
          </Link>
          <span>·</span>
          <span>{timeAgo(question.created_at)}</span>
        </div>

        {/* Reaction bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid #f3f4f6", flexWrap: "wrap" }}>
          <button onClick={toggleLike} disabled={!auth || reacting}
            style={{ display: "flex", alignItems: "center", gap: 6, background: liked ? "#eef2ff" : "#f9fafb", border: `1px solid ${liked ? "#a5b4fc" : "#e5e7eb"}`, borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: auth ? "pointer" : "default", color: liked ? "#4338ca" : "#6b7280", fontWeight: liked ? 600 : 400 }}>
            ♥ {likesCount}
          </button>
          <button onClick={toggleBookmark} disabled={!auth || reacting}
            style={{ display: "flex", alignItems: "center", gap: 6, background: bookmarked ? "#fefce8" : "#f9fafb", border: `1px solid ${bookmarked ? "#fde047" : "#e5e7eb"}`, borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: auth ? "pointer" : "default", color: bookmarked ? "#854d0e" : "#6b7280", fontWeight: bookmarked ? 600 : 400 }}>
            🔖 {bookmarksCount}
          </button>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>💬 {question.comments_count}</span>

          <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
            {isAuthor && (
              <Link href={`/questions/${question.slug}/edit`}
                style={{ fontSize: 13, color: "#4f46e5", textDecoration: "none", padding: "6px 12px", border: "1px solid #a5b4fc", borderRadius: 8 }}>
                Edit
              </Link>
            )}
            {(isAuthor || isMod) && (
              <button onClick={handleDelete} disabled={deleting}
                style={{ fontSize: 13, color: "#dc2626", background: "none", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderator action bar */}
      {isMod && question && (
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 20px", marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginInlineEnd: 4 }}>🛡 Mod Actions:</span>
          <button onClick={() => handleModAction(question.is_pinned ? "unpin" : "pin")}
            style={{ background: "white", border: "1px solid #fde68a", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", color: "#92400e" }}>
            {question.is_pinned ? "📌 Unpin" : "📌 Pin"}
          </button>
          <button onClick={() => handleModAction(question.status === "open" ? "close" : "reopen")}
            style={{ background: "white", border: "1px solid #fde68a", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", color: "#92400e" }}>
            {question.status === "open" ? "🔒 Close" : "🔓 Reopen"}
          </button>
          <Link href="/admin/moderation-logs" style={{ fontSize: 13, color: "#4f46e5", marginInlineStart: "auto" }}>
            View logs →
          </Link>
        </div>
      )}

      {/* Comments */}
      <CommentsSection
        slug={question.slug}
        questionClosed={question.status === "closed"}
        commentsCount={question.comments_count}
        currentUserId={auth?.user?.id}
        currentUserRole={auth?.user?.role}
        isAuthenticated={!!auth}
        isVerified={auth?.user?.is_verified ?? false}
      />
    </div>
  );
}
