import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CircleCheck, Download, Eye, FileText, Gift, Plus, Send, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { useCrm } from '../../contexts/CrmContext';
import { api } from '../../services/api';
import { fileUrl } from '../../services/storage';
import { Badge, Card, Empty, Field, Input, Modal, ModalHead, Notice, Segmented, Select, Skeleton, Spinner, TextArea, fmtDate, fmtDateTime, fmtMoney, humanize, relTime, useAsync } from '../ui';
import { STATUS, serviceOf, statusMeta, bookingTitle } from '../booking';
import StaffShell from './StaffShell';

const TABS = [['details', 'Details'], ['quote', 'Quote'], ['notes', 'Notes'], ['activity', 'Activity'], ['documents', 'Documents'], ['financials', 'Financials'], ['followups', 'Follow-ups']];
const EXPENSE_CATEGORIES = ['flight', 'hotel', 'cab', 'visa', 'activity', 'other'];
const DOC_KINDS = ['ticket', 'voucher', 'invoice', 'quotation', 'other'];

const eventLabel = (e) => e.message.replace(/Status updated to (\w+)/, (_, s) => `Status updated to ${statusMeta(s).label}`);

export default function BookingWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { getBookingByDocId, updateBookingStatus, employees, loading, allUsers } = useAdminBooking();
  const [tab, setTab] = useState('details');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const booking = getBookingByDocId(id);
  const events = useAsync(() => api.get(`/portal/staff/bookings/${id}/events`).catch(() => []), [id]);
  const quotes = useAsync(() => api.get(`/portal/staff/bookings/${id}/quotes`).catch(() => []), [id]);

  if (!booking) {
    return (
      <StaffShell active="bookings" title="Booking">
        {loading ? <Skeleton h={300} r={18} /> : <Card><Empty icon={FileText} title="Booking not found" action={<button type="button" className="pt-btn sm" onClick={() => navigate('/admin/bookings')}>Back to bookings</button>}>It may have been removed, or it isn’t assigned to you.</Empty></Card>}
      </StaffShell>
    );
  }

  const svc = serviceOf(booking.type);
  const meta = statusMeta(booking.status);
  const current = status ?? booking.status;
  const customer = allUsers.find((u) => u.uid === booking.userId);
  const reload = () => { events.reload(); quotes.reload(); };

  const saveStatus = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, { status: current });
    setSaving(false);
    setStatus(null);
    reload();
  };
  const complete = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, { status: 'completed' });
    setSaving(false);
    setCompleteOpen(false);
    setStatus(null);
    reload();
  };

  return (
    <StaffShell active="bookings">
      <div className="pt-small pt-row" style={{ marginBottom: 10, gap: 6 }}><button type="button" className="pt-link muted" onClick={() => navigate('/admin/bookings')}>Bookings</button><ChevronRight size={13} /><strong>{booking.id}</strong></div>
      <Card style={{ marginBottom: 18 }}>
        <div className="pt-row between top" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="pt-row" style={{ gap: 12 }}><h1 className="pt-h1" style={{ fontSize: 26 }}>Booking {booking.id}</h1><Badge tone={meta.tone} dot>{meta.label}</Badge></div>
            <div className="pt-small" style={{ marginTop: 8 }}>
              <button type="button" className="pt-link" style={{ color: 'var(--pt-navy)', textDecoration: 'none', fontWeight: 800, fontSize: 15 }} onClick={() => navigate(`/admin/customers/${booking.userId}`)}>{booking.userName || customer?.displayName}</button>
              <span style={{ margin: '0 8px' }}>|</span>{booking.membershipCode}<span style={{ margin: '0 8px' }}>|</span>{booking.membershipTier || 'Silver'} Member
            </div>
          </div>
          <div className="pt-row wrap" style={{ gap: 10 }}>
            <span className="pt-small">Update status</span>
            <Select value={current} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 190 }}>{Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</Select>
            <button type="button" className="pt-btn sm" disabled={saving || current === booking.status} onClick={saveStatus}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <div className="pt-tabs" style={{ marginTop: 16 }}>{TABS.map(([v, l]) => <button type="button" key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}</div>
      </Card>

      {tab === 'details' && <DetailsTab booking={booking} svc={svc} employees={employees} isAdmin={isAdmin} events={events} quotes={quotes} setTab={setTab} onComplete={() => setCompleteOpen(true)} update={updateBookingStatus} />}
      {tab === 'quote' && <QuoteTab booking={booking} quotes={quotes} onSent={reload} />}
      {tab === 'notes' && <NotesTab bookingId={id} />}
      {tab === 'activity' && <ActivityTab bookingId={id} events={events} />}
      {tab === 'documents' && <DocumentsTab bookingId={id} />}
      {tab === 'financials' && <FinancialsTab booking={booking} update={updateBookingStatus} />}
      {tab === 'followups' && <FollowupsTab booking={booking} />}

      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} label="Mark as completed">
        <ModalHead title="Mark booking as completed?" onClose={() => setCompleteOpen(false)} />
        <p className="pt-sub">This closes {booking.id} and awards Wings to {booking.userName} per the program rules (plus any first-booking and referral bonuses). It can’t be undone from the portal, so please confirm the trip is complete.</p>
        <div className="pt-grid2" style={{ marginTop: 20 }}><button type="button" className="pt-btn ghost" onClick={() => setCompleteOpen(false)}>Not yet</button><button type="button" className="pt-btn gold" disabled={saving} onClick={complete}>{saving ? 'Completing…' : 'Mark completed'}</button></div>
      </Modal>
    </StaffShell>
  );
}

