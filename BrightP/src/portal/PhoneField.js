import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  MAX_NATIONAL, countryOf, dialOf, digitsOnly, flagOf, formatNational, fromInternational, initialCountry, rememberCountry,
  searchCountries, splitPhone, suggestedCountries,
} from './phone';

/*
 * International phone input: a country picker (flag + dial code) next to a number box that formats as you type.
 * `value` / `onChange` use "+<country code><national number>" (or '' when empty). Use toStoredPhone() before
 * sending to the API and isValidPhone() to validate.
 *
 * Picker: search by name, ISO code or dial code ("uk", "united kin", "+44"), a short "Suggested" list first,
 * keyboard support (arrows / enter / escape) and a bottom sheet on phones. Typing or pasting a full "+44 7700…"
 * number switches the country automatically.
 */
export default function PhoneField({ value, onChange, error, placeholder, autoFocus, disabled }) {
  const [iso, setIso] = useState(() => (value ? splitPhone(value, initialCountry()).iso : initialCountry()));
  const [national, setNational] = useState(() => (value ? splitPhone(value, initialCountry()).national : ''));
  const [open, setOpen] = useState(false);
  const last = useRef(value || '');
  const input = useRef(null);
  const caret = useRef(null);
  const trigger = useRef(null);

  // Follow value changes made by the parent (prefill, reset), but ignore the echo of our own onChange.
  useEffect(() => {
    if ((value || '') === last.current) return;
    last.current = value || '';
    if (!value) { setNational(''); return; }
    const s = splitPhone(value, iso);
    setIso(s.iso);
    setNational(s.national);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((nextIso, nextNational) => {
    const v = nextNational ? `+${dialOf(nextIso)}${nextNational}` : '';
    last.current = v;
    onChange(v);
  }, [onChange]);

  const display = formatNational(iso, national);

  useLayoutEffect(() => {
    if (caret.current == null || !input.current) return;
    let seen = 0;
    let pos = display.length;
    if (caret.current === 0) pos = 0;
    else {
      for (let i = 0; i < display.length; i += 1) {
        if (/\d/.test(display[i])) seen += 1;
        if (seen === caret.current) { pos = i + 1; break; }
      }
    }
    input.current.setSelectionRange(pos, pos);
    caret.current = null;
  });

  const onType = (e) => {
    const raw = e.target.value;
    const intl = fromInternational(raw);
    let nextIso = iso;
    let digits;
    if (intl) {
      nextIso = intl.iso;
      digits = intl.national;
      rememberCountry(nextIso);
      setIso(nextIso);
    } else {
      digits = digitsOnly(raw);
      // Backspacing over a space/bracket only removes formatting: treat it as deleting the digit before it.
      if (digits === national && raw.length < display.length) digits = digits.slice(0, -1);
      if (nextIso === 'IN' || raw.trim().startsWith('0')) digits = digits.replace(/^0+/, '');
    }
    digits = digits.slice(0, MAX_NATIONAL(nextIso));
    const before = digitsOnly(raw.slice(0, e.target.selectionStart || 0)).length;
    caret.current = intl ? null : Math.min(before, digits.length);
    setNational(digits);
    emit(nextIso, digits);
  };

  const pick = (nextIso) => {
    setOpen(false);
    rememberCountry(nextIso);
    const trimmed = national.slice(0, MAX_NATIONAL(nextIso));
    setIso(nextIso);
    setNational(trimmed);
    emit(nextIso, trimmed);
    setTimeout(() => input.current?.focus(), 0);
  };

  const country = countryOf(iso);
  return (
    <div className={`pt-phone ${error ? 'err' : ''} ${disabled ? 'off' : ''}`}>
      <button
        type="button"
        ref={trigger}
        className="pt-phone-cc pt-cc-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${country?.name || iso} +${dialOf(iso)}. Change`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pt-cc-flag" aria-hidden="true">{flagOf(iso)}</span>
        <span>+{dialOf(iso)}</span>
        <ChevronDown size={14} />
      </button>
      <input
        ref={input}
        type="tel"
        name="phone"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={placeholder || (iso === 'IN' ? '98765 43210' : 'Mobile number')}
        value={display}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={onType}
        aria-label="Phone number"
        aria-invalid={error ? 'true' : undefined}
      />
      {open && <CountryPicker selected={iso} anchor={trigger} onPick={pick} onClose={() => { setOpen(false); trigger.current?.focus(); }} />}
    </div>
  );
}

function CountryPicker({ selected, anchor, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const panel = useRef(null);
  const listRef = useRef(null);

  const suggested = useMemo(() => suggestedCountries(), []);
  const results = useMemo(() => searchCountries(query), [query]);
  const options = useMemo(() => (query ? results : [...suggested, ...results]), [query, results, suggested]);

  useLayoutEffect(() => {
    const r = anchor.current?.closest('.pt-phone')?.getBoundingClientRect();
    if (!r) return;
    const room = window.innerHeight - r.bottom;
    const height = Math.min(380, window.innerHeight - 24);
    const above = room < Math.min(height, 300) && r.top > room;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - 392)), ...(above ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }), width: Math.min(384, window.innerWidth - 16) });
  }, [anchor]);

  useEffect(() => {
    const down = (e) => { if (panel.current && !panel.current.contains(e.target) && !anchor.current?.contains(e.target)) onClose(); };
    const away = (e) => { if (!panel.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', down);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', away, true);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('resize', onClose); window.removeEventListener('scroll', away, true); };
  }, [anchor, onClose]);

  useEffect(() => { setActive(query ? 0 : Math.max(options.findIndex((c) => c.iso === selected), 0)); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active, query]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (options[active]) onPick(options[active].iso); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
  };

  let index = -1;
  const row = (c, prefix) => {
    index += 1;
    const i = index;
    return (
      <li
        key={`${prefix}${c.iso}`}
        id={`cc-${prefix}${c.iso}`}
        role="option"
        aria-selected={c.iso === selected}
        data-active={i === active}
        className={`pt-cc-row ${i === active ? 'on' : ''}`}
        onMouseMove={() => i !== active && setActive(i)}
        onClick={() => onPick(c.iso)}
      >
        <span className="pt-cc-flag" aria-hidden="true">{flagOf(c.iso)}</span>
        <span className="pt-cc-name">{c.name}</span>
        <span className="pt-cc-dial">+{c.dial}</span>
        {c.iso === selected && <Check size={16} className="pt-cc-check" />}
      </li>
    );
  };

  const activeId = options[active] ? `cc-${query || active < suggested.length ? (query ? '' : 's-') : 'a-'}${options[active].iso}` : undefined;

  return (
    <>
      <div className="pt-cc-backdrop" onClick={onClose} />
      <div ref={panel} className="pt-cc-panel" style={pos || { visibility: 'hidden' }} role="dialog" aria-label="Choose country code">
        <div className="pt-cc-search">
          <Search size={17} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search country or code (e.g. UK, +44)"
            aria-label="Search countries"
            aria-controls="cc-list"
            aria-activedescendant={activeId}
            autoComplete="off"
            enterKeyHint="go"
          />
          {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button> : <button type="button" className="pt-cc-close" aria-label="Close" onClick={onClose}><X size={18} /></button>}
        </div>
        <ul id="cc-list" ref={listRef} role="listbox" aria-label="Countries">
          {!query && <li className="pt-cc-head" role="presentation">Suggested</li>}
          {!query && suggested.map((c) => row(c, 's-'))}
          {!query && <li className="pt-cc-head" role="presentation">All countries</li>}
          {results.map((c) => row(c, query ? '' : 'a-'))}
          {query && results.length === 0 && <li className="pt-cc-empty" role="presentation">No country matches “{query}”.<br />Try a country name or dial code.</li>}
        </ul>
      </div>
    </>
  );
}
