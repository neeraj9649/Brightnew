import React, { useState } from 'react';
import { Check, ListChecks, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Avatar, Skeleton, TextArea, fmtDateTime, useAsync } from '../ui';

/** The steps the advisor wrote for this booking: what to do and what happens next. */
export function StepsCard({ bookingId, className = 'pt-card' }) {
  const { data, loading } = useAsync(() => api.get(`/portal/bookings/${bookingId}/steps`).catch(() => []), [bookingId]);
  const steps = data || [];
  if (!loading && !steps.length) return null;
  const done = steps.filter((s) => s.status === 'done').length;
  return (
    <section className={className} style={{ padding: 20 }} aria-label="Steps for this booking">
      <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 21, display: 'flex', alignItems: 'center', gap: 8 }}><ListChecks size={20} />Your steps</h2>{steps.length > 0 && <span className="pt-small">{done} of {steps.length} done</span>}</div>
      {loading && !data ? <Skeleton h={90} r={12} style={{ marginTop: 12 }} /> : (
        <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 14 }}>
          {steps.map((s, i) => (
            <li key={s.id} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 12, alignItems: 'start' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, background: s.status === 'done' ? '#1f8a5d' : '#f6f2e9', color: s.status === 'done' ? '#fff' : 'var(--pt-navy)', border: s.status === 'done' ? 0 : '1.5px solid var(--pt-line-strong)' }}>{s.status === 'done' ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
              <div><strong style={{ color: 'var(--pt-navy)', textDecoration: s.status === 'done' ? 'line-through' : 'none', opacity: s.status === 'done' ? 0.65 : 1 }}>{s.title}</strong>{s.details && <div className="pt-sub" style={{ marginTop: 3, fontSize: 14 }}>{s.details}</div>}{s.completed_at && <div className="pt-tiny" style={{ marginTop: 3 }}>Done {fmtDateTime(s.completed_at)}</div>}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Customer ⇄ advisor conversation for one booking (the desktop page has its own richer version). */
export function MessagesCard({ bookingId, advisorName }) {
  const { data, loading, reload } = useAsync(() => api.get(`/portal/bookings/${bookingId}/messages`).catch(() => []), [bookingId]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try { await api.post(`/portal/bookings/${bookingId}/messages`, { body: draft.trim() }); setDraft(''); reload(); toast.success('Message sent'); } catch (e) { toast.error(e.message || 'Message not sent'); } finally { setBusy(false); }
  };
  const msgs = data || [];
  return (
    <section className="pt-card" style={{ padding: 20 }} aria-label="Messages">
      <h2 className="pt-serif-h" style={{ fontSize: 21 }}>Messages</h2>
      <p className="pt-sub" style={{ marginTop: 4, fontSize: 14 }}>{advisorName ? `Write to ${advisorName.split(' ')[0]} about this booking.` : 'Write to your travel advisor about this booking.'}</p>
      {loading && !data ? <Skeleton h={70} r={12} style={{ marginTop: 12 }} /> : msgs.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 12 }}>
          {msgs.slice(-6).map((m) => (
            <li key={m.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 10 }}>
              <Avatar user={{ displayName: m.sender_name }} size="sm" />
              <div><div className="pt-tiny"><b>{m.sender_role === 'customer' ? 'You' : m.sender_name}</b> · {fmtDateTime(m.created_at)}</div><div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14, marginTop: 2 }}>{m.body}</div></div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-stack" style={{ marginTop: 14 }}>
        <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} max={2000} placeholder="Type your message…" />
        <button type="button" className="pt-btn full" disabled={busy || !draft.trim()} onClick={send}><Send size={16} /> {busy ? 'Sending…' : 'Send message'}</button>
      </div>
    </section>
  );
}
