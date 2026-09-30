import { api } from "./client";

export interface Tag {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface AuthorBrief {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export interface Question {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: "open" | "closed";
  is_pinned: boolean;
  author: AuthorBrief;
  category?: Category | null;
  tags: Tag[];
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionListResponse {
  items: Question[];
  total: number;
  page: number;
  size: number;
}

export interface CreateQuestionRequest {
  title: string;
  body: string;
  category_id?: number | null;
  tags?: string[];
}

export const questionsApi = {
  list: (params?: {
    page?: number;
    size?: number;
    search?: string;
    tag?: string;
    category_id?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    if (params?.search) q.set("search", params.search);
    if (params?.tag) q.set("tag", params.tag);
    if (params?.category_id) q.set("category_id", String(params.category_id));
    return api.get<QuestionListResponse>(`/questions?${q.toString()}`);
  },

  get: (slug: string) =>
    api.get<Question>(`/questions/${slug}`),

  create: (data: CreateQuestionRequest) =>
    api.post<Question>("/questions", data),

  update: (slug: string, data: Partial<CreateQuestionRequest>) =>
    api.put<Question>(`/questions/${slug}`, data),

  delete: (questionId: string) =>
    api.delete<null>(`/questions/${questionId}`),

  forceDelete: (questionId: string) =>
    api.delete<null>(`/admin/questions/${questionId}`),

  categories: () =>
    api.get<{ items: Category[]; total: number }>("/categories"),

  tags: () =>
    api.get<{ items: Tag[]; total: number }>("/tags"),
};
