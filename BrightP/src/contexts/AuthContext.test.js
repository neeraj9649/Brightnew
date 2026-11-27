import React, { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { getAccessToken, hasSessionHint, setAccessToken } from '../services/api';

const staffSession = {
  access_token: 'test-access-token',
  user: { id: 'staff-1', first_name: 'Site', last_name: 'Admin', role: 'admin' },
};

const reply = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

function RestoreProbe() {
  const { currentUser, isStaff, isAdmin, loading, restoreError, retrySession } = useAuth();
  if (loading) return <p>Restoring session</p>;
  if (restoreError) {
    return <button type="button" onClick={retrySession}>Retry session</button>;
  }
  if (!currentUser) return <p>Signed out</p>;
  return <p>{isStaff && isAdmin ? 'Admin' : 'Member'} {currentUser.uid}</p>;
}

function renderRestore() {
  localStorage.setItem('bw_session', '1');
  render(<StrictMode><AuthProvider><RestoreProbe /></AuthProvider></StrictMode>);
}

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  cleanup();
  setAccessToken(null);
  global.fetch = originalFetch;
  jest.useRealTimers();
});

it('restores an admin with a credentialed refresh on reload', async () => {
  global.fetch.mockResolvedValue(reply(200, { success: true, data: staffSession }));
  renderRestore();

  expect(await screen.findByText('Admin staff-1')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/), expect.objectContaining({
    method: 'POST',
    credentials: 'include',
  }));
  expect(getAccessToken()).toBe(staffSession.access_token);
});

it.each([401, 403])('clears the session after the API rejects refresh with %s', async (status) => {
  global.fetch.mockResolvedValue(reply(status, { success: false, msg: 'Session ended' }));
  renderRestore();

  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(hasSessionHint()).toBe(false);
  expect(getAccessToken()).toBeNull();
});

it('keeps the session after a proxy 401 and lets the admin retry', async () => {
  jest.useFakeTimers();
  global.fetch.mockResolvedValue({
    status: 401,
    ok: false,
    json: async () => { throw new SyntaxError('HTML response'); },
  });
  renderRestore();

  await waitFor(() => expect(screen.getByRole('button', { name: 'Retry session' })).toBeInTheDocument(), { timeout: 10000 });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(hasSessionHint()).toBe(true);
  expect(screen.queryByText('Signed out')).not.toBeInTheDocument();

  global.fetch.mockResolvedValue(reply(200, { success: true, data: staffSession }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry session' }));
  expect(await screen.findByText('Admin staff-1')).toBeInTheDocument();
});
