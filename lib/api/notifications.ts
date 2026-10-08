import { api } from "./client";

export interface NotificationItem {
  id: string;
  notification_type: "question_comment" | "comment_reply";
  actor_username: string;
  comment_id: string;
  comment_body: string;
  question_slug: string;
  question_title: string;
  created_at: string;
  read_at: string | null;
}

export interface NotificationList {
  items: NotificationItem[];
  unread_count: number;
}

export const notificationsApi = {
  list: () => api.get<NotificationList>("/notifications"),
  unreadCount: () => api.get<{ unread_count: number; total_count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put<void>("/notifications/read-all"),
};