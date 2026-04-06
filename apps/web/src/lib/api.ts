const TOKEN_KEY = "devmock_token";
const REFRESH_KEY = "devmock_refresh_token";
const USER_KEY = "devmock_user";

export const SESSION_EXPIRED_EVENT = "devmock:session-expired";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  publicSlug: string;
};

export type AuthSessionPayload = { token: string; refreshToken?: string; user: AuthUser };

export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Partial<AuthUser> & { id: string; username: string };
    return {
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      publicSlug: u.publicSlug ?? u.username,
    };
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (typeof refreshToken === "string" && refreshToken.length > 0) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function notifySessionExpired() {
  try {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  } catch {
    /* ignore */
  }
}

export function getAccessTokenExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const pad = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(pad)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenUsable(token: string, skewMs = 60_000): boolean {
  const exp = getAccessTokenExpiryMs(token);
  if (exp === null) return true;
  return Date.now() < exp - skewMs;
}

let refreshPromise: Promise<boolean> | null = null;

async function postRefresh(refreshToken: string): Promise<AuthSessionPayload> {
  const r = await fetch(apiUrl("/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
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
  return data as AuthSessionPayload;
}

export async function tryRefreshSession(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const data = await postRefresh(rt);
      const nextRt = data.refreshToken && data.refreshToken.length > 0 ? data.refreshToken : rt;
      setSession(data.token, data.user, nextRt);
      return true;
    } catch {
      clearSession();
      notifySessionExpired();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

const AUTH_PUBLIC_PATHS = ["/v1/auth/login", "/v1/auth/register", "/v1/auth/google", "/v1/auth/refresh"];

function isAuthPublicPath(path: string): boolean {
  const base = path.split("?")[0] ?? path;
  return AUTH_PUBLIC_PATHS.some((p) => base === p);
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
  init: RequestInit & { json?: unknown; _authRetry?: boolean } = {}
): Promise<T> {
  const { json, headers: hdr, _authRetry, ...rest } = init;
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

  if (r.status === 401 && !_authRetry && !isAuthPublicPath(path) && getRefreshToken()) {
    const ok = await tryRefreshSession();
    if (ok) {
      return apiFetch<T>(path, { ...init, _authRetry: true });
    }
    throw new ApiError(401, `HTTP 401`, data);
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
