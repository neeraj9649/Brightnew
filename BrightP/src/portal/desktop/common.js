import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { fmtDate } from '../ui';

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "12 – 19 Dec 2026" (collapses the month/year when both ends share them). */
export function fmtRange(a, b) {
  const x = toDate(a);
  const y = toDate(b);
  if (!x) return a ? String(a) : '';
  if (!y) return fmtDate(x);
  const sameYear = x.getFullYear() === y.getFullYear();
  const sameMonth = sameYear && x.getMonth() === y.getMonth();
  const mon = (d) => d.toLocaleString('en-IN', { month: 'short' });
  if (sameMonth) return `${x.getDate()} – ${y.getDate()} ${mon(y)} ${y.getFullYear()}`;
  if (sameYear) return `${x.getDate()} ${mon(x)} – ${y.getDate()} ${mon(y)} ${y.getFullYear()}`;
  return `${fmtDate(x)} – ${fmtDate(y)}`;
}

export function nightsBetween(a, b) {
  const x = toDate(a);
  const y = toDate(b);
  if (!x || !y) return null;
  const n = Math.round((y - x) / 864e5);
  return n > 0 ? n : null;
}

export const initialsOf = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'BW';

/** Breadcrumb row used on desktop detail pages. */
export function Crumbs({ trail }) {
  const navigate = useNavigate();
  return (
    <div className="pt-crumbs" aria-label="Breadcrumb">
      {trail.map(([label, to], i) => (
        <React.Fragment key={label}>
          {i > 0 && <ChevronRight size={14} />}
          {to ? <button type="button" onClick={() => navigate(to)}>{label}</button> : <strong>{label}</strong>}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Milestone events derived from the booking activity feed. */
export const MILESTONE_EVENTS = [
  ['created', 'Request received'],
  ['assigned', 'Advisor assigned'],
  ['quote', 'Quotation ready'],
  ['confirmed', 'Booking confirmed'],
  ['completed', 'Trip completed'],
];

export function milestoneDates(events = [], booking) {
  const find = (re) => events.find((e) => re.test(e.message))?.created_at;
  return {
    created: booking?.createdAt || find(/received/i),
    assigned: find(/assigned to a travel advisor/i),
    quote: find(/quotation sent/i) || find(/awaiting_approval/),
    confirmed: find(/booking_confirmed/),
    completed: find(/completed/),
  };
}
