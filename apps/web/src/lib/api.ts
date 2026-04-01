const TOKEN_KEY = "devmock_token";
const USER_KEY = "devmock_user";

export type AuthUser = { id: string; username: string; email: string | null };

/**
 * Dev: Vite proxy → API (relative URL).
 * Production: set VITE_API_ORIGIN=https://your-api.onrender.com (no trailing slash).
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/** Chuẩn hóa lỗi mạng (ETIMEDOUT, ECONNREFUSED, Failed to fetch…) thành thông báo có thể hành động. */
export function mapNetworkError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  const cause =
    e && typeof e === "object" && "cause" in e
      ? (e as { cause?: unknown }).cause
      : undefined;
  const causeMsg = cause instanceof Error ? cause.message : String(cause ?? "");
  const combined = `${msg} ${causeMsg}`;

  const isNet =
    combined.includes("ETIMEDOUT") ||
    combined.includes("ECONNREFUSED") ||
    combined.includes("ENOTFOUND") ||
    combined.includes("Failed to fetch") ||
    combined.includes("NetworkError") ||
    combined.includes("Load failed") ||
    combined.includes("fetch failed");

  if (!isNet) {
    return e instanceof Error ? e : new Error(String(e));
  }

  const origin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return new Error(
      `Hết thời gian chờ khi gọi API (${origin}). Render Free hay sleep: mở tab mới gõ URL API + /health, đợi 1–2 phút rồi thử lại. Hoặc kiểm tra máy chủ / mạng.`
    );
  }
  return new Error(
    "Không kết nối được API (timeout / từ chối kết nối). Hãy chạy API: trong `code` gõ `pnpm dev` (port 3000). Web `pnpm dev:web` — đừng set VITE_API_ORIGIN khi dùng proxy local."
  );
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, headers: hdr, ...rest } = init;
  const headers = new Headers(hdr);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    rest.body = JSON.stringify(json);
  }
  let r: Response;
  try {
    r = await fetch(apiUrl(path), { ...rest, headers });
  } catch (e) {
    throw mapNetworkError(e);
  }
  const text = await r.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }
  if (!r.ok) {
    throw new ApiError(r.status, `HTTP ${r.status}`, data);
  }
  return data as T;
}

export async function fetchHealth(): Promise<{ ok: boolean }> {
  let r: Response;
  try {
    r = await fetch(apiUrl("/health"));
  } catch (e) {
    throw mapNetworkError(e);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function fetchMockDemo(limit = 3): Promise<unknown> {
  const q = new URLSearchParams({ limit: String(limit), page: "1" });
  let r: Response;
  try {
    r = await fetch(apiUrl(`/api/demo/v1/users?${q}`));
  } catch (e) {
    throw mapNetworkError(e);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
