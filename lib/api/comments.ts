import { api } from "./client";

export interface CommentAuthor {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export interface Comment {
  id: string;
  body: string;
  author: CommentAuthor;
  question_id: string;
  parent_id: string | null;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse {
  items: Comment[];
  total: number;
  page: number;
  size: number;
}

export const commentsApi = {
  list: (slug: string, sort: "oldest" | "newest" = "oldest") =>
    api.get<CommentListResponse>(`/questions/${slug}/comments?sort=${sort}&size=100`),

  create: (slug: string, body: string, parent_id?: string) =>
    api.post<Comment>(`/questions/${slug}/comments`, {
      body,
      ...(parent_id ? { parent_id } : {}),
    }),

  update: (id: string, body: string) =>
    api.put<Comment>(`/comments/${id}`, { body }),

  delete: (id: string) =>
    api.delete<null>(`/comments/${id}`),
};
