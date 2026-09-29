"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usersApi, PublicProfile } from "@/lib/api/users";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 86400) return "today";
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function getAuth() {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state ?? null;
  } catch { return null; }
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [questions, setQuestions] = useState<unknown[]>([]);
  const [comments, setComments] = useState<unknown[]>([]);
  const [tab, setTab] = useState<"questions" | "comments">("questions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [auth, setAuth] = useState<{ user: { username: string } } | null>(null);

  useEffect(() => { setAuth(getAuth()); }, []);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      usersApi.getProfile(username),
      usersApi.getUserQuestions(username),
      usersApi.getUserComments(username),
      usersApi.getFollowState(username),
    ]).then(([prof, qs, cs, fs]) => {
      setProfile(prof as PublicProfile);
      setQuestions((qs as { items: unknown[] }).items ?? []);
      setComments((cs as { items: unknown[] }).items ?? []);
      setIsFollowing((fs as { is_following: boolean | null }).is_following);
    }).catch((err) => setError(err?.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleFollow() {
    if (!auth) { window.location.href = "/auth/login"; return; }
    setFollowLoading(true);
    try {
      const res = await usersApi.toggleFollow(username) as { is_following: boolean };
      setIsFollowing(res.is_following);
    } catch {}
    setFollowLoading(false);
  }

  const isOwnProfile = auth?.user?.username === username;

  if (loading) return <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>Loading...</div>;
  if (error || !profile) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#dc2626" }}>{error || "User not found"}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Profile card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, flexShrink: 0, overflow: "hidden", flexShrink: 0 }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              : profile.username.slice(0, 2).toUpperCase()
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{profile.username}</h1>
            {profile.bio && <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 8px" }}>{profile.bio}</p>}
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Joined {timeAgo(profile.created_at)}</p>
          </div>

          {/* Follow / Edit button */}
          {!isOwnProfile && auth && (
            <button onClick={handleFollow} disabled={followLoading}
              style={{ background: isFollowing ? "#f3f4f6" : "#4f46e5", color: isFollowing ? "#374151" : "white", border: isFollowing ? "1px solid #d1d5db" : "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
          {isOwnProfile && (
            <Link href="/settings" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Edit Profile
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
          {[
            { label: "Questions", value: profile.questions_count },
            { label: "Comments", value: profile.comments_count },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["questions", "comments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: tab === t ? "#4f46e5" : "#f3f4f6", color: tab === t ? "white" : "#6b7280" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {tab === "questions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>No questions yet.</p>}
          {(questions as Array<{ slug: string; title: string; status: string; is_pinned: boolean; likes_count: number; comments_count: number; created_at: string }>).map((q) => (
            <Link key={q.slug} href={`/questions/${q.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  {q.is_pinned && <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>📌 Pinned</span>}
                  <span style={{ background: q.status === "open" ? "#dcfce7" : "#fee2e2", color: q.status === "open" ? "#166534" : "#991b1b", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{q.status}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{q.title}</p>
                <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", gap: 12 }}>
                  <span>♥ {q.likes_count}</span>
                  <span>💬 {q.comments_count}</span>
                  <span>{timeAgo(q.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Comments tab */}
      {tab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>No comments yet.</p>}
          {(comments as Array<{ id: string; body: string; question_slug: string; question_title: string; created_at: string }>).map((c) => (
            <Link key={c.id} href={`/questions/${c.question_slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px" }}>on <strong style={{ color: "#4f46e5" }}>{c.question_title}</strong></p>
                <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.body}</p>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{timeAgo(c.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
