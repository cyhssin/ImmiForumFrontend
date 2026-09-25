import { apiFetch } from "./users";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  questions_count?: number;
  comments_count?: number;
}

export interface ModerationLog {
  id: string;
  moderator_id: string;
  moderator_username?: string;
  action: string;
  target_type: string;
  target_id: string;
  detail?: string;
  created_at: string;
}

export const adminApi = {
  getUsers: (search?: string) =>
    apiFetch(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`) as Promise<{ items: AdminUser[]; total: number }>,

  getUser: (id: string) =>
    apiFetch(`/admin/users/${id}`) as Promise<AdminUser>,

  setUserStatus: (id: string, is_active: boolean) =>
    apiFetch(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active }),
    }),

  setUserRole: (id: string, role: string) =>
    apiFetch(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  getRoles: () =>
    apiFetch("/admin/roles") as Promise<{ items: { id: number; name: string }[] }>,

  getModerationLogs: (params?: { action?: string; moderator_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set("action", params.action);
    if (params?.moderator_id) q.set("moderator_id", params.moderator_id);
    return apiFetch(`/admin/moderation-logs?${q.toString()}`) as Promise<{ items: ModerationLog[]; total: number }>;
  },

  pinQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}/pin`, { method: "POST" }),

  unpinQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}/unpin`, { method: "POST" }),

  closeQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}/close`, { method: "POST" }),

  reopenQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}/reopen`, { method: "POST" }),

  deleteQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}`, { method: "DELETE" }),

  deleteComment: (id: string) =>
    apiFetch(`/admin/comments/${id}`, { method: "DELETE" }),
};
