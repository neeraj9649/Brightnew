import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Clock, Copy, Download, EllipsisVertical, FileText, Info, MessageSquare, Phone, Plane, X, CircleCheck, CircleX, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { fileUrl } from '../../services/storage';
import { useBooking, mapBookingDTO } from '../../contexts/BookingContext';
import {
  AppBar, Avatar, Badge, Card, ErrorState, Field, Modal, ModalHead, Notice, Page, Shell, Skeleton, TextArea, WingsIcon, fmtDate, fmtDateTime, fmtMoney, humanize, KV, useAsync, useCopy, useWide,
} from '../ui';
import { MILESTONES, serviceOf, statusMeta } from '../booking';
import { ServiceArt } from './parts';

const stepDates = (events = [], booking) => {
  const at = (pred) => events.find(pred)?.created_at;
  return [
    booking?.createdAt,
    at((e) => e.kind === 'assigned' || /assigned/i.test(e.message)),
    at((e) => e.kind === 'quote' && /sent/i.test(e.message)) || at((e) => /awaiting_approval/.test(e.message)),
    at((e) => /booking_confirmed/.test(e.message)),
    at((e) => /completed/.test(e.message)),
  ];
};

export const iata = (value = '') => {
  const m = String(value).match(/\(([A-Z]{3})\)/);
  return m ? [m[1], String(value).replace(/\s*\(.*\)/, '')] : [String(value).slice(0, 3).toUpperCase() || '—', String(value)];
};

export function useBookingData(id) {
  return useAsync(async () => {
    const [dto, portal, docs] = await Promise.all([
      api.get(`/bookings/${id}`),
      api.get(`/portal/bookings/${id}`).catch(() => ({ advisor: null, quote: null, events: [], support_phone: null })),
      api.get(`/bookings/${id}/documents`).catch(() => []),
    ]);
    return { booking: mapBookingDTO(dto), portal, docs: docs || [] };
  }, [id]);
}

