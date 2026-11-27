// One database: every build (dev and production) talks to the live API unless REACT_APP_API_URL
// overrides it, so accounts created anywhere exist everywhere and nothing falls back to localhost.
const DEFAULT_API_URL = 'https://bp.nsiif.in';
const API_BASE_URL = (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
const PORTAL_ORIGIN = 'https://portal.brightwingstravel.com';
const SESSION_ACTIONS = new Map([
  ['/auth/login', 'login'],
  ['/auth/register', 'register'],
  ['/auth/passcode/reset', 'reset'],
  ['/auth/refresh', 'refresh'],
  ['/auth/logout', 'logout'],
]);

let accessToken = null;
let sessionVersion = 0;

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

const storeAccessToken = (token) => {
  accessToken = token;
  setSessionHint(Boolean(token));
  scheduleRefresh();
};

export const setAccessToken = (token) => {
  sessionVersion += 1;
  storeAccessToken(token);
};

export const getAccessToken = () => accessToken;

// Only cookie-based session routes use the same-origin portal gateway.
export function requestUrl(path, origin) {
  const action = SESSION_ACTIONS.get(path);
  return action && origin === PORTAL_ORIGIN ? `/session.php?action=${action}` : `${API_BASE_URL}${path}`;
}

async function rawRequest(path, options = {}, token = accessToken) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && !SESSION_ACTIONS.has(path)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(requestUrl(path, typeof window === 'undefined' ? undefined : window.location.origin), {
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

export const isSessionRejected = (error) =>
  !error.network && (error.status === 401 || error.status === 403);

// Refresh tokens are single-use, so every caller (page-load restore, the 401 retry and the
// pre-expiry timer) must share ONE in-flight request instead of racing the endpoint. The promise
// is dropped as soon as it settles; React StrictMode's double mount happens while it is in flight.
let inflightRefresh = null;

/** Rotates the httpOnly refresh cookie. Resolves to {access_token, user}; rejects with `.status` set. */
export function refreshSession() {
  const version = sessionVersion;
  if (inflightRefresh?.version !== version) {
    const refresh = apiRequest('/auth/refresh', { method: 'POST', keepalive: true })
      .then((data) => {
        if (version !== sessionVersion) {
          // Sign-out or a new sign-in won the race with this response.
          throw new Error('This session has changed.');
        }
        if (!data?.access_token || !data.user?.id) {
          throw new Error('The server could not confirm your session.');
        }
        storeAccessToken(data.access_token);
        return data;
      })
      .catch((error) => {
        if (version !== sessionVersion) throw new Error('This session has changed.');
        if (isSessionRejected(error)) setAccessToken(null);
        throw error;
      })
      .finally(() => {
        if (inflightRefresh?.version === version) inflightRefresh = null;
      });
    inflightRefresh = { version, refresh };
  }
  return inflightRefresh.refresh;
}

async function tryRefresh() {
  try {
    await refreshSession();
    return true;
  } catch {
    return false;
  }
}

/**
 * Calls the backend, retrying once after a token refresh on 401.
 * Throws an Error with `.message` from the API envelope on failure.
 */
export async function apiRequest(path, options = {}) {
  const token = accessToken;
  const version = sessionVersion;
  let { response, body } = await rawRequest(path, options, token);

  // Reuse a token another request already refreshed. Never retry a sign-in
  // submission or retry a previous user's request under a different session.
  if (response.status === 401 && isEnvelope(body) && version === sessionVersion &&
      !SESSION_ACTIONS.has(path) && path !== '/auth/otp/request' && hasSessionHint()) {
    if ((accessToken && accessToken !== token) || await tryRefresh()) {
      if (version === sessionVersion) ({ response, body } = await rawRequest(path, options));
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
