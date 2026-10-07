import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  Eye, EyeOff, House, Info, Minus, Plus, Search, User, Users, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { fileUrl } from '../services/storage';
import BrightLogo from '../assets/BrightLogo.png';
import chairs from '../assets/travel/hero-palace.jpg';
import coast from '../assets/travel/hero-coast.jpg';
import village from '../assets/travel/destination-beach.jpg';
import { SCENE } from './scenes';
import './portal.css';

// Hero imagery. `palace`/`lake` are illustrated scenes until real destination
// photography is supplied; point them at a photo here and every screen follows.
export const IMG = { palace: SCENE.palace, lake: SCENE.lake, coast, beach: coast, chairs, village };
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

export const formatPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone || '—';
};

export const maskPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 2)}*** **${digits.slice(-3)}` : '—';
};

export const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(String(value).replace(/\D/g, '').slice(-10)) && String(value).replace(/\D/g, '').length >= 10;
export const nationalNumber = (value) => String(value).replace(/\D/g, '').slice(-10);

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

export const useWide = () => useMedia('(min-width: 1024px)');

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

export function WingsIcon({ size = 20, color = 'currentColor', strokeWidth = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5c3.2-.9 7.1.1 9.6 3.6.3.5.4.9.4 1.4V19" />
      <path d="M22 6.5c-3.2-.9-7.1.1-9.6 3.6" />
      <path d="M4.5 11c2.3-.2 4.6.8 6 2.8" />
      <path d="M19.5 11c-2.3-.2-4.6.8-6 2.8" />
      <path d="M7.5 15.2c1.4 0 2.8.6 3.7 1.7" />
      <path d="M16.5 15.2c-1.4 0-2.8.6-3.7 1.7" />
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

/** Customer shell: sidebar on desktop, bottom tabs on mobile. */
export function Shell({ active, children, wide = false, topbar = true, hideNav = false, greeting }) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const location = useLocation();
  const current = active || NAV.find((n) => location.pathname.startsWith(n.path))?.key;
  return (
    <div className="pt-app">
      <div className="pt-shell" style={hideNav ? { paddingBottom: 0 } : undefined}>
        {!hideNav && (
          <aside className="pt-side">
            <button type="button" className="pt-brand" onClick={() => navigate('/dashboard')}>
              <img src={BrightLogo} alt="" />
              <span className="pt-brand-stack"><span className="pt-brand-name">Bright Wings</span><span className="pt-brand-sub">LOYALTY PORTAL</span></span>
            </button>
            <nav aria-label="Primary">
              {NAV.map(({ key, label, path, Icon }) => (
                <button key={key} type="button" className={current === key ? 'active' : ''} onClick={() => navigate(path)}>
                  <Icon size={19} /> {label}
                </button>
              ))}
            </nav>
            <div className="pt-side-art">
              <div className="pt-art" style={{ backgroundImage: bg(IMG.palace) }} />
              <p>More journeys<br />brighter days</p>
            </div>
          </aside>
        )}
        <div className="pt-main">
          {topbar && (
            <header className="pt-topbar">
              <button type="button" className="pt-brand" onClick={() => navigate('/dashboard')}>
                <img src={BrightLogo} alt="" />
                <span className="pt-brand-name">Bright Wings</span>
              </button>
              {greeting ? <div className="pt-hide-sm" style={{ flex: 1 }}>{greeting}</div> : <div style={{ flex: 1 }} />}
              <div className="pt-top-actions">
                <BellButton />
                <span className="pt-hide-sm"><Avatar user={userData} onClick={() => navigate('/account')} /></span>
              </div>
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

export function TextArea({ error, max, value = '', ...props }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <textarea className={`pt-textarea ${error ? 'err' : ''}`} value={value} maxLength={max} {...props} />
      {max && <span className="pt-count">{String(value).length}/{max}</span>}
    </div>
  );
}

export function PhoneField({ value, onChange, error, placeholder = '98765 43210', autoFocus, disabled }) {
  return (
    <div className={`pt-phone ${error ? 'err' : ''}`}>
      <span className="pt-phone-cc"><span className="pt-flag" /> +91 <ChevronDown size={14} /></span>
      <input
        type="tel"
        name="phone"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        aria-label="Phone number"
      />
    </div>
  );
}

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