export function MobileBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wide = useWide();
  const { cancelBooking, loadUserBookings } = useBooking();
  const { copied, copy } = useCopy();
  const { data, loading, error, reload } = useBookingData(id);
  const [menu, setMenu] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const shell = (body) => (
    <Shell active="bookings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Booking details" onBack={() => navigate('/bookings')} /></div>}
      <Page>{body}</Page>
    </Shell>
  );

  if (loading && !data) return shell(<div className="pt-stack"><Skeleton h={90} r={16} /><Skeleton h={120} r={16} /><Skeleton h={160} r={16} /></div>);
  if (error || !data) return shell(<ErrorState title="We couldn’t load this booking" onRetry={reload}>This request may have been removed, or the connection dropped. Nothing has changed.</ErrorState>);

  const { booking, portal, docs } = data;
  const svc = serviceOf(booking.type);
  const meta = statusMeta(booking.status);
  const quote = portal.quote;
  const dates = stepDates(portal.events, booking);
  const step = meta.step;
  const cancellable = !['completed', 'cancelled'].includes(booking.status);
  const lead = booking.travelerDetails?.lead;
  const [fromCode, fromCity] = iata(booking.from);
  const [toCode, toCity] = iata(booking.to);

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelBooking(booking.id);
      await loadUserBookings();
      toast.success('Your request has been cancelled');
      navigate('/bookings', { replace: true });
    } finally { setBusy(false); setCancelOpen(false); }
  };

  const waitingOnYou = booking.status === 'awaiting_approval' && quote?.status === 'sent';

  return (
    <Shell active="bookings" topbar={wide}>
      {!wide && (
        <div style={{ padding: '0 16px' }}>
          <AppBar title="Booking details" onBack={() => navigate('/bookings')} right={
            <span style={{ position: 'relative' }}>
              <button type="button" className="pt-icon-btn" aria-label="More options" onClick={() => setMenu(!menu)}><EllipsisVertical size={20} /></button>
              {menu && <div className="pt-popover" style={{ width: 220, top: '100%' }}>
                <div className="pt-menu-list" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}>
                  <button type="button" onClick={() => { setMenu(false); navigate(`/support?booking=${booking.docId}`); }}><MessageSquare size={17} /> Contact support</button>
                  {cancellable && <button type="button" style={{ color: 'var(--pt-red)' }} onClick={() => { setMenu(false); setCancelOpen(true); }}><X size={17} /> Cancel request</button>}
                </div>
              </div>}
            </span>
          } />
        </div>
      )}
      <Page>
        <div className="pt-split" style={{ marginTop: wide ? 18 : 6 }}>
          <div className="pt-stack lg">
            {wide && <div className="pt-row between"><div><h1 className="pt-h1">Booking details</h1></div>{cancellable && <button type="button" className="pt-btn danger sm" onClick={() => setCancelOpen(true)}>Cancel request</button>}</div>}
            <div className="pt-card pad" style={{ background: '#eaf3fb', borderColor: '#d3e4f3' }}>
              <div className="pt-row between top">
                <div><div className="pt-small">Booking ID</div><div className="pt-row" style={{ gap: 8 }}><strong className="pt-serif" style={{ fontSize: 22, color: 'var(--pt-navy)' }}>{booking.id}</strong><button type="button" className="pt-icon-btn" style={{ width: 30, height: 30 }} aria-label="Copy booking ID" onClick={() => copy(booking.id, 'id')}>{copied === 'id' ? <Check size={16} /> : <Copy size={16} />}</button></div></div>
                <div style={{ textAlign: 'right' }}><Badge tone={meta.tone}>{meta.tone === 'amber' && <Clock size={13} />}{meta.label}</Badge>{waitingOnYou && <div className="pt-tiny" style={{ marginTop: 6 }}>Awaiting your acceptance</div>}</div>
              </div>
              {booking.status === 'cancelled' ? <Notice tone="red" icon={CircleX} style={{ marginTop: 14 }}>This request was cancelled. You can start a new one any time.</Notice> : (
                <div className="pt-track" style={{ marginTop: 18 }}>
                  {MILESTONES.map((label, i) => (
                    <div key={label} className={`pt-track-node ${i < step ? 'done' : i === step ? 'now' : ''}`}>
                      <span className="pt-track-dot">{i < step && <Check size={14} strokeWidth={3} />}</span>
                      <span>{label}</span>
                      <small>{i <= step && dates[i] ? fmtDate(dates[i]) : ''}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {waitingOnYou && (
              <div className="pt-card pad" style={{ borderColor: '#e8cd93', background: 'var(--pt-gold-soft)' }}>
                <div className="pt-row between" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <div className="pt-row"><FileText size={22} style={{ color: 'var(--pt-gold-dark)' }} /><div><strong style={{ color: 'var(--pt-navy)' }}>Your quotation is ready</strong><div className="pt-small">Total {fmtMoney(quote.total)} · review and accept, or ask for a change.</div></div></div>
                  <button type="button" className="pt-btn sm" onClick={() => navigate(`/bookings/${id}/quote`)}>Review quotation <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            <Card>
              <div className="pt-row between" style={{ marginBottom: 12 }}><span className="pt-row" style={{ gap: 10 }}><ServiceArt type={booking.type} size={40} radius={12} /><h2 className="pt-h2" style={{ fontSize: 18 }}>{booking.type === 'flight' ? `${fromCity || 'Departure'} → ${toCity || 'Destination'}` : svc.title_of(booking)}</h2></span><Badge tone="blue">{svc.label}</Badge></div>
              {booking.type === 'flight' ? (
                <div className="pt-row between" style={{ padding: '6px 0' }}>
                  <div><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{fromCode}</strong><div className="pt-small">{fromCity}</div></div>
                  <div style={{ flex: 1, display: 'grid', justifyItems: 'center', color: 'var(--pt-navy)' }}><div style={{ width: '100%', height: 2, background: 'repeating-linear-gradient(90deg, #c8d0d8 0 6px, transparent 6px 12px)', position: 'relative' }}><Plane size={18} style={{ position: 'absolute', left: 'calc(50% - 9px)', top: -8, background: '#fff' }} /></div><span className="pt-tiny" style={{ marginTop: 8 }}>{booking.tripType === 'oneway' ? 'One way' : 'Return'}</span></div>
                  <div style={{ textAlign: 'right' }}><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{toCode}</strong><div className="pt-small">{toCity}</div></div>
                </div>
              ) : null}
              <KV rows={svc.summary(booking).filter(([, v]) => v)} />
            </Card>

            <Card>
              <div className="pt-row between" style={{ marginBottom: 6 }}><h2 className="pt-h3">Request summary</h2><span className="pt-small">Created on {fmtDate(booking.createdAt)}</span></div>
              <KV rows={[
                lead && ['Lead traveler', lead.name],
                ['Travellers', serviceOf(booking.type).people_of(booking)],
                booking.class && ['Class preference', humanize(booking.class)],
                booking.flexibleDates && ['Dates', 'Flexible (± 3 days)'],
                ['Special requests', booking.specialRequests || booking.travelNotes || 'None'],
              ].filter(Boolean)} />
            </Card>
          </div>

          <div className="pt-stack lg">
            <Card>
              <div className="pt-row" style={{ gap: 14 }}>
                {portal.advisor ? <Avatar user={{ displayName: portal.advisor.name }} size="lg" /> : <span className="pt-avatar lg" style={{ background: '#eef1f4' }}><Clock size={22} /></span>}
                <div><div className="pt-small">Your travel advisor</div><strong style={{ fontSize: 17, color: 'var(--pt-navy)' }}>{portal.advisor?.name || 'To be assigned'}</strong><div className="pt-small">{portal.advisor?.title || 'We’ll assign an advisor shortly'}</div></div>
              </div>
              <div className="pt-grid2" style={{ marginTop: 14 }}>
                {portal.support_phone ? <a className="pt-btn ghost sm" href={`tel:${portal.support_phone.replace(/\s/g, '')}`}><Phone size={16} /> Call</a> : <button type="button" className="pt-btn ghost sm" disabled title="No support line is configured"><Phone size={16} /> Call</button>}
                <button type="button" className="pt-btn ghost sm" onClick={() => navigate(`/support?booking=${booking.docId}`)}><MessageSquare size={16} /> Chat</button>
              </div>
            </Card>

            <div className="pt-notice gold" style={{ alignItems: 'center' }}>
              <WingsIcon size={26} />
              <div><strong style={{ fontSize: 14 }}>Earn Wings after completion</strong>Wings will be credited to your account after the trip is completed.</div>
              <Info size={18} />
            </div>

            <button type="button" className="pt-btn ghost full" onClick={() => setDocsOpen(true)}><Download size={18} /> Download documents{docs.length ? ` (${docs.length})` : ''}</button>
            {wide ? null : cancellable && <button type="button" className="pt-btn danger full" onClick={() => setCancelOpen(true)}>Cancel request</button>}
          </div>
        </div>
      </Page>

      <Modal open={docsOpen} onClose={() => setDocsOpen(false)} label="Documents">
        <ModalHead title="Documents" sub="Files shared by your travel advisor" onClose={() => setDocsOpen(false)} />
        {docs.length === 0 ? <Notice icon={FileText}>No documents have been shared yet. Tickets, vouchers and invoices will appear here.</Notice> : (
          <div className="pt-stack">
            {docs.map((d) => (
              <a key={d.id} className="pt-item" href={d.file_url || fileUrl(d.file_id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <span className="pt-item-icon"><FileText size={20} /></span>
                <span className="pt-item-body"><span className="pt-item-title">{d.label || humanize(d.kind || 'document')}</span><span className="pt-item-sub" style={{ display: 'block' }}>{humanize(d.kind || 'document')} · {fmtDate(d.created_at)}</span></span>
                <Download size={18} />
              </a>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} label="Cancel request">
        <ModalHead title="Cancel this request?" onClose={() => setCancelOpen(false)} />
        <p className="pt-sub">Your travel advisor will stop working on {booking.id}. Wings are never charged for cancelled requests, and you can always start a new one.</p>
        <div className="pt-grid2" style={{ marginTop: 20 }}>
          <button type="button" className="pt-btn ghost" onClick={() => setCancelOpen(false)}>Keep request</button>
          <button type="button" className="pt-btn danger" disabled={busy} onClick={doCancel}>{busy ? 'Cancelling…' : 'Cancel request'}</button>
        </div>
      </Modal>
    </Shell>
  );
}

/* --------------------------------------------------------- quotation review */

const istTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST`;
};

export function QuoteReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wide = useWide();
  const { data, loading, error, reload } = useBookingData(id);
  const [changeOpen, setChangeOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { loadUserBookings } = useBooking();

  const frame = (content) => (
    <Shell active="bookings" topbar={wide}>
      <div style={{ padding: '0 16px', maxWidth: 760, margin: '0 auto' }}><AppBar title="Quotation review" onBack={() => navigate(`/bookings/${id}`)} /></div>
      <Page>{content}</Page>
    </Shell>
  );

  if (loading && !data) return frame(<div className="pt-stack"><Skeleton h={70} r={16} /><Skeleton h={160} r={16} /><Skeleton h={160} r={16} /></div>);
  if (error || !data) return frame(<ErrorState onRetry={reload} />);
  const { booking, portal } = data;
  const quote = portal.quote;
  if (!quote) return frame(<Notice icon={Clock} title="No quotation yet">Your advisor hasn’t sent a quotation for this request. We’ll notify you as soon as it’s ready.</Notice>);

  const svc = serviceOf(booking.type);
  const expired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const open = quote.status === 'sent' && !expired;
  const lead = booking.travelerDetails?.lead;
  const extras = booking.travelerDetails?.additional || [];
  const people = svc.people_of(booking) || 1;
  const sum = quote.summary || {};
  const [fromCode, fromCity] = iata(booking.from);
  const [toCode, toCity] = iata(booking.to);

  const act = async (fn, okMessage) => {
    setBusy(true);
    try { await fn(); toast.success(okMessage); await Promise.all([reload(), loadUserBookings()]); } catch (err) { toast.error(err.message || 'Something went wrong'); } finally { setBusy(false); }
  };

  return frame(
    <div className="pt-stack lg">
      <div className="pt-row between"><div><div className="pt-tiny">Booking</div><strong style={{ color: 'var(--pt-navy)' }}>{booking.id}</strong></div>
        <Badge tone={quote.status === 'accepted' ? 'green' : quote.status === 'change_requested' ? 'blue' : expired ? 'red' : 'amber'}>{quote.status === 'accepted' ? 'Accepted' : quote.status === 'change_requested' ? 'Change requested' : expired ? 'Expired' : <><Clock size={13} /> Quote ready</>}</Badge></div>

      {quote.status === 'sent' && !expired && <Notice tone="amber" icon={Clock} title="This quotation is awaiting your acceptance">No payment is required at this stage. You can accept this quotation or request a change.</Notice>}
      {expired && quote.status === 'sent' && <Notice tone="red" icon={CircleX} title="This quotation has expired">Please ask your advisor for a refreshed quote.</Notice>}
      {quote.status === 'accepted' && <Notice tone="green" icon={CircleCheck} title="You accepted this quotation">Accepted on {fmtDateTime(quote.responded_at)}. Your advisor will confirm the final booking details.</Notice>}
      {quote.status === 'change_requested' && <Notice icon={MessageSquare} title="Change requested">{quote.change_note} — your advisor will send a revised quotation.</Notice>}

      <Card>
        <div className="pt-row between" style={{ marginBottom: 12 }}><span className="pt-row"><svc.Icon size={19} style={{ color: 'var(--pt-navy)' }} /><h2 className="pt-h3">{booking.type === 'flight' ? 'Flight details' : `${svc.label} details`}</h2></span>{sum.airline && <strong style={{ color: 'var(--pt-blue)', fontSize: 13 }}>{sum.airline}</strong>}</div>
        {booking.type === 'flight' ? (
          <div className="pt-row between" style={{ alignItems: 'flex-start' }}>
            <div><strong style={{ fontSize: 22, color: 'var(--pt-navy)' }}>{fromCode}</strong><div className="pt-small">{fromCity}</div>{sum.departTime && <strong style={{ display: 'block', marginTop: 6, color: 'var(--pt-navy)' }}>{sum.departTime}</strong>}<div className="pt-tiny">{fmtDate(booking.departureDate)}</div></div>
            <div style={{ flex: 1, display: 'grid', justifyItems: 'center', paddingTop: 10 }}><Plane size={20} style={{ color: 'var(--pt-navy)' }} /><span className="pt-tiny" style={{ marginTop: 6, textAlign: 'center' }}>{[sum.duration, sum.stops].filter(Boolean).join('\n') || (booking.tripType === 'oneway' ? 'One way' : 'Return')}</span></div>
            <div style={{ textAlign: 'right' }}><strong style={{ fontSize: 22, color: 'var(--pt-navy)' }}>{toCode}</strong><div className="pt-small">{toCity}</div>{sum.arriveTime && <strong style={{ display: 'block', marginTop: 6, color: 'var(--pt-navy)' }}>{sum.arriveTime}</strong>}<div className="pt-tiny">{fmtDate(booking.departureDate)}</div></div>
          </div>
        ) : <KV rows={svc.summary(booking).filter(([, v]) => v)} />}
        {sum.notes && <p className="pt-sub" style={{ marginTop: 12 }}>{sum.notes}</p>}
      </Card>

      <Card>
        <div className="pt-row between" style={{ marginBottom: 6 }}><h2 className="pt-h3">Traveller details</h2><span className="pt-small">{people} {people === 1 ? 'traveller' : 'travellers'}</span></div>
        <KV rows={[lead && [lead.name || 'Lead traveler', [lead.dob && fmtDate(lead.dob), booking.class && humanize(booking.class)].filter(Boolean).join(' • ') || 'Lead traveler'], ...extras.map((e) => [e.name || 'Traveler', e.dob ? fmtDate(e.dob) : '—'])].filter(Boolean)} />
      </Card>

      <Card>
        <h2 className="pt-h3" style={{ marginBottom: 6 }}>Fare details</h2>
        <KV rows={[[`Base fare (${people} ${people === 1 ? 'traveller' : 'travellers'})`, fmtMoney(quote.base_fare)], ['Taxes and fees', fmtMoney(quote.taxes)]]} />
        <div className="pt-kv" style={{ borderTopColor: 'var(--pt-line-strong)' }}><span style={{ color: 'var(--pt-navy)', fontWeight: 700 }}>Total</span><strong style={{ fontSize: 22, fontFamily: 'Georgia, serif' }}>{fmtMoney(quote.total)}</strong></div>
      </Card>

      <div className="pt-notice" style={{ alignItems: 'center' }}><CalendarClock size={22} /><div><strong>Quote validity</strong>{quote.valid_until ? <>This quotation is valid until <strong style={{ display: 'inline' }}>{istTime(quote.valid_until)}</strong></> : 'Valid until your advisor confirms otherwise.'}</div></div>

      <div className="pt-grid2" style={{ alignItems: 'start' }}>
        <div className="pt-notice green" style={{ display: 'block' }}><div className="pt-row" style={{ gap: 6, marginBottom: 8, fontWeight: 800, fontSize: 13 }}><Check size={15} /> Inclusions</div><ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5, fontSize: 12 }}>{(quote.inclusions || []).map((i) => <li key={i}>✓ {i}</li>)}{!(quote.inclusions || []).length && <li>—</li>}</ul></div>
        <div className="pt-notice red" style={{ display: 'block' }}><div className="pt-row" style={{ gap: 6, marginBottom: 8, fontWeight: 800, fontSize: 13 }}><X size={15} /> Exclusions</div><ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5, fontSize: 12 }}>{(quote.exclusions || []).map((i) => <li key={i}>✕ {i}</li>)}{!(quote.exclusions || []).length && <li>—</li>}</ul></div>
      </div>

      {open && (
        <div className="pt-sticky-cta pt-stack" style={{ gap: 10 }}>
          <button type="button" className="pt-btn full" disabled={busy} onClick={() => act(() => api.post(`/portal/bookings/${id}/quote/accept`), 'Quotation accepted')}>{busy ? 'Please wait…' : <>Accept quotation <ArrowRight size={18} /></>}</button>
          <button type="button" className="pt-btn ghost full" disabled={busy} onClick={() => setChangeOpen(true)}>Request a change</button>
        </div>
      )}

      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} label="Request a change">
        <ModalHead title="Request a change" sub="Tell your advisor what you’d like adjusted — dates, timings, budget or inclusions." onClose={() => setChangeOpen(false)} />
        <div className="pt-stack">
          <Field label="What would you like changed?"><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={1000} placeholder="e.g. Earlier departure, a lower fare, add check-in baggage…" /></Field>
          <button type="button" className="pt-btn full" disabled={busy || note.trim().length < 3} onClick={() => act(async () => { await api.post(`/portal/bookings/${id}/quote/change`, { note: note.trim() }); setChangeOpen(false); setNote(''); }, 'Your advisor has been notified')}>Send request</button>
        </div>
      </Modal>
    </div>,
  );
}

