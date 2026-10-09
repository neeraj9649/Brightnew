import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, Check, CircleHelp, Clock, Copy, Download, FileText, Info, Mail, MessageCircle, Phone, Plane, Send, User, X, Luggage, ReceiptText, Utensils, RefreshCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { fileUrl } from '../../services/storage';
import { useBooking } from '../../contexts/BookingContext';
import { Avatar, ErrorState, Field, Modal, ModalHead, Page, Shell, Skeleton, TextArea, WingsIcon, fmtDate, fmtDateTime, fmtMoney, humanize, useAsync, useCopy } from '../ui';
import { photoFor } from '../photos';
import { bookingDate, serviceOf, statusMeta } from '../booking';
import { iata, useBookingData } from '../customer/BookingDetail';
import { fmtRange, nightsBetween } from './common';

const LEDE = {
  new: 'Your request has been received. A travel advisor will be assigned shortly.',
  assigned: 'Your travel advisor is working on your request and will share options soon.',
  contacted: 'Your travel advisor is working on your request and will share options soon.',
  awaiting_approval: 'Your personalised travel experience is one step away. Review the quote below and let us know how you’d like to proceed.',
  awaiting_payment: 'Your booking is almost there. Your advisor will share the next steps with you.',
  payment_received: 'Payment received. Your advisor is finalising your booking.',
  booking_confirmed: 'Your booking is confirmed. We’ll share your documents as soon as they’re ready.',
  completed: 'This trip is complete. We hope you had a wonderful journey.',
  cancelled: 'This request was cancelled. You can start a new one whenever you’re ready.',
};

const hhmm = (v) => v || '—';

function Leg({ leg }) {
  const d = leg.date ? new Date(leg.date) : null;
  const dateLabel = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }).replace(',', '') : '';
  return (
    <div className="bd-leg">
      <div className="bd-leg-tag"><b>{leg.label || 'FLIGHT'}</b>{dateLabel && <span>{dateLabel}</span>}</div>
      <div className="bd-leg-row">
        <div className="bd-airline"><b>{leg.airline || 'Airline to be confirmed'}</b>{leg.flight && <small>{leg.flight}</small>}</div>
        <div className="bd-point"><strong>{hhmm(leg.depart)}</strong><b>{leg.from_code}</b><small>{[leg.from_city, leg.from_terminal].filter(Boolean).join(' ')}</small></div>
        <div className="bd-mid"><small>{leg.duration}</small><span><Plane size={16} /></span><small>{leg.stops}</small></div>
        <div className="bd-point right"><strong>{hhmm(leg.arrive)}</strong><b>{leg.to_code}</b><small>{[leg.to_city, leg.to_terminal].filter(Boolean).join(' ')}</small></div>
      </div>
    </div>
  );
}

