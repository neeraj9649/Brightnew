import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  Eye, EyeOff, Gift, House, Info, LogOut, Minus, Plus, Search, ShieldCheck, User, Users, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { fileUrl } from '../services/storage';
import { useBooking } from '../contexts/BookingContext';
import BrightLogo from '../assets/BrightLogo.png';
import chairs from '../assets/travel/hero-palace.jpg';
import coast from '../assets/travel/hero-coast.jpg';
import village from '../assets/travel/destination-beach.jpg';
import { PHOTO } from './photos';
import './portal.css';

// Hero imagery. These are CSS `url(...)` values so they can be dropped straight
// into `backgroundImage`; swap a photo in src/assets/photos and every screen follows.
const u = (path) => `url(${path})`;
export const IMG = {
  palace: u(PHOTO.santorini), lake: u(PHOTO.domes), mountains: u(PHOTO.mountains), backwaters: u(PHOTO.kerala), skyline: u(PHOTO.dubai),
  coast, beach: coast, chairs, village,
};
export const bg = (image) => (String(image).startsWith('url(') ? image : `url(${image})`);
export { BrightLogo };

/* ------------------------------------------------------------------ helpers */

export const humanize = (value = '') =>
  String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const fmtNum = (value) => Number(value || 0).toLocaleString('en-IN');

export const fmtMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const dateOf = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (value, empty = '—') => {
  const d = dateOf(value);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : empty;
};

export const fmtDay = (value, empty = '—') => {
  const d = dateOf(value);
  return d ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : empty;
};

