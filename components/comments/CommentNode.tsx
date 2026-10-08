"use client";

import { useState } from "react";
import { Comment } from "@/lib/api/comments";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

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

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface CommentNodeProps {
  comment: Comment;
  slug: string;
  currentUserId?: string;
  currentUserRole?: string;
  questionClosed: boolean;
  depth: number;
  onReplyAdded: (reply: Comment, parentId: string) => void;
  onCommentUpdated: (updated: Comment) => void;
  onCommentDeleted: (id: string) => void;
}

export function CommentNode({
  comment,
  slug,
  currentUserId,
  currentUserRole,
  questionClosed,
  depth,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
}: CommentNodeProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleting, setDeleting] = useState(false);

  const isAuthor = currentUserId === comment.author.id;
  const isMod = currentUserRole === "admin" || currentUserRole === "moderator";
  const isAuthenticated = !!currentUserId;

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setReplyLoading(true);
    setReplyError("");
    try {
      const data = await apiFetch(`/questions/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody.trim(), parent_id: comment.id }),
      });
      if (!data || data.error) throw new Error(data?.error?.message ?? "Failed to post reply");
      onReplyAdded(data as Comment, comment.id);
      setReplyBody("");
      setShowReplyForm(false);
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setReplyLoading(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBody.trim()) return;
    setEditLoading(true);
    setEditError("");
    try {
      const data = await apiFetch(`/comments/${comment.id}`, {
        method: "PUT",
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (!data || data.error) throw new Error(data?.error?.message ?? "Failed to update");
      onCommentUpdated(data as Comment);
      setEditing(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/comments/${comment.id}`, { method: "DELETE" });
      onCommentDeleted(comment.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  const indentLeft = Math.min(depth * 20, 80);

  return (
    <div id={`comment-${comment.id}`} style={{ marginInlineStart: indentLeft, marginTop: 12 }}>
      <div style={{
        background: depth === 0 ? "white" : "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "14px 16px",
        borderInlineStart: depth > 0 ? "3px solid #a5b4fc" : "1px solid #e5e7eb",
      }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0086cd", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {comment.author.username.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{comment.author.username}</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>·</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(comment.created_at)}</span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span style={{ fontSize: 11, color: "#d1d5db" }}>(edited)</span>
          )}
        </div>

        {/* Body or edit form */}
        {editing ? (
          <form onSubmit={submitEdit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              maxLength={5000}
              required
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none" }}
            />
            {editError && <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{editError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={editLoading}
                style={{ background: "#0086cd", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                {editLoading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setEditBody(comment.body); }}
                style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {comment.body}
          </p>
        )}

        {/* Action row */}
        {!editing && (
          <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center" }}>
            {isAuthenticated && !questionClosed && (
              <button onClick={() => setShowReplyForm((v) => !v)}
                style={{ background: "none", border: "none", fontSize: 12, color: "#6b7280", cursor: "pointer", padding: 0 }}>
                {showReplyForm ? "Cancel" : "↩ Reply"}
              </button>
            )}
            {isAuthor && (
              <button onClick={() => setEditing(true)}
                style={{ background: "none", border: "none", fontSize: 12, color: "#6b7280", cursor: "pointer", padding: 0 }}>
                Edit
              </button>
            )}
            {(isAuthor || isMod) && (
              <button onClick={handleDelete} disabled={deleting}
                style={{ background: "none", border: "none", fontSize: 12, color: "#ef4444", cursor: "pointer", padding: 0 }}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={submitReply} style={{ marginTop: 8, marginInlineStart: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Reply to ${comment.author.username}...`}
            rows={3}
            maxLength={5000}
            required
            autoFocus
            style={{ border: "1px solid #a5b4fc", borderRadius: 8, padding: "8px 10px", fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none" }}
          />
          {replyError && <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{replyError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={replyLoading}
              style={{ background: "#0086cd", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
              {replyLoading ? "Posting..." : "Post Reply"}
            </button>
            <button type="button" onClick={() => { setShowReplyForm(false); setReplyBody(""); }}
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              slug={slug}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              questionClosed={questionClosed}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