/* ------------------------------------------------------------------ details */

function DetailsTab({ booking, svc, employees, isAdmin, events, quotes, setTab, onComplete, update }) {
  const [cost, setCost] = useState(booking.finalCost || '');
  const [owner, setOwner] = useState(booking.assignedEmployeeId || '');
  const [payment, setPayment] = useState(booking.paymentStatus || 'pending');
  const [saving, setSaving] = useState(false);
  const quote = (quotes.data || [])[0];
  const lead = booking.travelerDetails?.lead;
  const done = ['completed', 'cancelled'].includes(booking.status);
  const dirty = Number(cost || 0) !== Number(booking.finalCost || 0) || (owner || '') !== (booking.assignedEmployeeId || '') || payment !== (booking.paymentStatus || 'pending');
  const save = async () => {
    setSaving(true);
    await update(booking.id, { finalCost: Number(cost || 0), assignedEmployeeId: isAdmin ? (owner || null) : undefined, paymentStatus: payment });
    setSaving(false);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 6 }}>Booking details</h2>
        {[['Booking ID', booking.id], ['Service', svc.label], ...svc.summary(booking).filter(([, v]) => v), lead && ['Lead traveler', `${lead.name}${lead.phone ? ` · +91 ${lead.phone}` : ''}`], ['Special requests', booking.specialRequests || booking.travelNotes || 'None'], ['Created on', fmtDateTime(booking.createdAt)]].filter(Boolean).map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{String(v)}</strong></div>)}
        <hr className="pt-divider" />
        <div className="pt-stack">
          {isAdmin ? <Field label="Assigned to"><Select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Unassigned</option>{employees.map((e) => <option key={e.uid} value={e.uid}>{e.displayName}</option>)}</Select></Field> : <div className="pt-kv"><span>Assigned to</span><strong>You</strong></div>}
          <Field label="Payment status"><Select value={payment} onChange={(e) => setPayment(e.target.value)}>{['pending', 'partial', 'paid', 'refunded'].map((p) => <option key={p} value={p}>{humanize(p)}</option>)}</Select></Field>
          <Field label="Total package amount (INR)" hint="Becomes the booking revenue in financials."><Input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="18500" /></Field>
          <button type="button" className="pt-btn sm" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </Card>

      <Card>
        <div className="pt-row between" style={{ marginBottom: 10 }}><h2 className="pt-h2">Quotation</h2>{quote && <Badge tone={quote.status === 'accepted' ? 'green' : quote.status === 'change_requested' ? 'blue' : quote.status === 'superseded' ? '' : 'amber'}>{humanize(quote.status)}</Badge>}</div>
        {quotes.loading && !quotes.data ? <Skeleton h={120} /> : quote ? (
          <>
            <div className="pt-small">Total package</div>
            <div className="pt-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--pt-navy)' }}>{fmtMoney(quote.total)}</div>
            <p className="pt-small">Sent {relTime(quote.created_at)}{quote.valid_until ? ` · valid until ${fmtDate(quote.valid_until)}` : ''}</p>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6, fontSize: 13 }}>{(quote.inclusions || []).map((i) => <li key={i} className="pt-row" style={{ gap: 8 }}><CircleCheck size={15} style={{ color: 'var(--pt-green)' }} />{i}</li>)}</ul>
            {quote.change_note && <Notice icon={FileText} style={{ marginTop: 14 }} title="Customer requested a change">{quote.change_note}</Notice>}
          </>
        ) : <p className="pt-sub">No quotation has been sent yet.</p>}
        <div className="pt-grid2" style={{ marginTop: 16 }}><button type="button" className="pt-btn sm" onClick={() => setTab('quote')}><Send size={15} /> {quote ? 'Revise quote' : 'Create quote'}</button><button type="button" className="pt-btn ghost sm" onClick={() => setTab('quote')}><Eye size={15} /> History</button></div>
      </Card>

      <div className="pt-stack lg">
        <Card>
          <h2 className="pt-h2" style={{ marginBottom: 14 }}>Booking timeline</h2>
          {events.loading && !events.data ? <Skeleton h={160} /> : (
            <div className="pt-vtl">{(events.data || []).map((e) => <div key={e.id} className="pt-vtl-row done"><span className="pt-vtl-dot"><CircleCheck size={12} /></span><div className="pt-vtl-body"><strong>{eventLabel(e)}</strong><span>{fmtDateTime(e.created_at)}{e.actor_name ? ` · ${e.actor_name}` : ''}</span></div></div>)}</div>
          )}
        </Card>
        <div className="pt-notice gold" style={{ alignItems: 'center' }}>
          <Gift size={26} />
          <div style={{ flex: 1 }}><strong style={{ fontSize: 14 }}>Mark as completed</strong>This will close the booking and award Wings to the customer once the trip is completed as per policy.</div>
          <button type="button" className="pt-btn xs" style={{ background: '#fff', color: 'var(--pt-navy)', borderColor: 'var(--pt-line-strong)', boxShadow: 'none' }} disabled={done} onClick={onComplete}>{booking.status === 'completed' ? 'Completed' : 'Mark completed'}</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- quote */