const istTime = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`;
};

export default function DeskBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cancelBooking, loadUserBookings } = useBooking();
  const { copied, copy } = useCopy();
  const { data, loading, error, reload } = useBookingData(id);
  const messages = useAsync(() => api.get(`/portal/bookings/${id}/messages`).catch(() => []), [id]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const composer = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  const frame = (body) => <Shell active="bookings"><Page wide>{body}</Page></Shell>;
  if (loading && !data) return frame(<div className="pt-stack" style={{ marginTop: 30 }}><Skeleton h={60} w={420} /><Skeleton h={200} r={18} /><Skeleton h={320} r={18} /></div>);
  if (error || !data) return frame(<div style={{ marginTop: 30 }}><ErrorState title="We couldn’t load this booking" onRetry={reload}>This request may have been removed, or the connection dropped. Nothing has changed.</ErrorState></div>);

  const { booking, portal, docs } = data;
  const svc = serviceOf(booking.type);
  const meta = statusMeta(booking.status);
  const quote = portal.quote;
  const advisor = portal.advisor;
  const events = portal.events || [];
  const thread = messages.data || [];
  const find = (re) => events.find((e) => re.test(e.message))?.created_at;
  const quoteAt = find(/quotation sent/i);
  const confirmedAt = find(/booking_confirmed/);
  const completedAt = find(/completed/);
  const start = bookingDate(booking);
  const end = booking.returnDate || booking.checkOut || booking.endDate || booking.dropoffAt;
  const nights = nightsBetween(booking.departureDate || booking.checkIn || booking.startDate, end);
  const people = svc.people_of(booking) || 1;
  const [, fromCity] = iata(booking.from);
  const [, toCity] = iata(booking.to);
  const heading = booking.type === 'flight' ? [fromCity || 'Departure', toCity || 'Destination'] : [svc.title_of(booking)];
  const cancellable = !['completed', 'cancelled'].includes(booking.status);
  const sum = quote?.summary || {};
  const open = quote && quote.status === 'sent' && !(quote.valid_until && new Date(quote.valid_until) < new Date());
  const earnTxt = booking.status === 'completed' ? 'Wings credited for this trip' : 'You will receive Wings';

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try { await api.post(`/portal/bookings/${id}/messages`, { body }); setDraft(''); await messages.reload(); } catch (e) { toast.error(e.message || 'We could not send your message'); } finally { setSending(false); }
  };
  const act = async (fn, ok) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await Promise.all([reload(), loadUserBookings()]); } catch (e) { toast.error(e.message || 'Something went wrong'); } finally { setBusy(false); }
  };
  const doCancel = async () => {
    setBusy(true);
    try { await cancelBooking(booking.id); await loadUserBookings(); toast.success('Your request has been cancelled'); navigate('/bookings', { replace: true }); } finally { setBusy(false); setCancelOpen(false); }
  };

  const progress = [
    ['Request submitted', booking.createdAt, 'Your request has been received.', true],
    ['Advisor assigned', find(/assigned to a travel advisor/i), advisor ? `${advisor.name.split(' ')[0]} has started working on your trip.` : 'We’ll assign an advisor shortly.', !!advisor],
    ['Quote ready', quoteAt, 'Your personalised quote is ready.', !!quoteAt],
    ['Customer confirmation', confirmedAt, confirmedAt ? 'You confirmed this booking.' : quoteAt ? 'Awaiting your response.' : 'After your quote is ready.', !!confirmedAt],
    ['Completed', completedAt, `${earnTxt === 'You will receive Wings' ? 'Wings will be awarded after completion.' : 'Wings were awarded to your account.'}`, !!completedAt],
  ];
  const firstOpen = progress.findIndex((p) => !p[3]);

  return frame(
    <>
      <div className="bd-top">
        <button type="button" className="pt-back" onClick={() => navigate('/bookings')}><ArrowLeft size={17} /> Back to bookings</button>
        <div className="bd-ids"><span>Booking ID: <b>{booking.id}</b> <button type="button" aria-label="Copy booking ID" onClick={() => copy(booking.id, 'id')}>{copied === 'id' ? <Check size={14} /> : <Copy size={14} />}</button></span><span>Booked on {fmtDate(booking.createdAt)}</span></div>
      </div>

      <div className="bd-grid">
        <div className="pt-stack lg" style={{ minWidth: 0 }}>
          <div>
            <div className="pt-row" style={{ gap: 18, flexWrap: 'wrap' }}><h1 className="pt-title">Booking {booking.id}</h1><span className={`bd-pill ${meta.tone}`}>{meta.label}</span></div>
            <p className="pt-lede">{LEDE[booking.status]}</p>
          </div>

          <section className="bd-banner" style={{ '--bd-photo': `url(${photoFor(booking.type, booking.to, booking.destination, booking.destinations, booking.region, booking.country, booking.hotel)})` }}>
            <div className="bd-banner-copy">
              <h2>{heading.map((h, i) => <React.Fragment key={h}>{i > 0 && <ArrowRight size={30} className="bd-arrow" />}{h}</React.Fragment>)}</h2>
              <div className="bd-facts">
                <span><svc.Icon size={19} /> {svc.label}</span>
                <span><Calendar size={19} /><b>{start ? (end ? fmtRange(start, end) : /^\d{4}-/.test(String(start)) ? fmtDate(start) : String(start)) : 'Dates to be confirmed'}</b>{nights ? <small>{nights} days</small> : null}</span>
                <span><User size={19} /><b>{people} traveller{Number(people) === 1 ? '' : 's'}</b><small>{booking.travelerDetails?.additional?.length ? 'Adults' : 'Adult'}</small></span>
              </div>
            </div>
          </section>

          {quote ? (
            <section className="pt-card bd-quote">
              <h2 className="pt-serif-h">Your {booking.type === 'flight' ? 'flight' : svc.label.toLowerCase()} quote</h2>
              <p className="pt-sub" style={{ marginTop: 4, fontSize: 15 }}>Selected options tailored for your trip. You can request changes or ask questions anytime.</p>
              {booking.type === 'flight' && (sum.legs || []).length > 0 ? (
                <div className="bd-legs">{sum.legs.map((l) => <Leg key={l.label} leg={l} />)}</div>
              ) : (
                <div className="bd-plain">{svc.summary(booking).filter(([, v]) => v).map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{String(v)}</strong></div>)}{sum.notes && <p className="pt-sub" style={{ marginTop: 10 }}>{sum.notes}</p>}</div>
              )}
              {(sum.baggage || sum.fare_type || sum.fare_inclusions || sum.changes) && (
                <div className="bd-fare">
                  {[[Luggage, 'Baggage', sum.baggage], [ReceiptText, 'Fare type', sum.fare_type], [Utensils, 'Inclusions', sum.fare_inclusions], [RefreshCcw, 'Changes', sum.changes]].filter(([, , v]) => v).map(([Icon, label, v]) => (
                    <div key={label}><Icon size={24} strokeWidth={1.5} /><span><b>{label}</b><small>{v}</small></span></div>
                  ))}
                </div>
              )}
              {((quote.inclusions || []).length > 0 || (quote.exclusions || []).length > 0) && (
                <div className="bd-lists">
                  <div><h4><Check size={15} /> Inclusions</h4><ul>{(quote.inclusions || []).map((i) => <li key={i}>{i}</li>)}</ul></div>
                  <div><h4><X size={15} /> Exclusions</h4><ul>{(quote.exclusions || []).map((i) => <li key={i}>{i}</li>)}</ul></div>
                </div>
              )}
              <div className="bd-total">
                <div><small>Total for {people} traveller{Number(people) === 1 ? '' : 's'}</small><strong>{fmtMoney(quote.total)}</strong><span>All taxes and fees included <Info size={14} /></span></div>
                <div className="bd-valid"><Calendar size={22} /><span><small>Quote valid until</small><b>{quote.valid_until ? istTime(quote.valid_until) : 'Further notice'}</b><i>After this, fares may change based on availability.</i></span></div>
                <div className="bd-cta">
                  {quote.status === 'accepted' ? <span className="pt-badge green" style={{ padding: '12px 18px', fontSize: 14 }}><Check size={16} /> Quote accepted</span> : quote.status === 'change_requested' ? <span className="pt-badge blue" style={{ padding: '12px 18px', fontSize: 14 }}>Change requested</span> : (
                    <button type="button" className="pt-gold-btn full" disabled={!open || busy} onClick={() => act(() => api.post(`/portal/bookings/${id}/quote/accept`), 'Quotation accepted')}>Accept quote <ArrowRight size={18} /></button>
                  )}
                  <button type="button" className="pt-navy-btn ghost full" onClick={() => { composer.current?.focus(); composer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><MessageCircle size={18} /> Ask a question</button>
                  {open && <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)', justifySelf: 'center' }} onClick={() => setChangeOpen(true)}>Request changes to this quote</button>}
                </div>
              </div>
              {quote.status === 'change_requested' && quote.change_note && <div className="pt-notice" style={{ marginTop: 16 }}><Info size={18} /><div><strong>You asked for a change</strong>{quote.change_note}</div></div>}
            </section>
          ) : (
            <section className="pt-card bd-quote">
              <h2 className="pt-serif-h">Your request</h2>
              <p className="pt-sub" style={{ marginTop: 4, fontSize: 15 }}>These are the details your travel advisor is working from.</p>
              <div style={{ marginTop: 10 }}>{svc.summary(booking).filter(([, v]) => v).map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{String(v)}</strong></div>)}{booking.specialRequests && <div className="pt-kv"><span>Special requests</span><strong>{booking.specialRequests}</strong></div>}</div>
              {booking.status === 'cancelled' ? null : <div className="pt-notice" style={{ marginTop: 16 }}><Clock size={20} /><div><strong>Your quotation is on its way</strong>Your advisor will send a written quotation here. No payment is taken in the portal.</div></div>}
            </section>
          )}

          {docs.length > 0 && (
            <section className="pt-card bd-quote">
              <h2 className="pt-serif-h">Documents</h2>
              <div style={{ marginTop: 8 }}>{docs.map((d) => <a key={d.id} className="bd-doc" href={d.file_url || fileUrl(d.file_id)} target="_blank" rel="noreferrer"><FileText size={20} /><span><b>{d.label || humanize(d.kind)}</b><small>{humanize(d.kind)} · {fmtDate(d.created_at)}</small></span><Download size={18} /></a>)}</div>
            </section>
          )}

          <section className="pt-card bd-thread">
            <div className="pt-row between"><h2 className="pt-serif-h">Activity &amp; messages</h2>{thread.length > 1 && <button type="button" className="dh-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show latest' : 'View all'} <ArrowRight size={14} /></button>}</div>
            {messages.loading && !messages.data ? <Skeleton h={80} /> : thread.length === 0 ? (
              <p className="pt-sub" style={{ padding: '16px 0 6px' }}>{advisor ? `Say hello to ${advisor.name.split(' ')[0]} — questions about this trip are answered here.` : 'Once an advisor is assigned you can message them here.'}</p>
            ) : (
              <ul>
                {(showAll ? [...thread].reverse() : [...thread].reverse().slice(0, 3)).map((m, i) => (
                  <li key={m.id} className={m.sender_role}>
                    <Avatar user={{ displayName: m.sender_name }} />
                    <div className="bd-msg-meta"><b>{m.sender_role === 'customer' ? 'You' : m.sender_name}</b><small>{fmtDateTime(m.created_at)}</small>{i === 0 && <span className="pt-badge gold" style={{ padding: '3px 10px' }}>Latest</span>}</div>
                    <p>{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="bd-compose">
              <TextArea ref={composer} value={draft} onChange={(e) => setDraft(e.target.value)} max={2000} placeholder={advisor ? `Ask ${advisor.name.split(' ')[0]} a question…` : 'Ask a question about this request…'} />
              <button type="button" className="pt-navy-btn" disabled={sending || !draft.trim()} onClick={send}><Send size={16} /> {sending ? 'Sending…' : 'Send message'}</button>
            </div>
          </section>
        </div>

        <aside className="pt-stack lg" style={{ minWidth: 0 }}>
          <section className="pt-card bd-side">
            <h2 className="pt-serif-h">Booking progress</h2>
            {booking.status === 'cancelled' ? <div className="pt-notice red" style={{ marginTop: 14 }}><X size={18} /><div><strong>Cancelled</strong>This request was cancelled.</div></div> : (
              <ol className="bd-progress">
                {progress.map(([title, at, note, done], i) => (
                  <li key={title} className={`${done ? 'done' : ''} ${i === firstOpen ? 'now' : ''}`}>
                    <span className="dot">{done ? <Check size={14} strokeWidth={3} /> : i === firstOpen ? <span /> : null}</span>
                    <div><b>{title}</b>{done && at ? <small>{fmtDateTime(at)}</small> : null}<small>{note}</small></div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="pt-card bd-side">
            <h2 className="pt-serif-h">Your travel advisor</h2>
            {advisor ? (
              <>
                <div className="bd-advisor"><Avatar user={{ displayName: advisor.name }} size="lg" /><div><b>{advisor.name}</b><span>{advisor.title}</span></div></div>
                <div className="pt-grid2" style={{ marginTop: 16 }}>
                  {advisor.email ? <a className="pt-navy-btn ghost" href={`mailto:${advisor.email}`}><Mail size={17} /> Email</a> : <button type="button" className="pt-navy-btn ghost" onClick={() => { composer.current?.focus(); composer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><MessageCircle size={17} /> Message</button>}
                  {advisor.phone ? <a className="pt-navy-btn ghost" href={`tel:${advisor.phone}`}><Phone size={17} /> Call</a> : portal.support_phone ? <a className="pt-navy-btn ghost" href={`tel:${portal.support_phone.replace(/\s/g, '')}`}><Phone size={17} /> Call</a> : <button type="button" className="pt-navy-btn ghost" disabled><Phone size={17} /> Call</button>}
                </div>
              </>
            ) : <p className="pt-sub" style={{ marginTop: 12 }}>An advisor will be assigned to your request shortly. You’ll be notified here.</p>}
            <div className="bd-wings"><WingsIcon size={34} color="#c9963e" /><div><b>{booking.status === 'completed' ? 'Wings credited' : <>You will receive Wings</>}</b><p>{booking.status === 'completed' ? 'The Wings for this trip are in your account.' : 'Once your trip is completed, the Wings for this service will be awarded to your account.'}</p></div><CircleHelp size={18} /></div>
          </section>

          {cancellable && <button type="button" className="pt-link" style={{ color: 'var(--pt-red)', justifySelf: 'center' }} onClick={() => setCancelOpen(true)}>Cancel this request</button>}
        </aside>
      </div>

      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} label="Request changes">
        <ModalHead title="Request changes" sub="Tell your advisor what you’d like adjusted — dates, timings, budget or inclusions." onClose={() => setChangeOpen(false)} />
        <div className="pt-stack"><Field label="What would you like changed?"><TextArea value={changeNote} onChange={(e) => setChangeNote(e.target.value)} max={1000} placeholder="e.g. Earlier departure, a lower fare…" /></Field>
          <button type="button" className="pt-gold-btn full" disabled={busy || changeNote.trim().length < 3} onClick={() => act(async () => { await api.post(`/portal/bookings/${id}/quote/change`, { note: changeNote.trim() }); setChangeOpen(false); setChangeNote(''); }, 'Your advisor has been notified')}>Send request</button></div>
      </Modal>
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} label="Cancel request">
        <ModalHead title="Cancel this request?" onClose={() => setCancelOpen(false)} />
        <p className="pt-sub">Your travel advisor will stop working on {booking.id}. Wings are never charged for cancelled requests, and you can start a new one at any time.</p>
        <div className="pt-grid2" style={{ marginTop: 20 }}><button type="button" className="pt-navy-btn ghost" onClick={() => setCancelOpen(false)}>Keep request</button><button type="button" className="pt-navy-btn" style={{ background: '#b04a43', borderColor: '#b04a43' }} disabled={busy} onClick={doCancel}>{busy ? 'Cancelling…' : 'Cancel request'}</button></div>
      </Modal>
    </>,
  );
}

