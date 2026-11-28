import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.matchMedia = jest.fn((media) => ({ media, matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
});

test('redirects the portal root to sign-in and lets visitors open sign-up without a navbar', async () => {
  render(<App />);
  expect(await screen.findByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/auth');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /join bright wings|create your membership/i }));
  expect(await screen.findByRole('button', { name: /send (a |the )?code|send verification code|verify phone/i })).toBeInTheDocument();
  expect(window.location.search).toBe('?mode=register');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('requires sign-in before opening a membership card link', async () => {
  window.history.replaceState(null, '', '/card/BW123');
  render(<App />);
  expect(await screen.findByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/auth');
});

test('preserves referral codes when the root opens sign-up', async () => {
  window.history.replaceState(null, '', '/?ref=bw123');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Join Bright Wings' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Referral or staff code' })).toHaveValue('BW123');
  expect(window.location.pathname).toBe('/auth');
});
