import { api, ApiError } from "./client";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("username", data.username);
    form.append("password", data.password);
    form.append("scope", "");
    form.append("client_id", "");
    form.append("client_secret", "");
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new ApiError(
        json.error?.code ?? "unauthorized",
        json.error?.message ?? "Login failed",
        json.error?.details ?? null,
        json.request_id ?? ""
      );
    }
    return json;
  },

  register: (data: RegisterRequest) =>
    api.post<{ message: string }>("/auth/register", data),

  refresh: (refresh_token: string) =>
    api.post<AuthResponse>("/auth/refresh", { refresh_token }),

  verifyEmail: (token: string) =>
    api.post<{ message: string }>("/auth/verify-email", { token }),

  resendVerification: (email: string) =>
    api.post<{ message: string }>("/auth/resend-verification", { email }),

  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, new_password }),

  me: () => api.get<MeResponse>("/users/me"),
};
