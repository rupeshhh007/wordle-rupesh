import type { ErrorResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/** Custom error with parsed backend ErrorResponse */
export class ApiError extends Error {
  status: number;
  errorCode: string;
  path: string;

  constructor(response: ErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = response.status;
    this.errorCode = response.error;
    this.path = response.path;
  }
}

/** Specific error for 409 CONCURRENT_MODIFICATION */
export class ConcurrentModificationError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = "ConcurrentModificationError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wordle-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("wordle-auth");
  window.location.href = "/login";
}

async function parseErrorResponse(res: Response): Promise<ErrorResponse> {
  try {
    return await res.json();
  } catch {
    return {
      timestamp: new Date().toISOString(),
      status: res.status,
      error: "UNKNOWN",
      message: "Something went wrong. Please try again.",
      path: "",
    };
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const signal = options.signal || controller.signal;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.ok) {
    // Handle 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  const errorBody = await parseErrorResponse(res);

  // 401: clear auth, redirect to login
  if (res.status === 401) {
    clearAuthAndRedirect();
    throw new ApiError(errorBody);
  }

  // 409 CONCURRENT_MODIFICATION: specific error for callers
  if (res.status === 409 && errorBody.error === "CONCURRENT_MODIFICATION") {
    throw new ConcurrentModificationError(errorBody);
  }

  throw new ApiError(errorBody);
}

/** GET request */
export function get<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

/** POST request with JSON body */
export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}