const INCLUDE_SUGGEST = ['Return flight tickets', 'Standard baggage', 'All taxes and fees', 'Daily breakfast', 'Airport transfers', '24x7 travel support'];
const EXCLUDE_SUGGEST = ['Meals (available for purchase)', 'Travel insurance', 'Extra baggage charges', 'Seat upgrades'];

function ListEditor({ label, items, setItems, suggestions }) {
  const [text, setText] = useState('');
  const add = (value) => { const v = value.trim(); if (v && !items.includes(v)) setItems([...items, v]); setText(''); };
  return (
    <Field label={label}>
      <div className="pt-stack" style={{ gap: 8 }}>
        {items.map((i) => <div key={i} className="pt-row between pt-item static" style={{ padding: '8px 12px' }}><span style={{ fontSize: 13 }}>{i}</span><button type="button" className="pt-icon-btn" style={{ width: 28, height: 28 }} aria-label={`Remove ${i}`} onClick={() => setItems(items.filter((x) => x !== i))}><X size={15} /></button></div>)}
        <div className="pt-row"><Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }} placeholder="Add a line and press Enter" /><button type="button" className="pt-btn sm" onClick={() => add(text)}><Plus size={15} /></button></div>
        <div className="pt-chips">{suggestions.filter((s) => !items.includes(s)).map((s) => <button type="button" key={s} className="pt-chip" style={{ minHeight: 30, fontSize: 11 }} onClick={() => add(s)}>+ {s}</button>)}</div>
      </div>
    </Field>
  );
}

