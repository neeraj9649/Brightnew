// A production build must never fall back to localhost: a build made by hand without
// REACT_APP_API_URL would otherwise ship a portal that calls the visitor's own machine.
const DEFAULT_API_URL = process.env.NODE_ENV === 'production' ? 'https://bp.nsiif.in' : 'http://localhost:9010';
const API_BASE_URL = (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

let accessToken = null;

let refreshTimer = null;

// The refresh cookie is httpOnly, so JS cannot see it. This flag (not a credential) records that
// this browser signed in, so a visitor who never did is not sent to /auth/refresh on every load.
const SESSION_HINT_KEY = 'bw_session';
export const hasSessionHint = () => {
  try { return localStorage.getItem(SESSION_HINT_KEY) === '1'; } catch { return false; }
};
const setSessionHint = (on) => {
  try {
    if (on) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch { /* storage unavailable */ }
};

// Renew the access token shortly before it expires so the user never hits a 401 mid-click.
const scheduleRefresh = () => {
  clearTimeout(refreshTimer);
  refreshTimer = null;
  if (!accessToken) return;
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const delay = Math.max(payload.exp * 1000 - Date.now() - 60_000, 5_000);
    refreshTimer = setTimeout(() => { tryRefresh(); }, Math.min(delay, 2_147_000_000));
  } catch {
    /* unreadable token: the 401 handler still refreshes on demand */
  }
};

export const setAccessToken = (token) => {
  accessToken = token;
  setSessionHint(Boolean(token));
  scheduleRefresh();
};

export const getAccessToken = () => accessToken;

async function rawRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // send/receive the httpOnly refresh-token cookie
    });
  } catch {
    // DNS, TLS, CORS or offline failures all surface as a bare TypeError.
    const error = new Error('We can’t reach Bright Wings right now. Please check your connection and try again.');
    error.status = 0;
    error.network = true;
    throw error;
  }

  const body = await response.json().catch(() => null);
  return { response, body };
}

// Every backend response is an envelope with a boolean `success`. Anything
// else (an HTML error page from a proxy or host, an empty body) means we are
// not talking to the Bright Wings API.
const isEnvelope = (body) => body && typeof body === 'object' && typeof body.success === 'boolean';

// Refresh tokens are single-use, so every caller (page-load restore, the 401 retry and the
// pre-expiry timer) must share ONE in-flight request instead of racing the endpoint. The promise
// is dropped as soon as it settles; React StrictMode's double mount happens while it is in flight.
let inflightRefresh = null;

/** Rotates the httpOnly refresh cookie. Resolves to {access_token, user}; rejects with `.status` set. */
export function refreshSession() {
  if (!inflightRefresh) {
    inflightRefresh = apiRequest('/auth/refresh', { method: 'POST' }).finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

async function tryRefresh() {
  try {
    const data = await refreshSession();
    if (data?.access_token) {
      setAccessToken(data.access_token);
      return true;
    }
  } catch (error) {
    // Only a definite rejection ends the session; a 5xx or proxy hiccup must not log the user out.
    if (error.status === 401 || error.status === 403) setAccessToken(null);
  }
  return false;
}

/**
 * Calls the backend, retrying once after a token refresh on 401.
 * Throws an Error with `.message` from the API envelope on failure.
 */
export async function apiRequest(path, options = {}) {
  let { response, body } = await rawRequest(path, options);

  // A wrong PIN on /auth/login is also a 401, but there is nothing to refresh and a retry would count as a second guess.
  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login' && hasSessionHint()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ response, body } = await rawRequest(path, options));
    }
  }

  if (response.status === 204) return undefined; // e.g. logout

  if (!isEnvelope(body)) {
    const error = new Error('The Bright Wings service is temporarily unavailable. Please try again in a moment.');
    error.status = response.ok ? 502 : response.status;
    error.network = true;
    throw error;
  }

  if (!response.ok || body.success === false) {
    const error = new Error(body.msg || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body.data;
}

// Refresh again when a backgrounded tab wakes up (timers are throttled while hidden).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && accessToken) scheduleRefresh();
  });
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, data) =>
    apiRequest(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: (path, data) =>
    apiRequest(path, { method: 'PATCH', body: JSON.stringify(data) }),
  put: (path, data) =>
    apiRequest(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
  upload: (path, formData) => apiRequest(path, { method: 'POST', body: formData }),
};
