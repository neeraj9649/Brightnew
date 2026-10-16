import React, { useState } from 'react';
import { Check, ListChecks, MessageCircle, Plus, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Avatar, Badge, Card, Empty, ErrorState, Field, Input, Notice, Skeleton, TextArea, WingsIcon, fmtDateTime, fmtNum, useAsync } from '../ui';

/* ------------------------------------------------------------ customer messages */

export function MessagesTab({ bookingId }) {
  const { data, loading, error, reload } = useAsync(() => api.get(`/portal/staff/bookings/${bookingId}/messages`), [bookingId]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try { await api.post(`/portal/staff/bookings/${bookingId}/messages`, { body: draft.trim() }); setDraft(''); reload(); } catch (e) { toast.error(e.message || 'Message not sent'); } finally { setBusy(false); }
  };
  return (
    <Card>
      <h2 className="pt-h2" style={{ marginBottom: 4 }}>Customer messages</h2>
      <p className="pt-sub" style={{ marginBottom: 14 }}>Messages the customer writes about this booking arrive here. Your reply is shown on their booking page.</p>
      {loading && !data ? <Skeleton h={90} /> : error ? <ErrorState onRetry={reload} /> : !(data || []).length ? (
        <Empty icon={MessageCircle} title="No messages yet">When the customer writes about this booking you will see it here.</Empty>
      ) : (
        <div className="pt-stack">
          {data.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 12, flexDirection: m.sender_role === 'staff' ? 'row-reverse' : 'row' }}>
              <Avatar user={{ displayName: m.sender_name }} size="sm" />
              <div style={{ maxWidth: '78%', background: m.sender_role === 'staff' ? '#eaf3fb' : '#f6f2e9', borderRadius: 14, padding: '10px 14px' }}>
                <div className="pt-tiny" style={{ marginBottom: 4 }}><b>{m.sender_role === 'staff' ? m.sender_name : `${m.sender_name} (customer)`}</b> · {fmtDateTime(m.created_at)}</div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}>{m.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pt-stack" style={{ marginTop: 16 }}>
        <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} max={2000} placeholder="Write a reply to the customer…" />
        <button type="button" className="pt-btn sm" style={{ justifySelf: 'start' }} disabled={busy || !draft.trim()} onClick={send}><Send size={15} /> {busy ? 'Sending…' : 'Send reply'}</button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------- steps */

export function StepsTab({ bookingId }) {
  const { data, loading, error, reload } = useAsync(() => api.get(`/portal/staff/bookings/${bookingId}/steps`), [bookingId]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/portal/staff/bookings/${bookingId}/steps`;
  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) toast.success(okMsg); reload(); } catch (e) { toast.error(e.message || 'That did not work'); } finally { setBusy(false); }
  };
  const steps = data || [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 4 }}>Steps for the customer</h2>
        <p className="pt-sub" style={{ marginBottom: 14 }}>The customer reads these on their booking page. Tick a step when it is done — it also appears in the booking's activity.</p>
        {loading && !data ? <Skeleton h={100} /> : error ? <ErrorState onRetry={reload} /> : steps.length === 0 ? (
          <Empty icon={ListChecks} title="No steps yet" action={<button type="button" className="pt-btn sm" disabled={busy} onClick={() => run(() => api.post(`${base}/defaults`, {}), 'Standard steps added')}>Add the standard steps</button>}>Add the standard steps for this service or write your own.</Empty>
        ) : (
          <div className="pt-stack">
            {steps.map((s, i) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 12, alignItems: 'start', padding: '10px 0', borderTop: i ? '1px solid var(--pt-line)' : 0 }}>
                <button type="button" aria-label={s.status === 'done' ? 'Mark as not done' : 'Mark as done'} disabled={busy} onClick={() => run(() => api.patch(`${base}/${s.id}`, { status: s.status === 'done' ? 'pending' : 'done' }))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--pt-line-strong)', background: s.status === 'done' ? '#1f8a5d' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>{s.status === 'done' && <Check size={16} strokeWidth={3} />}</button>
                <div><strong style={{ textDecoration: s.status === 'done' ? 'line-through' : 'none', color: s.status === 'done' ? 'var(--pt-muted)' : 'var(--pt-navy)' }}>{i + 1}. {s.title}</strong>{s.details && <div className="pt-sub" style={{ marginTop: 3, fontSize: 13 }}>{s.details}</div>}{s.completed_at && <div className="pt-tiny" style={{ marginTop: 3 }}>Done {fmtDateTime(s.completed_at)}</div>}</div>
                <button type="button" className="pt-icon-btn" aria-label="Delete step" disabled={busy} onClick={() => run(() => api.delete(`${base}/${s.id}`), 'Step removed')}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 12 }}>Add a step</h2>
        <div className="pt-stack">
          <Field label="Step"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send passport copy" maxLength={160} /></Field>
          <Field label="What the customer should know" optional><TextArea value={details} onChange={(e) => setDetails(e.target.value)} max={1000} placeholder="Short instructions, deadline or where to find it" /></Field>
          <button type="button" className="pt-btn sm" style={{ justifySelf: 'start' }} disabled={busy || title.trim().length < 2}
            onClick={() => run(async () => { await api.post(base, { title: title.trim(), details: details.trim() || undefined }); setTitle(''); setDetails(''); }, 'Step added')}><Plus size={15} /> Add step</button>
          {steps.length > 0 && <button type="button" className="pt-link" style={{ justifySelf: 'start' }} disabled={busy} onClick={() => run(() => api.post(`${base}/defaults`, {}), 'Standard steps added')}>Add the standard steps (only when there are none)</button>}
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------- wings */

const REQUEST_TONE = { pending: 'amber', approved: 'green', rejected: 'red' };

export function WingsTab({ bookingId, status, isAdmin }) {
  const info = useAsync(() => api.get(`/portal/staff/bookings/${bookingId}/wings`), [bookingId]);
  const reqs = useAsync(() => api.get(`/portal/staff/wings-requests?booking_id=${bookingId}`), [bookingId]);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const eligible = status === 'booking_confirmed' || status === 'completed';
  const n = Number(points);
  const valid = Number.isInteger(n) && n > 0 && n <= 100000 && reason.trim().length >= 3;
  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post('/portal/staff/wings-requests', { booking_id: bookingId, points: n, reason: reason.trim() });
      toast.success(r.status === 'approved' ? 'Wings added to the customer' : 'Sent to an admin for approval');
      setPoints(''); setReason(''); reqs.reload(); info.reload();
    } catch (e) { toast.error(e.message || 'Request failed'); } finally { setBusy(false); }
  };
  const rows = reqs.data || [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18, alignItems: 'start' }}>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 4 }}>Wings for this booking</h2>
        <div className="pt-kv"><span>Automatic Wings (program list)</span><strong>{info.data?.standard_points != null ? `${fmtNum(info.data.standard_points)} Wings` : '—'}</strong></div>
        <div className="pt-kv"><span>Credited automatically so far</span><strong>{fmtNum(info.data?.awarded_automatically || 0)} Wings</strong></div>
        <Notice icon={WingsIcon} style={{ marginTop: 12 }}>The standard Wings (plus any first-booking and referral bonus) are credited automatically when the booking is marked completed. Use the form for any extra Wings{isAdmin ? ' — as an admin yours is applied straight away' : ' — an admin has to approve it before it reaches the customer'}.</Notice>
        <h3 className="pt-h3" style={{ margin: '18px 0 10px' }}>Add extra Wings</h3>
        {!eligible && <Notice tone="amber" style={{ marginBottom: 12 }}>Extra Wings can be added once the booking is confirmed or completed.</Notice>}
        <div className="pt-stack">
          <Field label="Wings"><Input type="number" min="1" max="100000" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="e.g. 250" disabled={!eligible} /></Field>
          <Field label="Reason" hint="Shown to the admin and in the customer's Wings history."><TextArea value={reason} onChange={(e) => setReason(e.target.value)} max={300} placeholder="e.g. Group booking bonus" disabled={!eligible} /></Field>
          <button type="button" className="pt-btn sm" style={{ justifySelf: 'start' }} disabled={!eligible || !valid || busy} onClick={submit}>{busy ? 'Sending…' : isAdmin ? 'Add Wings' : 'Send for approval'}</button>
        </div>
      </Card>
      <Card>
        <h2 className="pt-h2" style={{ marginBottom: 10 }}>Extra Wings requests</h2>
        {reqs.loading && !reqs.data ? <Skeleton h={80} /> : !rows.length ? <p className="pt-sub">No extra Wings requested for this booking.</p> : rows.map((r, i) => (
          <div key={r.id} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--pt-line)' : 0 }}>
            <div className="pt-row between"><strong>+{fmtNum(r.points)} Wings</strong><Badge tone={REQUEST_TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge></div>
            <div className="pt-sub" style={{ fontSize: 13, marginTop: 3 }}>{r.reason}</div>
            <div className="pt-tiny" style={{ marginTop: 3 }}>Requested by {r.requested_by_name} · {fmtDateTime(r.created_at)}{r.reviewed_by_name ? ` · ${r.status === 'approved' ? 'Approved' : 'Declined'} by ${r.reviewed_by_name}` : ''}{r.review_note ? ` — “${r.review_note}”` : ''}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