function QuoteTab({ booking, quotes, onSent }) {
  const latest = (quotes.data || [])[0];
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (form || quotes.loading) return;
    const sum = latest?.summary || {};
    const code = (v = '') => (String(v).match(/\(([A-Z]{3})\)/) || [])[1] || '';
    const city = (v = '') => String(v).replace(/\s*\(.*\)/, '');
    const blankLeg = (label, date, from, to) => ({ label, date: date || '', airline: '', flight: '', from_code: code(from), from_city: city(from), from_terminal: '', depart: '', to_code: code(to), to_city: city(to), to_terminal: '', arrive: '', duration: '', stops: 'Non-stop' });
    const legs = sum.legs?.length ? sum.legs : [blankLeg('OUTBOUND', booking.departureDate, booking.from, booking.to), ...(booking.tripType === 'oneway' ? [] : [blankLeg('RETURN', booking.returnDate, booking.to, booking.from)])];
    setForm({
      base_fare: latest?.base_fare ?? (booking.finalCost || ''), taxes: latest?.taxes ?? '', valid_until: latest?.valid_until ? latest.valid_until.slice(0, 10) : '',
      inclusions: latest?.inclusions || [], exclusions: latest?.exclusions || [], private_note: latest?.private_note || '',
      legs, baggage: sum.baggage || '', fare_type: sum.fare_type || '', fare_inclusions: sum.fare_inclusions || '', changes: sum.changes || '', notes: sum.notes || '',
    });
  }, [latest, quotes.loading, form, booking]);
  if (!form) return <Spinner label="Loading quotation…" />;
  const set = (k, v) => setForm({ ...form, [k]: v });
  const total = (Number(form.base_fare) || 0) + (Number(form.taxes) || 0);
  const isFlight = booking.type === 'flight';

  const send = async () => {
    if (!(Number(form.base_fare) > 0)) { toast.error('Enter the base fare'); return; }
    setBusy(true);
    try {
      await api.post(`/portal/staff/bookings/${booking.docId}/quotes`, {
        base_fare: Number(form.base_fare), taxes: Number(form.taxes) || 0,
        valid_until: form.valid_until ? `${form.valid_until}T23:59:00+05:30` : null,
        inclusions: form.inclusions, exclusions: form.exclusions, private_note: form.private_note || null,
        summary: { legs: isFlight ? form.legs : undefined, baggage: form.baggage, fare_type: form.fare_type, fare_inclusions: form.fare_inclusions, changes: form.changes, notes: form.notes },
      });
      toast.success('Quotation sent to the customer');
      onSent();
    } catch (error) { toast.error(error.message || 'Could not send the quotation'); } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 14 }}>Quotation</h2>
        <div className="pt-stack lg">
          <div className="pt-grid3"><Field label="Base fare (INR)"><Input type="number" min="0" value={form.base_fare} onChange={(e) => set('base_fare', e.target.value)} /></Field><Field label="Taxes & fees"><Input type="number" min="0" value={form.taxes} onChange={(e) => set('taxes', e.target.value)} /></Field><Field label="Total"><Input value={fmtMoney(total)} disabled /></Field></div>
          <Field label="Valid until" hint="Customers can accept until 11:59 PM IST on this date."><Input type="date" value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} /></Field>
          {isFlight && form.legs.map((leg, i) => {
            const setLeg = (patch) => set('legs', form.legs.map((l, j) => (j === i ? { ...l, ...patch } : l)));
            return (
              <div key={leg.label} className="pt-card flat pad" style={{ background: '#faf8f3' }}>
                <div className="pt-row between" style={{ marginBottom: 10 }}><strong style={{ color: 'var(--pt-navy)', letterSpacing: '0.08em', fontSize: 12 }}>{leg.label} FLIGHT</strong><Input type="date" value={leg.date} onChange={(e) => setLeg({ date: e.target.value })} style={{ maxWidth: 170, minHeight: 38 }} /></div>
                <div className="pt-grid2"><Field label="Airline"><Input value={leg.airline} onChange={(e) => setLeg({ airline: e.target.value })} placeholder="IndiGo" /></Field><Field label="Flight number" optional><Input value={leg.flight} onChange={(e) => setLeg({ flight: e.target.value })} placeholder="6E 1234" /></Field></div>
                <div className="pt-grid3" style={{ marginTop: 10 }}><Field label="From (code)"><Input value={leg.from_code} maxLength={3} onChange={(e) => setLeg({ from_code: e.target.value.toUpperCase() })} placeholder="JAI" /></Field><Field label="Departs"><Input value={leg.depart} onChange={(e) => setLeg({ depart: e.target.value })} placeholder="12:20" /></Field><Field label="Terminal" optional><Input value={leg.from_terminal} onChange={(e) => setLeg({ from_terminal: e.target.value })} placeholder="Terminal 2" /></Field></div>
                <div className="pt-grid3" style={{ marginTop: 10 }}><Field label="To (code)"><Input value={leg.to_code} maxLength={3} onChange={(e) => setLeg({ to_code: e.target.value.toUpperCase() })} placeholder="SIN" /></Field><Field label="Arrives"><Input value={leg.arrive} onChange={(e) => setLeg({ arrive: e.target.value })} placeholder="21:40" /></Field><Field label="Terminal" optional><Input value={leg.to_terminal} onChange={(e) => setLeg({ to_terminal: e.target.value })} placeholder="Changi T1" /></Field></div>
                <div className="pt-grid2" style={{ marginTop: 10 }}><Field label="Duration"><Input value={leg.duration} onChange={(e) => setLeg({ duration: e.target.value })} placeholder="6h 50m" /></Field><Field label="Stops"><Input value={leg.stops} onChange={(e) => setLeg({ stops: e.target.value })} placeholder="Non-stop" /></Field></div>
              </div>
            );
          })}
          <div className="pt-grid2"><Field label="Baggage" optional><Input value={form.baggage} onChange={(e) => set('baggage', e.target.value)} placeholder="23 kg check-in + 7 kg cabin (per traveller)" /></Field><Field label="Fare type" optional><Input value={form.fare_type} onChange={(e) => set('fare_type', e.target.value)} placeholder="Economy (with flexibility)" /></Field></div>
          <div className="pt-grid2"><Field label="Included with the fare" optional><Input value={form.fare_inclusions} onChange={(e) => set('fare_inclusions', e.target.value)} placeholder="Standard seat, meals, complimentary snacks" /></Field><Field label="Changes policy" optional><Input value={form.changes} onChange={(e) => set('changes', e.target.value)} placeholder="Date changes allowed (fare difference may apply)" /></Field></div>
          <Field label="Notes shown to the customer" optional><TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} max={400} placeholder="e.g. Room: Deluxe sea view, 1 king bed." /></Field>
          <ListEditor label="Inclusions" items={form.inclusions} setItems={(v) => set('inclusions', v)} suggestions={INCLUDE_SUGGEST} />
          <ListEditor label="Exclusions" items={form.exclusions} setItems={(v) => set('exclusions', v)} suggestions={EXCLUDE_SUGGEST} />
          <Field label="Private note (not shown to customer)" optional><TextArea value={form.private_note} onChange={(e) => set('private_note', e.target.value)} max={500} placeholder="Shared best fares for preferred dates. Awaiting confirmation." /></Field>
          <div className="pt-grid2"><button type="button" className="pt-btn" disabled={busy} onClick={send}><Send size={16} /> {busy ? 'Sending…' : 'Send quote to customer'}</button><button type="button" className="pt-btn ghost" onClick={() => setPreview(true)}>Preview</button></div>
        </div>
      </Card>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 12 }}>Quote history</h2>
        {!(quotes.data || []).length ? <p className="pt-sub">No quotations yet.</p> : (quotes.data || []).map((q) => (
          <div key={q.id} className="pt-kv" style={{ alignItems: 'flex-start' }}>
            <span><strong style={{ color: 'var(--pt-navy)' }}>{fmtMoney(q.total)}</strong><br />{fmtDateTime(q.created_at)}</span>
            <span style={{ textAlign: 'right' }}><Badge tone={q.status === 'accepted' ? 'green' : q.status === 'change_requested' ? 'blue' : q.status === 'superseded' ? '' : 'amber'}>{humanize(q.status)}</Badge>{q.change_note && <div className="pt-small" style={{ marginTop: 6, maxWidth: 220 }}>“{q.change_note}”</div>}</span>
          </div>
        ))}
      </Card>
      <Modal open={preview} onClose={() => setPreview(false)} label="Quote preview">
        <ModalHead title="Customer preview" sub={`${booking.id} · ${bookingTitle(booking)}`} onClose={() => setPreview(false)} />
        <div className="pt-stack">
          <div className="pt-kv"><span>Base fare</span><strong>{fmtMoney(form.base_fare)}</strong></div><div className="pt-kv"><span>Taxes and fees</span><strong>{fmtMoney(form.taxes)}</strong></div><div className="pt-kv"><span style={{ fontWeight: 700, color: 'var(--pt-navy)' }}>Total</span><strong style={{ fontSize: 20 }}>{fmtMoney(total)}</strong></div>
          <p className="pt-small">Valid until {form.valid_until ? fmtDate(form.valid_until) : 'further notice'}</p>
          <div className="pt-grid2"><div className="pt-notice green" style={{ display: 'block' }}><strong>Inclusions</strong>{form.inclusions.map((i) => <div key={i}>✓ {i}</div>)}</div><div className="pt-notice red" style={{ display: 'block' }}><strong>Exclusions</strong>{form.exclusions.map((i) => <div key={i}>✕ {i}</div>)}</div></div>
        </div>
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------- notes */

