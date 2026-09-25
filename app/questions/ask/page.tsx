"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { questionsApi, Category, Tag } from "@/lib/api/questions";

export default function AskPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    questionsApi.categories()
      .then((res) => setCategories(res.items ?? []))
      .catch(() => {});
  }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!user?.is_verified) { setError("Please verify your email before posting."); return; }

    setError(null);
    setLoading(true);
    try {
      const q = await questionsApi.create({
        title,
        body,
        category_id: categoryId ?? undefined,
        tags,
      });
      router.push(`/questions/${q.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Sign in to ask a question</h2>
        <Link href="/auth/login" style={{ background: "#4f46e5", color: "white", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <Link href="/questions" style={{ color: "#6b7280", fontSize: 14, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        ← Back to questions
      </Link>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Ask a Question</h1>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, color: "#dc2626", fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Title <span style={{ color: "#dc2626" }}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is your question? Be specific."
              required
              maxLength={200}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none" }}
            />
            <span style={{ fontSize: 12, color: "#9ca3af", textAlign: "right" }}>{title.length}/200</span>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Details <span style={{ color: "#dc2626" }}>*</span></label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your situation in detail. Include what you have tried and what you need help with."
              required
              rows={8}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Category</label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", background: "white" }}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Tags <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>(up to 5)</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="e.g. visa, canada, work-permit"
                style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" }}
              />
              <button type="button" onClick={addTag} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {tags.map((t) => (
                  <span key={t} style={{ background: "#eef2ff", color: "#4338ca", fontSize: 13, padding: "3px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
                    {t}
                    <button type="button" onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: loading ? "#a5b4fc" : "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Posting..." : "Post Question"}
          </button>
        </form>
      </div>
    </div>
  );
}
