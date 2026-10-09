import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Check, Clock, Copy, Plane, Briefcase } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import { Avatar, Badge, Empty, ErrorState, Page, Shell, Skeleton, fmtDate, humanize, useAsync, useCopy } from '../ui';
import { photoFor } from '../photos';
import { bookingTitle, serviceOf, statusMeta } from '../booking';
import { fmtRange, milestoneDates } from './common';

const TAB_OF = (b) => {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'completed') return 'completed';
  if (['new', 'assigned', 'contacted'].includes(b.status)) return 'progress';
  return 'upcoming';
};

// Four milestone labels per kind of trip (the same four backend milestones).
const LABELS = {
  flight: ['Request received', 'Quote ready', 'Confirm booking', 'Ticketing'],
  hotel: ['Request received', 'Quote ready', 'Confirmed', 'Stay completed'],
  journey: ['Planning', 'Quote ready', 'Confirmed', 'Completed'],
  default: ['Request received', 'Quote ready', 'Confirmed', 'Completed'],
};
const labelsFor = (type) => (type === 'flight' ? LABELS.flight : type === 'hotel' ? LABELS.hotel : ['tour', 'custom', 'cruise'].includes(type) ? LABELS.journey : LABELS.default);
const TAG = { flight: 'FLIGHT', hotel: 'HOTEL', tour: 'JOURNEY', custom: 'JOURNEY', cruise: 'CRUISE', visa: 'VISA', car_rental: 'CAR', airport_transfer: 'TRANSFER', insurance: 'INSURANCE', activity: 'ACTIVITY' };

const subline = (b) => {
  const svc = serviceOf(b.type);
  const bits = [];
  if (b.type === 'flight') bits.push(b.tripType === 'oneway' ? 'One way' : 'Round trip', b.class ? `${humanize(b.class)} class` : null);
  else if (b.type === 'hotel') bits.push([b.destination, b.region].filter(Boolean).join(', ') || null);
  else bits.push(svc.label);
  const people = svc.people_of(b);
  if (people) bits.push(b.type === 'hotel' ? `${people} guests` : `${people} traveler${Number(people) === 1 ? '' : 's'}`);
  return bits.filter(Boolean).join('  •  ');
};

const fallbackNote = (b, advisor) => {
  const name = advisor?.name?.split(' ')[0];
  switch (b.status) {
    case 'awaiting_approval': return 'Your personalized options are ready. Review the itinerary and let us know your preferred option.';
    case 'booking_confirmed': case 'payment_received': case 'awaiting_payment': return 'Your reservation is confirmed. We’ve noted your requests and will share documents as they are ready.';
    case 'completed': return 'We hope you had an incredible trip! See your itinerary and travel documents anytime.';
    case 'cancelled': return 'This request was cancelled. Start a new one whenever you’re ready.';
    case 'assigned': case 'contacted': return name ? `${name} is working on your request and will share options soon.` : 'Your advisor is working on your request.';
    default: return 'Your request has been received. A travel advisor will be assigned shortly.';
  }
};

function Timeline({ booking, dates }) {
  const labels = labelsFor(booking.type);
  const stamps = [dates.created, dates.quote, dates.confirmed, dates.completed];
  const firstOpen = stamps.findIndex((d) => !d);
  return (
    <ol className="db-line">
      {labels.map((label, i) => {
        const done = !!stamps[i];
        return (
          <li key={label} className={`${done ? 'done' : ''} ${i === firstOpen ? 'now' : ''}`}>
            <span className="dot">{done && i === firstOpen - 1 ? <span /> : null}</span>
            <b>{label}</b>
            <small>{done ? fmtDate(stamps[i]) : ''}</small>
          </li>
        );
      })}
    </ol>
  );
}

