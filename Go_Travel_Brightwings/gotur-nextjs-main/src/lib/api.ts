import { useAuth, type User } from "@/store/auth";

// Baked at build time for static export. Without NEXT_PUBLIC_API_URL, production builds use
// the live Bright Wings API and `npm run dev` uses a local one.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "https://bp.nsiif.in" : "http://localhost:9010");

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

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string; // which form sent it, e.g. "contact"
}

/**
 * Website contact form. The API saves the enquiry and e-mails it to the office inbox
 * (POST /public/enquiries, no sign-in). Throws with the API's plain-language message on error.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<{ id: string; email_sent: boolean }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/public/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Network failure / server unreachable: the browser only says "Failed to fetch".
    throw new Error("We couldn't reach our server. Please check your connection and try again, or call us.");
  }
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    msg?: string;
    data?: { id: string; email_sent: boolean };
  } | null;
  if (!response.ok || body?.success !== true || !body.data) {
    throw new Error(body?.msg || "We couldn't send your message. Please try again or call us.");
  }
  return body.data;
}

// ---------------------------------------------------------------------------
// Blog (written in the admin portal, GET/POST /public/blog...)
// ---------------------------------------------------------------------------

export interface BlogPostSummary {
  slug: string;
  title: string;
  published_on: string; // YYYY-MM-DD
  cover_image: string;
  comment_count: number;
}

export interface BlogComment {
  name: string;
  message: string;
  created_at: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  published_on: string;
  cover_image: string;
  content: string; // paragraphs separated by a blank line
  inner_images: string[];
  inner_text: string;
  quote: string;
  closing_text: string;
  tags: string[];
  comments: BlogComment[]; // approved only
}

async function publicJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("We couldn't reach our server. Please check your connection and try again.");
  }
  const body = (await response.json().catch(() => null)) as { success?: boolean; msg?: string; data?: T } | null;
  if (!response.ok || body?.success !== true) {
    throw new Error(body?.msg || `Request failed (${response.status})`);
  }
  return body.data as T;
}

// ponytail: one fetch shared by the grid, home section and sidebar on the same page load.
let blogListRequest: Promise<BlogPostSummary[]> | null = null;
export function getBlogPosts(): Promise<BlogPostSummary[]> {
  blogListRequest ??= publicJson<BlogPostSummary[]>("/public/blog").catch((err) => {
    blogListRequest = null; // let the next caller retry
    throw err;
  });
  return blogListRequest;
}

export const getBlogPost = (slug: string) => publicJson<BlogPost>(`/public/blog/${encodeURIComponent(slug)}`);

/** Sends a comment; it shows on the post only after an admin approves it. */
export const postBlogComment = (slug: string, input: { name: string; email: string; message: string }) =>
  publicJson<{ status: string }>(`/public/blog/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });

/** Link to a post's page (static export, so the post is picked by ?slug=). */
export const blogLink = (slug: string) => `/blog-details/?slug=${encodeURIComponent(slug)}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-03-17" -> { day: "17", month: "Mar", full: "17 Mar 2026" } (no time-zone shift). */
export function blogDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-");
  const name = MONTHS[Number(month) - 1] ?? "";
  return { day, month: name, full: `${Number(day)} ${name} ${year}` };
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
