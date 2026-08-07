import { useAuthStore } from "@/store/auth-store";
import { ApiRequestError } from "@/types/api";
import type { ApiSuccess, ApiError } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const body: ApiSuccess<{ accessToken: string }> = await res.json();
        useAuthStore.getState().setAccessToken(body.data.accessToken);
        return body.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawRequest<T>(
  endpoint: string,
  options: RequestInit,
  token: string | null
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();

  if (!res.ok) {
    const err = body as ApiError;
    throw new ApiRequestError(res.status, err.message, err.errors);
  }

  return (body as ApiSuccess<T>).data;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthEndpoint = endpoint.startsWith("/auth/");
  const token = useAuthStore.getState().accessToken;

  try {
    return await rawRequest<T>(endpoint, options, token);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401 && !isAuthEndpoint) {
      let newToken: string;
      try {
        newToken = await refreshAccessToken();
      } catch {
        // Chỉ logout khi chính việc refresh token thất bại (refresh token hết hạn/invalid).
        // Không logout nếu request retry sau đó lỗi vì lý do khác (mạng chập chờn...),
        // vì lúc đó access token mới đã hợp lệ, không nên xoá.
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw err;
      }
      return await rawRequest<T>(endpoint, options, newToken);
    }
    throw err;
  }
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const body = await res.json();
  if (!res.ok) throw new ApiRequestError(res.status, body.message, body.errors);
  return (body as ApiSuccess<T>).data;
}