export const fmtDateTime = (value, empty = '—') => {
  const d = dateOf(value);
  return d
    ? `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
    : empty;
};

export const relTime = (value) => {
  const d = dateOf(value);
  if (!d) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'BW';


export const memberName = (user) => user?.displayName || user?.name || 'Traveler';

export function useMedia(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export const useWide = () => useMedia('(min-width: 900px)');

/** Loads data with loading/error/retry state. `load` must be stable (useCallback) or deps given. */
export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const alive = useRef(true);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      if (alive.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (alive.current) setState((s) => ({ data: s.data, loading: false, error }));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    alive.current = true;
    run();
    return () => { alive.current = false; };
  }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

/* -------------------------------------------------------------------- icons */

// The Bright Wings mark (wings + globe + plane), traced from the brand logo. With no `color` it uses the
// logo's gold-to-orange gradient; pass a colour for a flat one-colour version (e.g. white on a gold button).
const WINGS_MARK = 'M285.5 478.8 C279.7 467.9 269.9 452.0 259.0 435.5 C246.2 416.0 242.0 408.1 236.0 392.0 C218.7 345.5 204.5 333.0 152.3 318.0 C112.4 306.6 97.9 300.5 74.0 285.1 C42.1 264.6 21.6 243.9 10.6 220.9 C3.6 206.4 -1.4 186.3 1.6 185.3 C2.2 185.1 6.6 190.7 11.3 197.7 C32.1 228.8 60.2 252.1 100.5 271.7 C129.8 285.9 170.2 306.1 177.9 310.4 C187.2 315.6 188.0 315.8 187.3 313.1 C185.3 305.5 161.6 289.8 124.1 271.3 C85.1 252.1 71.5 242.9 52.3 222.6 C20.6 189.1 2.0 142.1 3.2 98.6 C3.4 91.0 3.9 87.5 4.7 87.2 C5.4 87.0 6.2 87.4 6.4 88.2 C31.0 168.9 47.3 190.5 127.1 247.5 C143.7 259.4 160.2 274.5 169.7 286.6 C177.3 296.4 178.9 296.8 174.4 287.7 C168.2 275.4 154.1 260.0 135.6 245.5 C71.0 194.7 44.0 161.0 28.7 112.4 C20.2 85.6 23.4 41.7 36.1 10.0 C42.0 -4.6 43.5 -3.2 43.2 16.3 C41.7 94.3 68.3 151.3 128.5 199.3 C143.3 211.1 170.1 228.9 189.0 239.6 C217.6 255.6 228.9 263.9 245.5 280.9 C273.0 309.1 280.9 332.7 279.8 383.3 C278.9 420.1 280.7 442.9 286.6 470.8 C288.0 477.6 289.0 483.3 288.8 483.6 C288.5 483.8 287.1 481.6 285.5 478.8 Z M315.0 482.8 C315.0 482.4 316.1 476.6 317.5 469.8 C322.9 443.1 323.4 437.5 323.5 391.0 C323.6 353.5 323.9 346.3 325.4 339.1 C330.4 315.8 342.0 295.9 363.0 275.0 C377.8 260.1 384.7 255.2 412.5 239.0 C475.9 202.0 513.0 166.0 534.6 120.5 C547.9 92.5 553.5 65.3 554.7 24.3 C555.4 -2.0 556.0 -3.7 561.0 7.4 C575.2 38.7 577.5 84.6 566.4 118.5 C554.0 156.6 530.2 188.9 486.5 226.9 C452.4 256.5 441.3 268.5 433.4 284.5 C427.8 295.7 428.1 297.6 434.0 288.8 C446.2 270.8 457.9 259.2 484.0 239.3 C516.7 214.4 539.5 193.1 553.6 174.2 C564.1 160.0 581.6 122.1 588.6 98.2 C592.6 84.2 595.0 83.7 595.0 96.8 C594.9 140.0 577.6 186.7 549.8 218.9 C531.4 240.2 514.3 252.6 478.3 270.5 C447.5 285.8 435.7 293.6 419.4 309.0 C390.4 336.5 382.7 348.5 367.9 388.9 C359.6 411.6 356.4 417.9 342.1 439.5 C337.4 446.6 329.8 459.0 325.2 467.0 C317.3 480.7 315.0 484.3 315.0 482.8 Z M167.5 410.0 C160.9 409.2 158.0 408.2 158.0 406.9 C158.0 406.1 159.0 405.7 173.9 402.0 C178.5 400.8 188.6 397.4 196.4 394.4 C211.5 388.4 222.0 386.3 222.0 389.3 C222.0 391.8 210.4 401.7 203.7 404.8 C193.7 409.6 179.4 411.6 167.5 410.0 Z M416.5 410.1 C403.2 407.9 394.2 403.7 385.3 395.4 C376.1 386.9 382.0 386.0 401.5 392.8 C410.6 395.9 427.5 401.2 438.9 404.3 C441.4 405.0 443.5 406.1 443.7 406.7 C444.7 409.5 426.6 411.7 416.5 410.1 Z M135.5 393.4 C116.2 390.5 99.4 385.2 93.8 380.2 C90.1 377.0 91.7 376.7 108.2 377.6 C147.0 379.7 162.3 378.7 193.0 371.6 C200.1 369.9 213.6 369.5 214.4 370.8 C216.4 374.1 195.0 386.3 179.0 391.0 C171.6 393.2 144.1 394.7 135.5 393.4 Z M432.0 392.5 C418.3 389.5 398.5 381.0 390.4 374.5 C382.7 368.3 395.8 368.6 426.0 375.4 C442.7 379.2 478.5 379.9 498.5 377.0 C510.9 375.1 513.1 377.3 504.2 382.6 C488.5 392.1 452.9 396.9 432.0 392.5 Z M118.0 366.5 C101.7 363.8 83.3 357.3 71.6 350.2 C60.8 343.7 47.1 329.3 50.0 327.5 C50.6 327.2 56.5 329.3 63.3 332.3 C79.0 339.3 84.7 341.4 96.7 344.4 C113.7 348.7 118.7 349.2 154.5 350.0 C186.8 350.6 190.0 350.9 196.4 352.9 C200.2 354.2 202.9 355.5 202.4 356.0 C201.1 357.2 167.8 365.6 159.3 366.9 C149.9 368.3 127.5 368.1 118.0 366.5 Z M439.5 366.4 C429.1 364.6 400.5 356.5 400.6 355.4 C400.7 354.9 403.4 353.6 406.6 352.6 C411.7 351.0 417.2 350.6 446.5 350.0 C493.9 349.0 509.3 345.8 542.0 330.1 C553.0 324.8 554.2 327.1 545.4 336.9 C532.7 350.9 508.7 362.8 485.6 366.5 C474.3 368.3 450.4 368.3 439.5 366.4 Z M122.0 337.0 C100.5 334.5 73.3 323.9 55.7 311.2 C44.0 302.8 36.1 293.1 26.2 275.4 C17.3 259.3 18.3 259.1 35.6 273.3 C69.9 301.4 86.7 310.3 120.0 318.3 C142.5 323.6 158.8 328.2 169.5 332.1 L178.5 335.5 L173.0 336.1 C162.7 337.3 129.5 337.9 122.0 337.0 Z M454.9 337.6 C454.7 337.4 448.3 337.0 440.7 336.9 C433.0 336.7 426.6 336.2 426.4 335.8 C425.5 334.4 448.1 327.1 470.7 321.5 C509.7 311.8 527.7 302.5 561.4 274.6 C581.9 257.6 583.5 257.8 572.9 276.0 C554.4 307.9 532.8 324.1 495.3 334.0 C486.3 336.4 456.4 339.0 454.9 337.6 Z M413.0 325.5 C414.2 324.1 441.9 304.7 454.0 296.9 C461.7 291.9 482.3 280.7 492.2 276.1 C536.3 255.5 569.8 226.9 592.5 190.3 C596.0 184.7 598.7 183.9 598.2 188.5 C596.2 208.6 580.5 237.6 561.5 256.4 C534.1 283.6 502.1 301.4 457.5 314.6 C413.1 327.6 410.8 328.2 413.0 325.5 Z M279.4 219.6 C263.5 216.0 262.5 210.0 277.7 210.0 L284.5 210.0 L291.0 203.8 C300.8 194.6 301.0 194.2 301.0 182.1 L301.0 171.8 L295.9 163.3 C289.5 152.7 286.9 151.0 277.5 151.0 L270.6 151.0 L265.5 156.4 C260.7 161.4 260.1 161.7 254.6 162.2 C247.6 162.8 246.0 164.4 246.0 170.8 C246.0 176.6 245.0 178.2 239.0 181.9 C232.5 185.9 232.5 185.9 229.4 179.8 C224.2 169.6 221.8 161.0 221.3 150.7 L220.7 140.9 L225.0 141.2 C229.1 141.5 229.5 141.8 232.9 147.5 C236.2 153.0 236.9 153.5 240.4 153.8 C249.9 154.6 252.1 151.3 249.0 140.5 C246.1 130.5 246.2 130.0 251.1 130.0 C255.9 130.0 257.6 129.2 265.3 123.2 C271.2 118.6 275.0 113.6 275.0 110.6 C275.0 109.6 273.4 105.1 271.4 100.5 C267.4 91.2 267.5 89.3 272.2 86.6 C279.9 82.0 283.0 78.1 283.0 72.9 L283.0 68.1 L287.6 67.4 C294.7 66.4 311.8 67.6 318.5 69.7 C325.0 71.7 325.7 72.8 325.9 80.5 C326.0 87.3 325.1 88.7 314.6 97.1 C302.3 107.1 301.6 108.0 301.6 114.8 C301.6 120.3 303.7 123.5 309.4 126.7 C310.4 127.2 311.2 129.7 311.6 133.5 C312.5 142.0 313.8 143.4 325.5 149.2 L336.0 154.4 L341.5 151.7 C348.0 148.5 350.1 148.4 352.3 150.8 C354.6 153.3 354.4 158.4 352.0 165.5 C348.7 175.0 347.8 176.0 342.0 176.0 C329.1 176.0 323.8 191.9 332.4 204.6 C337.0 211.4 335.9 212.7 321.6 217.7 C312.6 220.8 289.4 221.9 279.4 219.6 Z M249.3 204.1 C240.1 196.1 236.7 192.4 237.5 191.1 C237.8 190.5 240.8 188.2 244.0 186.0 C251.1 181.2 252.0 179.7 252.0 173.1 L252.0 168.0 L257.9 168.0 C263.8 168.0 263.8 168.0 268.0 163.0 L272.2 158.0 L278.4 158.0 C285.4 158.0 285.7 158.2 290.8 166.8 C293.8 171.8 294.0 172.5 294.0 182.3 L294.0 192.6 L288.6 197.9 C283.2 203.3 283.0 203.3 275.7 203.9 C270.0 204.4 267.4 205.1 264.2 207.3 C258.4 211.1 257.0 210.8 249.3 204.1 Z M337.9 201.8 C331.1 191.2 334.1 182.9 344.9 182.0 C349.5 181.6 351.5 181.0 352.6 179.6 C355.4 175.7 360.3 162.3 360.8 157.3 C361.2 152.3 361.1 152.0 356.5 147.1 C351.0 141.2 349.9 141.0 341.8 144.7 L335.9 147.3 L327.8 143.4 C318.8 139.0 318.0 137.9 318.0 129.5 C318.0 123.8 315.2 120.0 310.9 120.0 C308.7 120.0 307.5 116.2 308.4 112.6 C308.7 111.3 312.3 107.4 316.2 103.9 L323.5 97.7 L324.1 103.1 C324.4 106.1 325.4 109.8 326.3 111.5 C328.4 115.5 335.6 122.4 336.4 121.2 C336.7 120.7 339.3 114.2 342.1 106.9 C344.9 99.5 347.6 92.8 348.0 92.0 C348.7 90.9 350.1 91.9 354.9 96.7 L361.0 102.8 L361.0 112.0 C361.0 124.0 364.3 130.3 370.8 130.5 C373.2 130.5 373.6 131.0 374.2 135.0 C376.9 152.9 370.8 175.4 359.0 191.1 C355.3 196.1 343.5 207.0 341.9 207.0 C341.5 207.0 339.7 204.6 337.9 201.8 Z M237.5 143.1 C234.3 136.7 230.8 134.0 225.9 134.0 C222.1 134.0 222.0 133.9 222.0 130.2 C222.1 121.4 231.4 102.4 240.6 92.1 C248.6 83.3 263.2 73.8 273.1 71.0 C275.9 70.2 276.0 70.3 276.0 73.6 C276.0 76.7 275.5 77.3 270.5 80.1 C260.0 86.0 259.4 88.2 264.6 100.7 C269.1 111.6 268.9 112.3 260.6 118.7 C254.6 123.4 253.2 124.0 249.1 124.0 C240.0 124.0 238.7 126.8 242.0 138.5 C244.5 147.2 244.5 148.0 242.0 148.0 C240.6 148.0 239.3 146.5 237.5 143.1 Z M366.5 124.4 C363.5 121.4 362.9 119.1 363.6 112.6 C364.0 109.1 363.9 104.9 363.6 103.4 C362.8 100.5 349.5 86.0 347.5 86.0 C346.9 86.0 343.9 92.4 340.9 100.2 C335.0 115.8 333.7 117.1 329.6 111.7 C327.2 108.4 326.9 102.4 328.3 80.3 L329.2 67.1 L322.6 60.5 C315.4 53.3 313.9 50.0 316.1 46.1 C317.3 44.0 318.5 43.4 321.8 43.2 C325.9 42.9 326.4 43.2 333.0 49.6 L340.0 56.3 L359.7 55.6 C380.9 54.9 384.5 55.5 387.4 60.3 C388.8 62.6 388.5 62.8 371.8 69.2 C364.2 72.0 358.0 74.9 358.0 75.5 C358.0 76.1 361.3 79.9 365.4 83.8 L372.8 91.0 L380.6 91.0 C390.0 91.0 395.6 92.4 397.0 95.0 C397.9 96.7 397.4 97.4 392.5 100.6 C386.5 104.4 386.5 104.3 391.2 109.2 C393.6 111.6 393.5 117.2 391.2 119.3 C388.3 122.0 382.4 121.5 380.4 118.5 C378.1 114.9 376.3 115.4 373.2 120.5 C370.1 125.7 368.7 126.5 366.5 124.4 Z';

export function WingsIcon({ size = 20, color }) {
  const id = useId();
  const gradient = `wings-grad-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={Math.round(size * 484 / 599)} viewBox="0 0 599 484" aria-hidden="true" style={{ flex: 'none' }}>
      {!color && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCDA7D" />
            <stop offset="1" stopColor="#FB9A33" />
          </linearGradient>
        </defs>
      )}
      <path fillRule="evenodd" fill={color || `url(#${gradient})`} d={WINGS_MARK} />
    </svg>
  );
}

