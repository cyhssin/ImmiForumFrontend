const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state?.accessToken ?? null;
  } catch { return null; }
}

function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    return JSON.parse(raw ?? "")?.state?.refreshToken ?? null;
  } catch { return null; }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = localStorage.getItem("auth-store");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = data.access_token;
      localStorage.setItem("auth-store", JSON.stringify(parsed));
    }
    return data.access_token;
  } catch { return null; }
}

export async function apiFetch(path: string, init?: RequestInit, retry = true): Promise<unknown> {
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
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch(path, init, false);
    localStorage.removeItem("auth-store");
    window.location.href = "/auth/login";
    return null;
  }
  return res.json();
}

export interface PublicProfile {
  id: string;
  username: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  questions_count: number;
  comments_count: number;
  created_at: string;
}

export interface MyStats {
  questions_count: number;
  comments_count: number;
  likes_given_count: number;
  likes_received_count: number;
  bookmarks_count: number;
}

export interface FeedItem {
  activity_type: "question_created" | "comment_created";
  user: { id: string; username: string; avatar_url?: string | null };
  question_slug: string;
  question_title: string;
  comment_id?: string;
  snippet?: string;
  created_at: string;
}

export interface FollowState {
  is_following: boolean | null;
}

export const usersApi = {
  getProfile: (username: string) =>
    apiFetch(`/users/${username}`) as Promise<PublicProfile>,

  getMyStats: () =>
    apiFetch("/users/me/stats") as Promise<MyStats>,

  getMyQuestions: () =>
    apiFetch("/users/me/liked") as Promise<{ items: unknown[] }>,

  getUserQuestions: (username: string, status?: string) =>
    apiFetch(`/users/${username}/questions${status ? `?status=${status}` : ""}`) as Promise<{ items: unknown[]; total: number }>,

  getUserComments: (username: string) =>
    apiFetch(`/users/${username}/comments`) as Promise<{ items: unknown[]; total: number }>,

  getMyBookmarks: () =>
    apiFetch("/users/me/bookmarks") as Promise<{ question_ids: string[] }>,

  getMyLiked: () =>
    apiFetch("/users/me/liked") as Promise<{ question_ids: string[] }>,

  getFeed: () =>
    apiFetch("/users/me/feed") as Promise<{ items: FeedItem[] }>,

  getFollowState: (username: string) =>
    apiFetch(`/users/${username}/follow-state`) as Promise<FollowState>,

  toggleFollow: (username: string) =>
    apiFetch(`/users/${username}/follow`, { method: "POST" }) as Promise<{ is_following: boolean }>,

  getFollowing: (username: string) =>
    apiFetch(`/users/${username}/following`) as Promise<{ items: unknown[] }>,

  getFollowers: (username: string) =>
    apiFetch(`/users/${username}/followers`) as Promise<{ items: unknown[] }>,

  updateMe: (data: { username?: string; bio?: string; avatar_url?: string }) =>
    apiFetch("/users/me", { method: "PUT", body: JSON.stringify(data) }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiFetch("/users/me/password", { method: "PUT", body: JSON.stringify(data) }),
};
