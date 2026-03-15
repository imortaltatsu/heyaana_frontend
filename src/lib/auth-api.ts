/**
 * Authenticated API client for api2.heyanna.trade endpoints.
 *
 * All calls go through Next.js Route Handlers (/api/auth/*, /api/proxy/*)
 * so the raw JWT never reaches client code — it lives only in an HttpOnly cookie.
 */

/** Analysis, dashboard, and market data API */
export const API1_BASE_URL = "https://staging.heyanna.trade";
/** Trading, auth, copy-trading, and portfolio API */
export const API2_BASE_URL = "https://staging.heyanna.trade";

// ─── Token storage key ─────────────────────────────────────
export const TOKEN_STORAGE_KEY = "heyanna_token";

// ─── Client-side fetcher ─────
/**
 * Fetch from api2 with the JWT bearer token from localStorage.
 */
export async function api2Fetch(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<Response> {
  const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null);
  const url = `${API2_BASE_URL}${path}`;

  const method = init?.method?.toUpperCase() ?? "GET";
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return fetch(url, {
    ...init,
    headers,
  });
}

// ─── Client-side helpers (call our own /api/* proxies) ─────

/** Login via Telegram Mini App initData */
export async function loginTelegram(initData: string) {
  const params = new URLSearchParams({ init_data: initData });
  const res = await api2Fetch(`/auth/telegram?${params}`, undefined, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed");
  }

  const data = await res.json();
  const token = data.access_token ?? data.token ?? data.jwt;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  return data;
}

/** Login via Telegram Login Widget (user object with hash) */
export async function loginWidgetTelegram(user: any) {
  // Call our own API route (same origin) to avoid CORS on the api2 call.
  const params = new URLSearchParams(user);
  const res = await fetch(`/api/auth/telegram-widget?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed");
  }

  const data = await res.json();
  const token = data.access_token ?? data.token ?? data.jwt;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  return data;
}

/** Login with a manual user_id (dev only) */
export async function loginManual(userId: number) {
  const params = new URLSearchParams({ user_id: String(userId) });
  const res = await fetch(`/api/auth/manual?${params}`, { method: "POST" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? body.detail ?? "Login failed");
  }

  const data = await res.json();
  const token = data.access_token ?? data.token ?? data.jwt;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  return data;
}

/** Logout — clears localStorage + revokes session on backend */
export async function logout() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    // Optional: notify backend
    await api2Fetch("/auth/logout", token, { method: "POST" }).catch(() => { });
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Get current user profile directly from api2 */
export async function fetchMe() {
  const res = await api2Fetch("/me");
  if (!res.ok) return null;
  return res.json();
}

// ─── Types ────────────────────────────────────────────────

export type UserProfile = {
  user_id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  wallet_address: string | null;
  created_at: string;
};