export function RupeeCoin({ size = 40 }) {
  return (
    <span className={`pt-coin ${size < 32 ? 'sm' : ''}`} style={{ width: size, height: size }}>
      <WingsIcon size={size * 0.52} color="#fff" strokeWidth={1.9} />
    </span>
  );
}

/* ------------------------------------------------------------------- shells */

const NAV = [
  { key: 'home', label: 'Home', path: '/dashboard', Icon: House },
  { key: 'bookings', label: 'Bookings', path: '/bookings', Icon: CalendarDays },
  { key: 'wings', label: 'Wings', path: '/rewards', Icon: WingsIcon },
  { key: 'refer', label: 'Refer', path: '/referrals', Icon: Users },
  { key: 'account', label: 'Account', path: '/account', Icon: User },
];

export function BellButton({ light = false }) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let live = true;
    api.get('/notifications/me').then((d) => live && setUnread(d?.unread || 0)).catch(() => {});
    return () => { live = false; };
  }, []);
  return (
    <button type="button" className="pt-icon-btn" aria-label="Notifications" onClick={() => navigate('/notifications')} style={light ? { color: '#fff' } : undefined}>
      <Bell size={21} />
      {unread > 0 && <span className="pt-dot" style={light ? { borderColor: 'transparent' } : undefined} />}
    </button>
  );
}

