"use client";

import { useState, useEffect, useCallback } from "react";
import { Comment } from "@/lib/api/comments";
import { toast } from "@/components/ui/Toast";
import { CommentNode } from "./CommentNode";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state?.accessToken ?? null;
  } catch { return null; }
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

interface CommentsSectionProps {
  slug: string;
  questionClosed: boolean;
  commentsCount: number;
  currentUserId?: string;
  currentUserRole?: string;
  isAuthenticated: boolean;
  isVerified: boolean;
}

export default function CommentsSection({
  slug,
  questionClosed,
  commentsCount,
  currentUserId,
  currentUserRole,
  isAuthenticated,
  isVerified,
}: CommentsSectionProps) {
  // Backend returns already-nested tree (array of root comments with replies embedded)
  const [tree, setTree] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const loadComments = useCallback(() => {
    setLoading(true);
    setError("");
    apiFetch(`/questions/${slug}/comments?sort=oldest&size=100`)
      .then((res) => {
        // API returns a plain array (already nested), not {items:[]}
        const items: Comment[] = Array.isArray(res) ? res : (res?.items ?? []);
        setTree(items);
      })
      .catch((err) => setError(err?.message ?? "Failed to load comments"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { loadComments(); }, [loadComments]);

  function handleReplyAdded(reply: Comment, parentId: string) {
    // Add reply into the correct parent node in the tree
    function insertReply(comments: Comment[]): Comment[] {
      return comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies ?? []), reply] };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: insertReply(c.replies) };
        }
        return c;
      });
    }
    setTree((prev) => insertReply(prev));
  }

  function handleCommentUpdated(updated: Comment) {
    function updateNode(comments: Comment[]): Comment[] {
      return comments.map((c) => {
        if (c.id === updated.id) return { ...updated, replies: c.replies };
        if (c.replies && c.replies.length > 0) return { ...c, replies: updateNode(c.replies) };
        return c;
      });
    }
    setTree((prev) => updateNode(prev));
  }

  function handleCommentDeleted(id: string) {
    function removeNode(comments: Comment[]): Comment[] {
      return comments
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies ? removeNode(c.replies) : [] }));
    }
    setTree((prev) => removeNode(prev));
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    setPostError("");
    try {
      const token = getToken();
      console.log("[Comments] posting with token:", token ? token.slice(0, 20) + "..." : "NULL");
      const res = await fetch(`${API_URL}/questions/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      const data = await res.json();
      console.log("[Comments] post response:", data);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to post");
      setTree((prev) => [...prev, { ...data, replies: [] }]);
      setNewComment("");
      toast("Comment posted!");
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  // Count all comments including nested
  function countAll(comments: Comment[]): number {
    return comments.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
  }
  const totalComments = tree.length > 0 ? countAll(tree) : commentsCount;

  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginTop: 24 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
        Comments ({totalComments})
      </h2>

      {questionClosed && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#991b1b", marginBottom: 20 }}>
          This question is closed. No new comments can be added.
        </div>
      )}

      {!questionClosed && isAuthenticated && isVerified && (
        <form onSubmit={handlePostComment} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={4}
            maxLength={5000}
            required
            style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{newComment.length}/5000</span>
            <button type="submit" disabled={posting}
              style={{ background: posting ? "#a5b4fc" : "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: posting ? "not-allowed" : "pointer" }}>
              {posting ? "Posting..." : "Post Comment"}
            </button>
          </div>
          {postError && <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{postError}</p>}
        </form>
      )}

      {!questionClosed && isAuthenticated && !isVerified && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#92400e", marginBottom: 20 }}>
          Please <a href="/auth/verify-email" style={{ color: "#4f46e5" }}>verify your email</a> to post comments.
        </div>
      )}

      {!questionClosed && !isAuthenticated && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#6b7280", marginBottom: 20, textAlign: "center" }}>
          <a href="/auth/login" style={{ color: "#4f46e5", fontWeight: 600 }}>Sign in</a> to join the discussion.
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>Loading comments...</div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, color: "#dc2626", fontSize: 14 }}>{error}</div>
      )}

      {!loading && !error && tree.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
          <p style={{ fontSize: 14, margin: 0 }}>No comments yet. Be the first!</p>
        </div>
      )}

      {!loading && !error && tree.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {tree.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              slug={slug}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              questionClosed={questionClosed}
              depth={0}
              onReplyAdded={handleReplyAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
