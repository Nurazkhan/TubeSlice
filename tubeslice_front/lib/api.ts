import type { SliceTask, User, VideoMetadata } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";

type RequestOptions = {
  token?: string | null;
  body?: unknown;
};

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const getHeaders = (options?: RequestOptions): HeadersInit => {
  const headers: HeadersInit = {};

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
};

async function requestJson<T>(path: string, init: RequestInit = {}, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getHeaders(options),
      ...init.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : init.body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.detail ?? payload?.message ?? "Backend request failed";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const api = {
  baseUrl: API_BASE_URL,

  signup: (body: { first_name: string; last_name: string; email: string; password: string }) =>
    requestJson<User>("/signup", { method: "POST" }, { body }),

  login: (body: { email: string; password: string }) =>
    requestJson<{ token: string }>("/login", { method: "POST" }, { body }),

  dashboard: (token: string) => requestJson<{ data: string }>("/dashboard", { method: "GET" }, { token }),

  info: (url: string, token?: string | null) =>
    requestJson<VideoMetadata>("/info", { method: "POST" }, { body: { url }, token }),

  slice: (
    body: {
      url: string;
      quality?: string;
      format_id?: string;
      segments?: Array<{ start_time: number; end_time: number }>;
    },
    token?: string | null,
  ) => requestJson<SliceTask>("/slice", { method: "POST" }, { body, token }),

  status: (taskId: string, token?: string | null) =>
    requestJson<SliceTask>(`/status/${encodeURIComponent(taskId)}`, { method: "GET" }, { token }),

  downloadUrl: (segmentId: string) => `${API_BASE_URL}/download/${encodeURIComponent(segmentId)}`,
};

export { ApiError };