export function Avatar({ user, size, onClick }) {
  const name = memberName(user);
  const cls = `pt-avatar ${size || ''}`;
  const body = user?.photoURL ? <img src={user.photoURL.startsWith('http') ? user.photoURL : fileUrl(user.photoURL)} alt="" /> : initials(name);
  return onClick ? <button type="button" className={cls} onClick={onClick} aria-label="Account">{body}</button> : <span className={cls}>{body}</span>;
}

/* --------------------------------------------------------- desktop chrome */

const SEARCH_PAGES = [
  ['Home', 'Your Wings, trips and activity', '/dashboard', House],
  ['My bookings', 'Track every request', '/bookings', CalendarDays],
  ['Request new travel', 'Flights, hotels, visas and more', '/bookings/new', CalendarDays],
  ['Wings & rewards', 'Balance, activity and rewards catalogue', '/rewards', WingsIcon],
  ['Refer a friend', 'Share your code and earn', '/referrals', Users],
  ['Account', 'Details, preferences and security', '/account', User],
  ['Membership card', 'Your card and QR code', '/membership', User],
  ['Tier benefits', 'What each tier unlocks', '/tier-benefits', WingsIcon],
  ['Notifications', 'Updates on trips and Wings', '/notifications', Bell],
  ['Help & support', 'FAQs and contacting us', '/support', Info],
  ['Redemption history', 'Your reward requests', '/rewards/redemptions', WingsIcon],
];

