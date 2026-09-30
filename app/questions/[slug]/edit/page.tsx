"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { questionsApi, Question, Category } from "@/lib/api/questions";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

export default function EditQuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("auth-store");
    const auth = stored ? JSON.parse(stored)?.state : null;
    if (!auth) { window.location.href = "/auth/login"; return; }

    Promise.all([
      questionsApi.get(slug),
      questionsApi.categories(),
    ]).then(([q, cats]) => {
      const q2 = q as Question;
      if (q2.author.id !== auth.user.id) {
        router.push(`/questions/${slug}`);
        return;
      }
      setQuestion(q2);
      setTitle(q2.title);
      setBody(q2.body);
      setTags(q2.tags.map((t) => t.name));
      setCategoryId(q2.category?.id ? String(q2.category.id) : null);
      setCategories((cats as { items: Category[] }).items ?? []);
    }).catch((err) => setError(err?.message ?? "Failed to load question"))
      .finally(() => setLoading(false));
  }, [slug, router]);

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
    setSaveError("");
    setSaving(true);

    const stored = localStorage.getItem("auth-store");
    const token = stored ? JSON.parse(stored)?.state?.accessToken : null;

    if (!token) {
      setSaveError("Session expired. Please log in again.");
      setSaving(false);
      return;
    }

    if (!question?.id) {
      setSaveError("Question ID missing.");
      setSaving(false);
      return;
    }

    // Build payload with correct field names from OpenAPI spec
    const payload: Record<string, unknown> = {
      title: title.trim(),
      body: body.trim(),
      tag_names: tags,
    };
    if (categoryId) payload.category_id = categoryId;

    try {
      const res = await fetch(`${API_URL}/questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.details?.length > 0) {
          const msgs = data.error.details.map(
            (d: { field: string; message: string }) => `${d.field}: ${d.message}`
          ).join(" | ");
          setSaveError(msgs);
        } else {
          setSaveError(data?.error?.message ?? "Failed to save");
        }
        return;
      }

      window.location.href = `/questions/${data.slug}`;
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>Loading...</div>
  );

  if (error || !question) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>
        {error || "Question not found"}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <Link href={`/questions/${slug}`}
        style={{ color: "#6b7280", fontSize: 14, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        ← Back to question
      </Link>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Edit Question</h1>

        {saveError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, color: "#dc2626", fontSize: 14, marginBottom: 20, whiteSpace: "pre-wrap" }}>
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Title <span style={{ color: "#dc2626" }}>*</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}> (min 10 chars)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={10}
              maxLength={200}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: title.length < 10 ? "#dc2626" : "#9ca3af", textAlign: "right" }}>
              {title.length}/200 {title.length < 10 ? `(need ${10 - title.length} more)` : ""}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Details <span style={{ color: "#dc2626" }}>*</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}> (min 20 chars)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={20}
              rows={10}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
            <span style={{ fontSize: 12, color: body.length < 20 ? "#dc2626" : "#9ca3af", textAlign: "right" }}>
              {body.length} chars {body.length < 20 ? `(need ${20 - body.length} more)` : ""}
            </span>
          </div>

          {categories.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Category</label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                style={{ ...inputStyle, background: "white" }}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Tags <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>(up to 5)</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="e.g. visa, canada"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addTag}
                style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {tags.map((t) => (
                  <span key={t} style={{ background: "#eef2ff", color: "#4338ca", fontSize: 13, padding: "3px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
                    {t}
                    <button type="button" onClick={() => removeTag(t)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, padding: 0, lineHeight: 1 }}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={saving || title.length < 10 || body.length < 20}
              style={{ background: (saving || title.length < 10 || body.length < 20) ? "#a5b4fc" : "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: (saving || title.length < 10 || body.length < 20) ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href={`/questions/${slug}`}
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
