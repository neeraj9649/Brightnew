import { api, getAccessToken, hasSessionHint, refreshSession, requestUrl, setAccessToken } from './api';

const originalFetch = global.fetch;
const reply = (status, data) => ({
  status,
  ok: status === 200,
  json: async () => ({ success: status === 200, data, msg: status === 200 ? '' : 'Session expired' }),
});
const session = { access_token: 'renewed-token', user: { id: 'admin' } };

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  setAccessToken(null);
  global.fetch = originalFetch;
});

test('routes production cookie requests through the portal origin and leaves bearer API calls on the backend', () => {
  const origin = 'https://portal.brightwingstravel.com';
  expect(requestUrl('/auth/login', origin)).toBe('/session.php?action=login');
  expect(requestUrl('/auth/register', origin)).toBe('/session.php?action=register');
  expect(requestUrl('/auth/passcode/reset', origin)).toBe('/session.php?action=reset');
  expect(requestUrl('/auth/refresh', origin)).toBe('/session.php?action=refresh');
  expect(requestUrl('/auth/logout', origin)).toBe('/session.php?action=logout');
  expect(requestUrl('/admin/tours/items', origin)).toMatch(/^https?:\/\/.+\/admin\/tours\/items$/);
  expect(requestUrl('/auth/refresh', 'http://localhost:3000')).toMatch(/^https?:\/\/.+\/auth\/refresh$/);
});

test('a late 401 retries with the already-renewed token instead of rotating the cookie again', async () => {
  setAccessToken('old-token');
  let completeLateRequest;
  const lateResponse = new Promise((resolve) => { completeLateRequest = resolve; });
  global.fetch.mockImplementation((url, { headers }) => {
    if (url.endsWith('/auth/refresh')) return Promise.resolve(reply(200, session));
    if (headers.Authorization === 'Bearer renewed-token') return Promise.resolve(reply(200, { ok: true }));
    if (url.endsWith('/late')) return lateResponse;
    return Promise.resolve(reply(401));
  });

  const late = api.get('/late');
  await expect(api.get('/first')).resolves.toEqual({ ok: true });
  completeLateRequest(reply(401));
  await expect(late).resolves.toEqual({ ok: true });

  expect(global.fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
});

test('a refresh finishing after sign-out cannot restore the old session', async () => {
  setAccessToken('old-token');
  let completeRefresh;
  global.fetch.mockReturnValue(new Promise((resolve) => { completeRefresh = resolve; }));

  const refresh = refreshSession();
  setAccessToken(null);
  completeRefresh(reply(200, session));

  await expect(refresh).rejects.toThrow('This session has changed.');
  expect(getAccessToken()).toBeNull();
  expect(hasSessionHint()).toBe(false);
});
