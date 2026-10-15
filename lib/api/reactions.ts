import { api } from "./client";

interface QuestionIdsResponse {
  question_ids: string[];
}

export const reactionsApi = {
  likedQuestionIds: () => api.get<QuestionIdsResponse>("/users/me/likes"),
  bookmarkedQuestionIds: () => api.get<QuestionIdsResponse>("/users/me/bookmark-ids"),
  toggleLike: (questionId: string) =>
    api.post<{ liked: boolean; likes_count: number }>(`/questions/${questionId}/like`),
  toggleBookmark: (questionId: string) =>
    api.post<{ bookmarked: boolean; bookmarks_count: number }>(`/questions/${questionId}/bookmark`),
};