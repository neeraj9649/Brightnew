const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:9010'
).replace(/\/$/, '');

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send/receive the httpOnly refresh-token cookie
  });

  const body = await response.json().catch(() => null);
  return { response, body };
}

async function tryRefresh() {
  // Several requests can fail together when a short-lived access token
  // expires. Rotate the httpOnly refresh token once and let the others share
  // the result instead of racing the single-use refresh-token endpoint.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { response, body } = await rawRequest('/auth/refresh', { method: 'POST' });
      if (response.ok && body?.data?.access_token) {
        setAccessToken(body.data.access_token);
        return true;
      }
      setAccessToken(null);
      return false;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Calls the backend, retrying once after a token refresh on 401.
 * Throws an Error with `.message` from the API envelope on failure.
 */
export async function apiRequest(path, options = {}) {
  let { response, body } = await rawRequest(path, options);

  if (response.status === 401 && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ response, body } = await rawRequest(path, options));
    }
  }

  if (!response.ok) {
    throw new Error(body?.msg || `Request failed: ${response.status}`);
  }

  return body?.data;
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
