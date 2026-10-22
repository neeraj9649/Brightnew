import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Themed calendar that replaces the browser's native date picker. `Input` renders it for
 * `type="date"` and `type="datetime-local"`, and it keeps the same contract: values are
 * `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm` strings, `min` / `max` limit the days, and `onChange`
 * receives `{ target: { value, name } }`, so every existing caller works unchanged.
 */

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
};
const parseTime = (s) => {
  const m = /T(\d{2}):(\d{2})/.exec(s || '');
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const POP_W = 304;

const show = (d, withTime, time) => {
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return withTime && time ? `${day}, ${pad(time[0])}:${pad(time[1])}` : day;
};

export default function DatePicker({
  value, onChange, min, max, disabled, placeholder, className = '', error, withTime = false, hasLeftIcon = false, name,
  ...rest
}) {
  const selected = useMemo(() => parseDay(value), [value]);
  const valueTime = useMemo(() => (withTime ? parseTime(value) : null), [value, withTime]);
  const minD = useMemo(() => parseDay(min), [min]);
  const maxD = useMemo(() => parseDay(max), [max]);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days'); // days | months | years
  const [cursor, setCursor] = useState(() => startOfMonth(selected || new Date()));
  const [focusDay, setFocusDay] = useState(() => selected || new Date());
  const [time, setTime] = useState(valueTime || [9, 0]);
  const [pos, setPos] = useState({ top: 0, left: 0, width: POP_W });
  const popId = useId();
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const blocked = useCallback((d) => (minD && d < minD) || (maxD && d > maxD), [minD, maxD]);

  const emit = useCallback((d, t) => {
    const next = withTime ? `${toIso(d)}T${pad(t[0])}:${pad(t[1])}` : toIso(d);
    onChange?.({ target: { value: next, name } });
  }, [onChange, withTime, name]);

  const openPicker = () => {
    if (disabled) return;
    const base = selected || (minD && new Date() < minD ? minD : new Date());
    setCursor(startOfMonth(base));
    setFocusDay(base);
    setTime(valueTime || [9, 0]);
    setView('days');
    setOpen(true);
  };
  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Anchor under the field (or above when there is no room); keep inside the viewport.
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(POP_W, vw - 16);
    const h = popRef.current?.offsetHeight || 340;
    const left = Math.max(8, Math.min(r.left, vw - width - 8));
    let top = r.bottom + 6;
    if (top + h > vh - 8) top = r.top - h - 6 > 8 ? r.top - h - 6 : Math.max(8, vh - h - 8);
    setPos((p) => (p.top === top && p.left === left && p.width === width ? p : { top, left, width }));
  }, []);

  useLayoutEffect(() => { if (open) place(); });
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      close();
    };
    // Capture on window so Escape closes only the calendar, not a modal around it.
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close(true);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, close, place]);

  // Keep keyboard focus on the active day.
  useEffect(() => {
    if (open && view === 'days') popRef.current?.querySelector('[data-focus="true"]')?.focus({ preventScroll: true });
  }, [open, view, focusDay]);

  const pick = (d) => {
    if (blocked(d)) return;
    if (withTime) {
      emit(d, time);
      setFocusDay(d);
      setCursor(startOfMonth(d));
    } else {
      emit(d, time);
      close(true);
    }
  };
  const setTimePart = (idx, v) => {
    const next = idx === 0 ? [v, time[1]] : [time[0], v];
    setTime(next);
    if (selected) emit(selected, next);
  };
  const goToday = () => {
    const t = new Date();
    if (blocked(t)) return;
    setCursor(startOfMonth(t));
    pick(t);
  };
  const clear = () => {
    onChange?.({ target: { value: '', name } });
    close(true);
  };

  const onGridKey = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    let next = null;
    if (step) next = addDays(focusDay, step);
    else if (e.key === 'PageUp') next = addMonths(focusDay, e.shiftKey ? -12 : -1);
    else if (e.key === 'PageDown') next = addMonths(focusDay, e.shiftKey ? 12 : 1);
    else if (e.key === 'Home') next = addDays(focusDay, -focusDay.getDay());
    else if (e.key === 'End') next = addDays(focusDay, 6 - focusDay.getDay());
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(focusDay); return; }
    if (!next) return;
    e.preventDefault();
    setFocusDay(next);
    setCursor(startOfMonth(next));
  };

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const from = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(from, i));
  }, [cursor]);
  const yearStart = cursor.getFullYear() - 5;

  const title = view === 'days' ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : view === 'months' ? String(cursor.getFullYear()) : `${yearStart} – ${yearStart + 11}`;
  const prev = () => setCursor((c) => (view === 'days' ? addMonths(startOfMonth(c), -1) : view === 'months' ? new Date(c.getFullYear() - 1, c.getMonth(), 1) : new Date(c.getFullYear() - 12, c.getMonth(), 1)));
  const next = () => setCursor((c) => (view === 'days' ? addMonths(startOfMonth(c), 1) : view === 'months' ? new Date(c.getFullYear() + 1, c.getMonth(), 1) : new Date(c.getFullYear() + 12, c.getMonth(), 1)));
  const upLevel = () => setView((v) => (v === 'days' ? 'months' : 'years'));

  const minutes = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, i) => i * 5);
    return base.includes(time[1]) ? base : [...base, time[1]].sort((a, b) => a - b);
  }, [time]);

  return (
    <div className={`pt-date ${hasLeftIcon ? 'has-left' : ''}`}>
      <input
        {...rest}
        ref={triggerRef}
        type="text"
        readOnly
        className={`pt-input ${error ? 'err' : ''} ${className}`.trim()}
        value={selected ? show(selected, withTime, valueTime) : ''}
        placeholder={placeholder || (withTime ? 'Select date & time' : 'Select date')}
        disabled={disabled}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        autoComplete="off"
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (!open) openPicker(); } }}
      />
      {!hasLeftIcon && <CalendarDays size={17} className="pt-date-ic" aria-hidden="true" />}
      {open && createPortal(
        <div ref={popRef} id={popId} className="pt-cal" role="dialog" aria-label="Choose date" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="pt-cal-head">
            <button type="button" className="pt-cal-nav" aria-label="Previous" onClick={prev}><ChevronLeft size={18} /></button>
            <button type="button" className="pt-cal-title" onClick={upLevel} disabled={view === 'years'} aria-label="Change month or year">{title}</button>
            <button type="button" className="pt-cal-nav" aria-label="Next" onClick={next}><ChevronRight size={18} /></button>
          </div>

          {view === 'days' && (
            <>
              <div className="pt-cal-week" aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
              <div className="pt-cal-grid" role="grid" onKeyDown={onGridKey}>
                {cells.map((d) => {
                  const out = d.getMonth() !== cursor.getMonth();
                  const off = blocked(d);
                  const isSel = sameDay(d, selected);
                  const isFocus = sameDay(d, focusDay);
                  return (
                    <button
                      type="button"
                      key={toIso(d)}
                      role="gridcell"
                      tabIndex={isFocus ? 0 : -1}
                      data-focus={isFocus ? 'true' : undefined}
                      aria-selected={isSel}
                      aria-disabled={off || undefined}
                      aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      className={`pt-cal-day ${out ? 'out' : ''} ${off ? 'off' : ''} ${isSel ? 'sel' : ''} ${sameDay(d, today) ? 'today' : ''}`}
                      onClick={() => { setFocusDay(d); pick(d); }}
                    >{d.getDate()}</button>
                  );
                })}
              </div>
            </>
          )}

          {view === 'months' && (
            <div className="pt-cal-pick">
              {MONTHS.map((m, i) => (
                <button type="button" key={m} className={selected && selected.getFullYear() === cursor.getFullYear() && selected.getMonth() === i ? 'sel' : ''} onClick={() => { setCursor(new Date(cursor.getFullYear(), i, 1)); setView('days'); }}>{m.slice(0, 3)}</button>
              ))}
            </div>
          )}

          {view === 'years' && (
            <div className="pt-cal-pick">
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
                <button type="button" key={y} className={selected && selected.getFullYear() === y ? 'sel' : ''} onClick={() => { setCursor(new Date(y, cursor.getMonth(), 1)); setView('months'); }}>{y}</button>
              ))}
            </div>
          )}

          {withTime && view === 'days' && (
            <div className="pt-cal-time">
              <span>Time</span>
              <select className="pt-select" aria-label="Hour" value={time[0]} onChange={(e) => setTimePart(0, Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}</select>
              <b>:</b>
              <select className="pt-select" aria-label="Minute" value={time[1]} onChange={(e) => setTimePart(1, Number(e.target.value))}>{minutes.map((m) => <option key={m} value={m}>{pad(m)}</option>)}</select>
            </div>
          )}

          <div className="pt-cal-foot">
            <span className="pt-cal-foot-l">
              <button type="button" onClick={goToday} disabled={blocked(today)}>Today</button>
              {value ? <button type="button" onClick={clear}>Clear</button> : null}
            </span>
            {withTime ? <button type="button" className="primary" onClick={() => close(true)}>Done</button> : <span />}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
