import { useAuth, type User } from "@/store/auth";

// Baked at build time for static export; falls back to the local Bright Wings API.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9010";

type Body = Record<string, unknown>;

function call(path: string, init: RequestInit, token?: string | null) {
  return fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include", // send/receive the httpOnly refresh cookie
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export interface PublicOffer {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  code: string | null;
  image_file_id: string | null;
  service_type: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

/** Public, currently live offers used by the client website homepage. */
export async function getPublicOffers(): Promise<PublicOffer[]> {
  const response = await fetch(`${API_BASE_URL}/public/offers`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    msg?: string;
    data?: unknown;
  } | null;
  if (!response.ok || body?.success !== true) {
    throw new Error(body?.msg || `Request failed (${response.status})`);
  }
  return Array.isArray(body.data) ? (body.data as PublicOffer[]) : [];
}

// Backend envelope: { data, msg, success, statusCode }. Errors carry HTTP status + msg.
async function unwrap(res: Response) {
  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok || (body as { success?: boolean }).success === false) {
    throw new Error((body as { msg?: string }).msg || `Request failed (${res.status})`);
  }
  return (body as { data?: unknown }).data;
}

// ponytail: one in-flight refresh shared by all callers; a 401 retries once, no loop.
let inflight: Promise<string | null> | null = null;

export function tryRefresh(): Promise<string | null> {
  if (!inflight) {
    inflight = call("/auth/refresh", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()).data as { access_token: string; user: User };
        useAuth.getState().setSession(data.access_token, data.user);
        return data.access_token;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function api(path: string, init: RequestInit = {}) {
  let res = await call(path, init, useAuth.getState().accessToken);
  if (res.status === 401) {
    const token = await tryRefresh();
    if (!token) {
      useAuth.getState().clear();
      throw new Error("Session expired");
    }
    res = await call(path, init, token);
  }
  return unwrap(res);
}

export const apiGet = (p: string) => api(p, { method: "GET" });
export const apiPost = (p: string, body?: Body) =>
  api(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPatch = (p: string, body?: Body) =>
  api(p, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });

// login/register: no bearer, no refresh-retry — surface the real error (e.g. bad PIN).
export async function authPost(path: string, body: Body) {
  return unwrap(await call(path, { method: "POST", body: JSON.stringify(body) }));
}