function GlobalSearch() {
  const navigate = useNavigate();
  const { bookings } = useBooking();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [cursor, setCursor] = useState(0);
  const box = useRef(null);

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const loadRewards = () => { if (rewards === null) api.get('/redemptions/catalog').then(setRewards).catch(() => setRewards([])); };
  const term = q.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!term) return [];
    const has = (...parts) => parts.filter(Boolean).join(' ').toLowerCase().includes(term);
    const trips = (bookings || []).filter((b) => has(b.id, b.destination, b.from, b.to, b.hotel, b.type, b.country, b.region)).slice(0, 4)
      .map((b) => ({ key: `b${b.docId}`, title: `${b.from && b.to ? `${b.from} → ${b.to}` : b.destination || humanize(b.type)}`, sub: `${humanize(b.type)} · ${b.id}`, to: `/bookings/${b.docId}` }));
    const rw = (rewards || []).filter((r) => has(r.name, r.category, r.description, r.destination)).slice(0, 4)
      .map((r) => ({ key: `r${r.id}`, title: r.name, sub: `${fmtNum(r.wings_cost)} Wings · ${r.category || 'Reward'}`, to: `/rewards/catalog/${r.id}` }));
    const pages = SEARCH_PAGES.filter(([t, d]) => has(t, d)).slice(0, 5).map(([t, d, to]) => ({ key: `p${to}`, title: t, sub: d, to }));
    return [['Trips', trips], ['Rewards', rw], ['Pages', pages]].filter(([, list]) => list.length);
  }, [term, bookings, rewards]);
  const flat = groups.flatMap(([, list]) => list);

  const go = (to) => { setOpen(false); setQ(''); navigate(to); };
  const onKey = (e) => {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && flat[cursor]) go(flat[cursor].to);
  };

  return (
    <div className="pt-desk-search" ref={box} role="search">
      <Search size={18} />
      <input
        value={q}
        placeholder="Search trips, rewards or help…"
        aria-label="Search"
        onFocus={() => { setOpen(true); loadRewards(); }}
        onChange={(e) => { setQ(e.target.value); setCursor(0); setOpen(true); }}
        onKeyDown={onKey}
      />
      {open && term && (
        <div className="pt-desk-results" role="listbox">
          {flat.length === 0 ? <div style={{ padding: 18, color: 'var(--pt-muted)', fontSize: 13 }}>No matches for “{q.trim()}”.</div> : groups.map(([label, list]) => (
            <div key={label}>
              <h6>{label}</h6>
              {list.map((item) => (
                <button type="button" key={item.key} className={flat[cursor]?.key === item.key ? 'on' : ''} onClick={() => go(item.to)}>
                  <span><span>{item.title}</span><small>{item.sub}</small></span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const { userData, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);
  const pick = (to) => { setOpen(false); navigate(to); };
  return (
    <div className="pt-desk-user" ref={ref}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Avatar user={userData} />
        <div><b>{memberName(userData)}</b><small>{userData?.membershipTier || 'Silver'} Member</small></div>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="pt-desk-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => pick('/account')}><User size={17} /> Account & profile</button>
          <button type="button" role="menuitem" onClick={() => pick('/membership')}><Gift size={17} /> Membership card</button>
          <button type="button" role="menuitem" onClick={() => pick('/support')}><Info size={17} /> Help & support</button>
          {isAdmin && <button type="button" role="menuitem" onClick={() => pick('/admin')}><ShieldCheck size={17} /> Admin workspace</button>}
          <hr />
          <button type="button" role="menuitem" className="danger" onClick={async () => { await logout().catch(() => {}); navigate('/auth', { replace: true }); }}><LogOut size={17} /> Sign out</button>
        </div>
      )}
    </div>
  );
}

/** Customer shell: dark sidebar + top bar from 900px, bottom tabs on phones. */
export function Shell({ active, children, wide = false, topbar = true, hideNav = false }) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const location = useLocation();
  const current = active || NAV.find((n) => location.pathname.startsWith(n.path))?.key;
  return (
    <div className="pt-app">
      <div className="pt-shell" style={hideNav ? { paddingBottom: 0, paddingLeft: 0 } : undefined}>
        {!hideNav && (
          <aside className="pt-desk-side" aria-label="Primary">
            <button type="button" className="pt-desk-brand" onClick={() => navigate('/dashboard')}>
              <img src={BrightLogo} alt="" />
              <span><b>Bright Wings</b><small>YOUR JOURNEY, OUR WINGS</small></span>
            </button>
            <nav className="pt-desk-nav">
              {NAV.map(({ key, label, path, Icon }) => (
                <button key={key} type="button" className={current === key ? 'active' : ''} aria-current={current === key ? 'page' : undefined} onClick={() => navigate(path)}>
                  <Icon size={21} /> {label}
                </button>
              ))}
            </nav>
            <button type="button" className="pt-desk-balance" onClick={() => navigate('/rewards')}>
              <WingsIcon size={30} color="#e6b865" />
              <span style={{ flex: 1 }}><small>Your Wings balance</small><b>{fmtNum(userData?.tokens)}<span>Wings</span></b></span>
              <ChevronRight size={18} />
            </button>
            <div className="pt-desk-art" style={{ backgroundImage: `url(${PHOTO.mountains})` }}>
              <p>More journeys.<br />Brighter tomorrows.</p>
            </div>
          </aside>
        )}
        <div className="pt-main">
          {!hideNav && (
            <header className="pt-desk-top">
              <GlobalSearch />
              <div className="pt-desk-spacer" />
              <BellButton />
              <UserMenu />
            </header>
          )}
          {topbar && (
            <header className="pt-topbar">
              <button type="button" className="pt-brand" onClick={() => navigate('/dashboard')}>
                <img src={BrightLogo} alt="" />
                <span className="pt-brand-name">Bright Wings</span>
              </button>
              <div style={{ flex: 1 }} />
              <div className="pt-top-actions"><BellButton /></div>
            </header>
          )}
          {children}
        </div>
        {!hideNav && (
          <nav className="pt-bottom-nav" aria-label="Primary">
            {NAV.map(({ key, label, path, Icon }) => (
              <button key={key} type="button" className={current === key ? 'active' : ''} onClick={() => navigate(path)}>
                <Icon size={22} />
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function Page({ children, wide, className = '', style }) {
  return <main className={`pt-page ${wide ? 'wide' : ''} ${className}`} style={style}>{children}</main>;
}

export function AppBar({ title, onBack, right }) {
  const navigate = useNavigate();
  return (
    <div className="pt-appbar">
      <button type="button" className="pt-icon-btn" aria-label="Back" onClick={onBack || (() => navigate(-1))}><ChevronLeft size={24} /></button>
      <h1>{title}</h1>
      {right || <span className="spacer" />}
    </div>
  );
}

export function Hero({ image = IMG.palace, brand = true, back, onBack, right, title, subtitle, children, style, tall, className = '' }) {
  const navigate = useNavigate();
  return (
    <section className={`pt-hero ${className}`} style={{ backgroundImage: bg(image), minHeight: tall ? 330 : undefined, ...style }}>
      <div className="pt-hero-top">
        {back ? (
          <button type="button" className="pt-back" style={{ color: '#fff' }} onClick={onBack || (() => navigate(-1))}><ArrowLeft size={18} /> {back === true ? 'Back' : back}</button>
        ) : brand ? (
          <span className="pt-brand"><img src={BrightLogo} alt="" style={{ filter: 'brightness(1.1)' }} /><span className="pt-brand-name">Bright Wings</span></span>
        ) : <span />}
        {right}
      </div>
      {title && <h1>{title}</h1>}
      {subtitle && <p>{subtitle}</p>}
      {children}
    </section>
  );
}

export const Sheet = ({ children, style }) => <div className="pt-sheet" style={style}>{children}</div>;

/* -------------------------------------------------------------- primitives */

export const Card = ({ children, pad = true, flat, className = '', style, ...rest }) => (
  <div className={`pt-card ${pad ? 'pad' : ''} ${flat ? 'flat' : ''} ${className}`} style={style} {...rest}>{children}</div>
);

export function Notice({ tone = '', icon, title, children, style }) {
  const Ico = icon === false ? null : icon || Info;
  return (
    <div className={`pt-notice ${tone}`} style={style}>
      {Ico && <Ico size={18} />}
      <div>{title && <strong>{title}</strong>}{children}</div>
    </div>
  );
}

export const Badge = ({ tone = '', dot, children, style }) => <span className={`pt-badge ${tone} ${dot ? 'dot' : ''}`} style={style}>{children}</span>;

export function Spinner({ label }) {
  return (
    <div className="pt-empty" role="status">
      <svg className="pt-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>
      {label && <span>{label}</span>}
    </div>
  );
}

export const Skeleton = ({ h = 16, w = '100%', r, style }) => <div className="pt-skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="pt-empty">
      {Icon && <Icon size={34} strokeWidth={1.5} />}
      {title && <strong>{title}</strong>}
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', children, onRetry }) {
  return (
    <div className="pt-empty">
      <CircleAlert size={34} strokeWidth={1.5} style={{ color: 'var(--pt-red)' }} />
      <strong>{title}</strong>
      <span>{children || 'Please check your connection and try again.'}</span>
      {onRetry && <button type="button" className="pt-btn sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Field({ label, optional, hint, error, children, right }) {
  return (
    <div className="pt-field">
      {label && (
        <div className="pt-row between">
          <label className="pt-label">{label}{optional && <span className="opt"> (optional)</span>}</label>
          {right}
        </div>
      )}
      {children}
      {error ? <span className="pt-err-text"><CircleAlert size={13} /> {error}</span> : hint ? <span className="pt-hint">{hint}</span> : null}
    </div>
  );
}

export function Input({ icon: Icon, error, className = '', ...props }) {
  const input = <input className={`pt-input ${error ? 'err' : ''} ${className}`} {...props} />;
  return Icon ? <div className="pt-input-icon"><Icon size={18} />{input}</div> : input;
}

export function Select({ icon: Icon, error, children, ...props }) {
  const select = <select className={`pt-select ${error ? 'err' : ''}`} {...props}>{children}</select>;
  return Icon ? <div className="pt-input-icon"><Icon size={18} />{select}</div> : select;
}

export const TextArea = React.forwardRef(function TextArea({ error, max, value = '', ...props }, ref) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <textarea ref={ref} className={`pt-textarea ${error ? 'err' : ''}`} value={value} maxLength={max} {...props} />
      {max && <span className="pt-count">{String(value).length}/{max}</span>}
    </div>
  );
});

export { default as PhoneField } from './PhoneField';
export { formatPhone, isValidPhone, maskPhone, toStoredPhone } from './phone';

export function PinBoxes({ value = '', onChange, show = false, length = 4, error, autoFocus, label = 'PIN', size }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  return (
    <div className={`pt-pins ${size || ''}`} style={{ '--n': length }} onClick={() => ref.current?.focus()}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} className={`pt-pin ${focused && i === Math.min(value.length, length - 1) ? 'active' : ''} ${error ? 'err' : ''}`}>
          {i < value.length ? (show ? value[i] : <span className="dot" />) : null}
        </div>
      ))}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-label={label}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
      />
    </div>
  );
}

export function PinField({ label, value, onChange, error, show, autoFocus, size }) {
  return (
    <Field label={label} error={error}>
      <PinBoxes value={value} onChange={onChange} show={show} error={!!error} autoFocus={autoFocus} label={label} size={size} />
    </Field>
  );
}

export function Check2({ checked, onChange, children, disabled }) {
  return (
    <label className="pt-check">
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="box">{checked && <Check size={14} strokeWidth={3} />}</span>
      <span>{children}</span>
    </label>
  );
}

export function Switch({ on, onChange, disabled, label }) {
  return <button type="button" role="switch" aria-checked={!!on} aria-label={label} className={`pt-switch ${on ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(!on)} />;
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="pt-seg" role="tablist">
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o.value, o.label];
        return <button type="button" key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

export function Counter({ value, onChange, min = 0, max = 99, suffix = '' }) {
  return (
    <div className="pt-counter">
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={16} /></button>
      <strong>{value}{suffix}</strong>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={16} /></button>
    </div>
  );
}

export function Chips({ options, value, onChange, scroll = false, gold }) {
  const body = options.map((o) => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return <button type="button" key={v} className={`pt-chip ${gold ? 'gold' : ''} ${value === v ? 'active' : ''}`} onClick={() => onChange(v)}>{l}</button>;
  });
  return <div className={scroll ? 'pt-chip-scroll' : 'pt-chips'}>{body}</div>;
}

export function MultiChips({ options, value = [], onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="pt-chips">
      {options.map((o) => {
        const [v, l, Ico] = Array.isArray(o) ? o : [o, o];
        return <button type="button" key={v} className={`pt-chip gold ${value.includes(v) ? 'active' : ''}`} onClick={() => toggle(v)}>{Ico && <Ico size={15} />}{l}</button>;
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="pt-search">
      <Search size={17} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="pt-tabs" role="tablist">
      {tabs.map(([v, l]) => <button type="button" key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

export function KV({ rows }) {
  return <div>{rows.filter(Boolean).map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{v ?? '—'}</strong></div>)}</div>;
}

export function Progress({ value, dark }) {
  return <div className={`pt-progress ${dark ? 'on-dark' : ''}`}><span style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}

export function Modal({ open, onClose, children, side = false, label }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`pt-overlay ${side ? 'side' : ''}`} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={side ? 'pt-drawer' : 'pt-modal'} role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  );
}

export function ModalHead({ title, onClose, sub }) {
  return (
    <div className="pt-row between top" style={{ marginBottom: 16 }}>
      <div><h2 className="pt-h2">{title}</h2>{sub && <p className="pt-small" style={{ marginTop: 4 }}>{sub}</p>}</div>
      <button type="button" className="pt-icon-btn" aria-label="Close" onClick={onClose} style={{ marginTop: -6, marginRight: -8 }}><X size={20} /></button>
    </div>
  );
}

export function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = async (text, key = 'x') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1600);
      return true;
    } catch {
      return false;
    }
  };
  return { copied, copy };
}

export const Chev = () => <ChevronRight size={18} className="chev" />;
export { Eye, EyeOff };