export default function DeskBookings() {
  const navigate = useNavigate();
  const { bookings, loading, error, loadUserBookings } = useBooking();
  const { data: feed } = useAsync(() => api.get('/portal/bookings').catch(() => ({})), [bookings.length]);
  const { copied, copy } = useCopy();
  const [tab, setTab] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUserBookings(); }, []);

  const groups = useMemo(() => {
    const g = { upcoming: [], progress: [], completed: [], cancelled: [] };
    [...bookings].sort((a, b) => b.createdAt - a.createdAt).forEach((b) => g[TAB_OF(b)].push(b));
    return g;
  }, [bookings]);
  const active = tab || (groups.upcoming.length ? 'upcoming' : groups.progress.length ? 'progress' : groups.completed.length ? 'completed' : 'upcoming');
  const tabs = [['upcoming', `Upcoming (${groups.upcoming.length})`], ['progress', `In progress (${groups.progress.length})`], ['completed', `Completed (${groups.completed.length})`], ...(groups.cancelled.length ? [['cancelled', `Cancelled (${groups.cancelled.length})`]] : [])];
  const list = groups[active];

  return (
    <Shell active="bookings">
      <Page wide>
        <header className="db-head">
          <div><h1 className="pt-title">Your bookings</h1><p className="pt-lede">Plan new adventures and keep track of every trip, all in one place.</p></div>
          <button type="button" className="pt-gold-btn" onClick={() => navigate('/bookings/new')}><Plane size={20} /> Request new travel <ArrowRight size={18} /></button>
        </header>

        <div className="db-tabs" role="tablist">{tabs.map(([v, l]) => <button type="button" role="tab" aria-selected={active === v} key={v} className={active === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}</div>

        {error && !bookings.length ? <ErrorState onRetry={loadUserBookings} /> : loading && !bookings.length ? (
          <div className="pt-stack">{[0, 1].map((i) => <Skeleton key={i} h={250} r={18} />)}</div>
        ) : list.length === 0 ? (
          <div className="pt-card"><Empty icon={Briefcase} title={active === 'upcoming' ? 'No upcoming bookings yet' : `No ${active === 'progress' ? 'in-progress' : active} bookings`}>
            {active === 'upcoming' ? 'Flights, hotels, transfers and curated journeys are one request away.' : 'Nothing to show here right now.'}
            {active === 'upcoming' && <button type="button" className="pt-gold-btn sm" style={{ marginTop: 10 }} onClick={() => navigate('/bookings/new')}>Request new travel</button>}
          </Empty></div>
        ) : (
          <div className="pt-stack lg">
            {list.map((b) => {
              const meta = statusMeta(b.status);
              const info = feed?.[b.docId];
              const advisor = info?.advisor;
              const dates = milestoneDates(info?.events, b);
              const svc = serviceOf(b.type);
              const start = svc.date_of(b);
              const end = b.returnDate || b.checkOut || b.endDate || b.dropoffAt;
              const note = info?.latest_message?.body || fallbackNote(b, advisor);
              return (
                <article key={b.docId} className="pt-card db-card">
                  <div className="db-photo" style={{ backgroundImage: `url(${photoFor(b.type, b.destination, b.to, b.hotel, b.region, b.country, b.destinations)})` }}>
                    <span className="db-tag"><svc.Icon size={14} /> {TAG[b.type] || svc.label.toUpperCase()}</span>
                  </div>
                  <div className="db-main">
                    <div className="db-top">
                      <div>
                        <h2>{bookingTitle(b)}</h2>
                        <p className="db-sub">{subline(b)}</p>
                      </div>
                      <Badge tone={meta.tone} style={{ alignSelf: 'flex-start', fontSize: 13, padding: '8px 14px' }}>{b.status === 'awaiting_approval' ? <Clock size={14} /> : ['booking_confirmed', 'completed'].includes(b.status) ? <Check size={14} /> : null} {meta.label}</Badge>
                      <button type="button" className="db-ref" onClick={() => copy(b.id, b.docId)} aria-label={`Copy reference ${b.id}`}>Ref. {b.id} {copied === b.docId ? <Check size={15} /> : <Copy size={15} />}</button>
                    </div>
                    <div className="db-dates"><Calendar size={17} /> {start ? (end ? fmtRange(start, end) : /^\d{4}-/.test(String(start)) ? fmtDate(start) : String(start)) : 'Dates to be confirmed'}</div>
                    <Timeline booking={b} dates={dates} />
                    <div className="db-foot">
                      <div className="db-advisor">
                        {advisor ? <Avatar user={{ displayName: advisor.name }} /> : <span className="pt-avatar" style={{ background: '#eef1f4' }}><Clock size={18} /></span>}
                        <span><small>Your travel advisor</small><b>{advisor?.name || 'To be assigned'}</b></span>
                      </div>
                      <p className="db-note">{note}</p>
                      <button type="button" className="pt-navy-btn" onClick={() => navigate(`/bookings/${b.docId}`)}>View details <ArrowRight size={17} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Page>
    </Shell>
  );
}
