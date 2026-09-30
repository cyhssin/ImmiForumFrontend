const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1";

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details: { field: string; message: string; input?: unknown }[] | null,
    public request_id: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-store");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
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
    // Update zustand persisted store directly
    const raw = localStorage.getItem("auth-store");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = data.access_token;
      localStorage.setItem("auth-store", JSON.stringify(parsed));
    }
    return data.access_token;
  } catch {
    return null;
  }
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };
}

export async function request<T = unknown>(
  path: string,
  init?: RequestInit,
  retry = true
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
  });

  // 204 No Content — all DELETE endpoints
  if (res.status === 204) return null as T;

  // 401 — try refresh once
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, init, false);
    // Force logout
    localStorage.removeItem("auth-store");
    window.location.href = "/auth/login";
    return null as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Non-JSON response (${res.status}) — check NEXT_PUBLIC_API_URL or proxy config`
    );
  }

  const data = await res.json();

  if (!res.ok) {
    const err = data.error ?? {};
    throw new ApiError(
      err.code ?? "internal_error",
      err.message ?? "An unexpected error occurred",
      err.details ?? null,
      data.request_id ?? ""
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};