function NotesTab({ bookingId }) {
  const { listNotes, addNote } = useCrm();
  const notes = useAsync(() => listNotes(bookingId), [bookingId]);
  const [text, setText] = useState('');
  const [type, setType] = useState('communication');
  const [busy, setBusy] = useState(false);
  const submit = async () => { if (!text.trim()) return; setBusy(true); const n = await addNote(bookingId, text.trim(), type); setBusy(false); if (n) { setText(''); notes.reload(); } };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card><h2 className="pt-h2" style={{ marginBottom: 12 }}>Add a note</h2><div className="pt-stack"><Segmented options={[['communication', 'Communication'], ['support', 'Support']]} value={type} onChange={setType} /><TextArea value={text} onChange={(e) => setText(e.target.value)} max={1000} placeholder="Spoke to the customer. Awaiting their reply…" /><button type="button" className="pt-btn sm" disabled={busy || !text.trim()} onClick={submit}>{busy ? 'Saving…' : 'Save note'}</button></div><Notice icon={FileText} style={{ marginTop: 14 }}>Notes are internal and never shown to the customer.</Notice></Card>
      <Card><h2 className="pt-h2" style={{ marginBottom: 6 }}>Notes</h2>{notes.loading && !notes.data ? <Skeleton h={80} /> : !(notes.data || []).length ? <p className="pt-sub">No notes yet.</p> : (notes.data || []).map((n) => <div key={n.id} style={{ padding: '12px 0', borderTop: '1px solid var(--pt-line)' }}><div className="pt-row between"><Badge tone={n.noteType === 'support' ? 'blue' : 'amber'}>{humanize(n.noteType)}</Badge><span className="pt-tiny">{fmtDateTime(n.createdAt)}</span></div><p style={{ marginTop: 8, fontSize: 13, whiteSpace: 'pre-wrap' }}>{n.note}</p></div>)}</Card>
    </div>
  );
}

function ActivityTab({ bookingId, events }) {
  const { listNotes } = useCrm();
  const notes = useAsync(() => listNotes(bookingId), [bookingId]);
  const rows = useMemo(() => [
    ...(events.data || []).map((e) => ({ id: e.id, at: new Date(e.created_at), text: eventLabel(e), by: e.actor_name, kind: e.kind })),
    ...(notes.data || []).map((n) => ({ id: n.id, at: n.createdAt, text: `Note: ${n.note}`, kind: 'note' })),
  ].sort((a, b) => b.at - a.at), [events.data, notes.data]);
  return <Card><h2 className="pt-h2" style={{ marginBottom: 14 }}>Activity</h2>{!rows.length ? <p className="pt-sub">No activity yet.</p> : <div className="pt-vtl">{rows.map((r) => <div key={r.id} className={`pt-vtl-row ${r.kind === 'note' ? '' : 'done'}`}><span className="pt-vtl-dot">{r.kind !== 'note' && <CircleCheck size={12} />}</span><div className="pt-vtl-body"><strong style={{ fontWeight: 600 }}>{r.text}</strong><span>{fmtDateTime(r.at)}{r.by ? ` · ${r.by}` : ''}</span></div></div>)}</div>}</Card>;
}

/* ---------------------------------------------------------------- documents */

function DocumentsTab({ bookingId }) {
  const { listDocuments, addDocument, deleteDocument } = useCrm();
  const docs = useAsync(() => listDocuments(bookingId), [bookingId]);
  const [kind, setKind] = useState('ticket');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { file_id: fileId } = await api.upload('/uploads/booking-document', fd);
      if (await addDocument({ bookingId, kind, fileId, label: file.name })) docs.reload();
    } catch (err) { toast.error(err.message || 'Upload failed'); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <Card>
      <div className="pt-row between wrap" style={{ marginBottom: 14 }}><h2 className="pt-h2">Documents</h2><div className="pt-row"><Select value={kind} onChange={(e) => setKind(e.target.value)} style={{ minWidth: 140 }}>{DOC_KINDS.map((k) => <option key={k} value={k}>{humanize(k)}</option>)}</Select><input ref={ref} type="file" hidden onChange={pick} /><button type="button" className="pt-btn sm" disabled={busy} onClick={() => ref.current?.click()}><Upload size={15} /> {busy ? 'Uploading…' : 'Upload'}</button></div></div>
      {docs.loading && !docs.data ? <Skeleton h={80} /> : !(docs.data || []).length ? <Empty icon={FileText} title="No documents yet">Tickets, vouchers and invoices you attach appear in the customer’s booking.</Empty> : (docs.data || []).map((d) => <div key={d.id} className="pt-row between" style={{ padding: '12px 0', borderTop: '1px solid var(--pt-line)' }}><span className="pt-row"><FileText size={18} /><span><strong style={{ fontSize: 13 }}>{d.label || humanize(d.kind)}</strong><br /><span className="pt-tiny">{humanize(d.kind)} · {fmtDate(d.createdAt)}</span></span></span><span className="pt-row"><a className="pt-icon-btn" href={fileUrl(d.fileId)} target="_blank" rel="noreferrer" aria-label="Open document"><Download size={17} /></a><button type="button" className="pt-icon-btn" aria-label="Delete document" onClick={async () => { if (window.confirm('Remove this document?') && await deleteDocument(d.id)) docs.reload(); }}><Trash2 size={17} /></button></span></div>)}
    </Card>
  );
}

/* --------------------------------------------------------------- financials */

const emptyExpense = { category: 'hotel', amount: '', vendor: '', description: '', startDate: '', endDate: '' };

function FinancialsTab({ booking }) {
  const { listExpenses, addExpense, deleteExpense } = useCrm();
  const expenses = useAsync(() => listExpenses(booking.docId), [booking.docId]);
  const [form, setForm] = useState(emptyExpense);
  const [busy, setBusy] = useState(false);
  const list = expenses.data || [];
  const cost = list.reduce((a, e) => a + Number(e.amount || 0), 0);
  const revenue = Number(booking.finalCost || 0);
  const profit = revenue - cost;
  const submit = async (e) => { e.preventDefault(); if (!form.amount) return; setBusy(true); const r = await addExpense({ bookingId: booking.docId, ...form }); setBusy(false); if (r) { setForm(emptyExpense); expenses.reload(); } };
  return (
    <div className="pt-stack lg">
      <div className="pt-grid4">{[['Revenue', fmtMoney(revenue), 'Package amount'], ['Costs', fmtMoney(cost), `${list.length} line${list.length === 1 ? '' : 's'}`], ['Profit', fmtMoney(profit), revenue ? `${Math.round((profit / revenue) * 100)}% margin` : 'Set a package amount'], ['Payment', humanize(booking.paymentStatus || 'pending'), '']].map(([k, v, s]) => <Card key={k} className="st-stat"><span className="pt-small">{k}</span><div className="num" style={{ color: k === 'Profit' && profit < 0 ? 'var(--pt-red)' : undefined, fontSize: 24 }}>{v}</div><span className="pt-tiny">{s}</span></Card>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18, alignItems: 'start' }}>
        <Card><h2 className="pt-h2" style={{ marginBottom: 12 }}>Add cost line</h2>
          <form onSubmit={submit} className="pt-stack">
            <div className="pt-grid2"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</Select><Input type="number" min="0" placeholder="Amount (₹) *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <Input placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            <Input placeholder="Description (e.g. 2 nights, DXB→DEL leg)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="pt-grid2"><Field label="From"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field><Field label="To"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field></div>
            <button type="submit" className="pt-btn sm" disabled={busy || !form.amount}>{busy ? 'Adding…' : 'Add cost line'}</button>
          </form>
        </Card>
        <Card><h2 className="pt-h2" style={{ marginBottom: 6 }}>Costs</h2>{expenses.loading && !expenses.data ? <Skeleton h={80} /> : !list.length ? <p className="pt-sub">No costs recorded.</p> : list.map((e) => <div key={e.id} className="pt-row between" style={{ padding: '11px 0', borderTop: '1px solid var(--pt-line)' }}><span><Badge>{humanize(e.category)}</Badge> <strong style={{ fontSize: 13, marginLeft: 6 }}>{e.vendor || e.description || 'Cost'}</strong><br /><span className="pt-tiny">{[e.description, e.startDate && fmtDate(e.startDate)].filter(Boolean).join(' · ')}</span></span><span className="pt-row"><strong>{fmtMoney(e.amount)}</strong><button type="button" className="pt-icon-btn" aria-label="Delete cost line" onClick={async () => { if (await deleteExpense(e.id)) expenses.reload(); }}><Trash2 size={16} /></button></span></div>)}</Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- follow-ups */

function FollowupsTab({ booking }) {
  const { isAdmin } = useAuth();
  const tasks = useAsync(async () => (await api.get(`/portal/staff/tasks${isAdmin ? '?scope=all' : ''}`)).filter((t) => t.booking_id === booking.docId), [booking.docId, isAdmin]);
  const [form, setForm] = useState({ title: '', due: '', priority: 'medium' });
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/portal/staff/tasks', { title: form.title, priority: form.priority, due_at: form.due ? new Date(form.due).toISOString() : null, booking_id: booking.docId }); setForm({ title: '', due: '', priority: 'medium' }); tasks.reload(); toast.success('Follow-up added'); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const setStatus = async (t, status) => { try { await api.patch(`/portal/staff/tasks/${t.id}`, { status }); tasks.reload(); } catch (err) { toast.error(err.message); } };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card><h2 className="pt-h2" style={{ marginBottom: 12 }}>Schedule a follow-up</h2><form onSubmit={add} className="pt-stack"><Input required placeholder="e.g. Call customer about quotation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><div className="pt-grid2"><Input type="datetime-local" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></Select></div><button type="submit" className="pt-btn sm" disabled={busy || !form.title.trim()}>{busy ? 'Adding…' : 'Add follow-up'}</button></form></Card>
      <Card><h2 className="pt-h2" style={{ marginBottom: 6 }}>Follow-ups</h2>{tasks.loading && !tasks.data ? <Skeleton h={80} /> : !(tasks.data || []).length ? <p className="pt-sub">No follow-ups for this booking.</p> : (tasks.data || []).map((t) => <div key={t.id} className="pt-row between" style={{ padding: '12px 0', borderTop: '1px solid var(--pt-line)', opacity: ['done', 'cancelled'].includes(t.status) ? 0.55 : 1 }}><span><Badge tone={t.priority === 'high' ? 'red' : t.priority === 'low' ? '' : 'amber'}>{humanize(t.priority)}</Badge> <strong style={{ fontSize: 13, marginLeft: 6 }}>{t.title}</strong><br /><span className="pt-tiny">{t.due_at ? fmtDateTime(t.due_at) : 'No due date'} · {humanize(t.status)}</span></span>{!['done', 'cancelled'].includes(t.status) && <button type="button" className="pt-btn ghost xs" onClick={() => setStatus(t, 'done')}>Done</button>}</div>)}</Card>
    </div>
  );
}
