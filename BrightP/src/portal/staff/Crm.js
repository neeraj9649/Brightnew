import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Check, CircleCheck, ClipboardList, Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { useCrm } from '../../contexts/CrmContext';
import { api } from '../../services/api';
import { Avatar, Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, SearchBox, Select, Skeleton, Tabs, TextArea, fmtDate, fmtDateTime, formatPhone, humanize, useAsync } from '../ui';
import { serviceOf } from '../booking';
import { TierIcon } from '../customer/parts';
import StaffShell from './StaffShell';

const PRIORITY_TONE = { high: 'red', medium: 'amber', low: 'green' };
const STATUS_TONE = { pending: 'blue', in_progress: 'amber', done: 'green', cancelled: '' };
const STATUS_LABEL = { pending: 'Open', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled' };
const isOpen = (t) => ['pending', 'in_progress'].includes(t.status);
const endOfWeek = () => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); d.setHours(23, 59, 59, 999); return d; };

export default function Crm() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('tasks');
  const [scope, setScope] = useState('me');
  const tasks = useAsync(() => api.get(`/portal/staff/tasks${isAdmin && scope === 'all' ? '?scope=all' : ''}`), [isAdmin, scope]);
  const customers = useAsync(() => api.get('/portal/staff/customers'), []);
  const [filter, setFilter] = useState('mine');
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const all = useMemo(() => tasks.data || [], [tasks.data]);
  const now = new Date();
  const week = endOfWeek();
  const counts = {
    mine: all.filter(isOpen).length,
    overdue: all.filter((t) => isOpen(t) && t.due_at && new Date(t.due_at) < now).length,
    week: all.filter((t) => isOpen(t) && t.due_at && new Date(t.due_at) >= now && new Date(t.due_at) <= week).length,
    upcoming: all.filter((t) => isOpen(t) && (!t.due_at || new Date(t.due_at) > week)).length,
    done: all.filter((t) => t.status === 'done').length,
  };
  const rows = all.filter((t) => {
    if (filter === 'mine' && !isOpen(t)) return false;
    if (filter === 'overdue' && !(isOpen(t) && t.due_at && new Date(t.due_at) < now)) return false;
    if (filter === 'week' && !(isOpen(t) && t.due_at && new Date(t.due_at) >= now && new Date(t.due_at) <= week)) return false;
    if (filter === 'upcoming' && !(isOpen(t) && (!t.due_at || new Date(t.due_at) > week))) return false;
    if (filter === 'done' && t.status !== 'done') return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    if (status !== 'all' && t.status !== status) return false;
    const s = q.trim().toLowerCase();
    return !s || `${t.customer_name} ${t.customer_code} ${t.title} ${t.booking_code}`.toLowerCase().includes(s);
  });
  const open = all.find((t) => t.id === openId);

  return (
    <StaffShell title="CRM & Follow-ups" sub="Manage your assigned customers and follow up on enquiries, quotes and trips." actions={<button type="button" className="pt-btn sm" onClick={() => setCreateOpen(true)}><Plus size={16} /> New follow-up</button>}>
      <div className="pt-stack lg">
        <Tabs tabs={[['customers', 'Customers'], ['tasks', 'Tasks']]} value={tab} onChange={setTab} />
        {tab === 'tasks' ? (
          <>
            <div className="pt-toolbar">
              <div className="pt-chips">{[['mine', `My follow-ups (${counts.mine})`], ['overdue', `Overdue (${counts.overdue})`], ['week', `Due this week (${counts.week})`], ['upcoming', `Upcoming (${counts.upcoming})`], ['done', 'Completed']].map(([v, l]) => <button type="button" key={v} className={`pt-chip ${filter === v ? 'active' : ''}`} style={filter === v ? { background: '#e8f2fb', color: 'var(--pt-blue)', borderColor: '#bcd7ee' } : undefined} onClick={() => setFilter(v)}>{l}</button>)}</div>
            </div>
            <div className="pt-toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search by name or booking ID…" />{isAdmin && <Select value={scope} onChange={(e) => setScope(e.target.value)} style={{ minWidth: 150 }}><option value="me">My tasks</option><option value="all">Whole team</option></Select>}<Select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ minWidth: 140 }}><option value="all">All priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select><Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 140 }}><option value="all">All status</option><option value="pending">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></Select></div>
            {tasks.error ? <ErrorState onRetry={tasks.reload} /> : (
              <Card pad={false}>
                {tasks.loading && !tasks.data ? <div style={{ padding: 18 }}><Skeleton h={200} /></div> : (
                  <div className="pt-table-wrap"><table className="pt-table">
                    <thead><tr><th>Priority</th><th>Due date</th><th>Customer</th><th>Subject</th><th>Related to</th><th>Status</th></tr></thead>
                    <tbody>
                      {rows.map((t) => { const overdue = isOpen(t) && t.due_at && new Date(t.due_at) < now; return (
                        <tr key={t.id} className={`clickable ${openId === t.id ? 'sel' : ''}`} onClick={() => setOpenId(t.id)} style={overdue ? { background: '#fff7f4' } : undefined}>
                          <td><Badge tone={PRIORITY_TONE[t.priority]}>{humanize(t.priority)}</Badge></td>
                          <td style={overdue ? { color: 'var(--pt-red)', fontWeight: 700 } : undefined}>{t.due_at ? fmtDate(t.due_at) : '—'}</td>
                          <td><strong>{t.customer_name || '—'}</strong><span className="sub">{t.customer_code}</span></td>
                          <td>{t.title}</td>
                          <td>{t.booking_code ? <><strong>{t.booking_code}</strong><span className="sub">{t.booking_place}</span></> : <span className="sub">Enquiry</span>}</td>
                          <td><Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge></td>
                        </tr>
                      ); })}
                      {!rows.length && <tr><td colSpan={6}><Empty icon={ClipboardList} title={filter === 'done' ? 'Nothing completed yet' : 'No follow-ups here'}>{filter === 'mine' ? 'You’re all caught up. Schedule a follow-up to keep customers warm.' : 'Try another filter.'}</Empty></td></tr>}
                    </tbody>
                  </table></div>
                )}
              </Card>
            )}
          </>
        ) : (
          <Card pad={false}>
            {customers.loading && !customers.data ? <div style={{ padding: 18 }}><Skeleton h={200} /></div> : (
              <div className="pt-table-wrap"><table className="pt-table"><thead><tr><th>Customer</th><th>Phone</th><th>Tier</th><th>Bookings</th><th>Next follow-up</th><th /></tr></thead><tbody>
                {(customers.data || []).map((c) => <tr key={c.id}><td><strong>{c.name}</strong><span className="sub">{c.membership_code}</span></td><td>{formatPhone(c.phone)}</td><td><Badge>{c.membership_tier}</Badge></td><td>{c.bookings}</td><td>{c.next_followup ? fmtDateTime(c.next_followup) : <span style={{ color: 'var(--pt-muted)' }}>None scheduled</span>}</td><td><button type="button" className="pt-btn ghost xs" onClick={() => { setCreateOpen(c); }}>Schedule</button></td></tr>)}
                {!(customers.data || []).length && <tr><td colSpan={6}><Empty icon={Search} title="No customers yet">Customers with bookings assigned to you appear here.</Empty></td></tr>}
              </tbody></table></div>
            )}
          </Card>
        )}
      </div>
      {open && <TaskDrawer task={open} onClose={() => setOpenId(null)} onChanged={tasks.reload} />}
      {createOpen && <NewTask preset={typeof createOpen === 'object' ? createOpen : null} customers={customers.data || []} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); tasks.reload(); }} />}
    </StaffShell>
  );
}

function TaskDrawer({ task, onClose, onChanged }) {
  const navigate = useNavigate();
  const { addNote } = useCrm();
  const [due, setDue] = useState(task.due_at ? new Date(new Date(task.due_at).getTime() - new Date(task.due_at).getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const patch = async (body, ok) => { setBusy(true); try { await api.patch(`/portal/staff/tasks/${task.id}`, body); if (ok) toast.success(ok); onChanged(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      if (task.booking_id) await addNote(task.booking_id, note.trim(), 'communication');
      else await api.patch(`/portal/staff/tasks/${task.id}`, { description: [task.description, note.trim()].filter(Boolean).join('\n') });
      setNote(''); onChanged();
    } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} side label="Follow-up">
      <div className="pt-stack lg">
        <div className="pt-row between top"><Badge tone={PRIORITY_TONE[task.priority]}><CircleCheck size={12} /> {humanize(task.priority)} priority</Badge><button type="button" className="pt-icon-btn" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        <div><h2 className="pt-h1" style={{ fontSize: 22 }}>{task.title}</h2>
          <div className="pt-row wrap" style={{ gap: 10, marginTop: 8 }}><span className="pt-small"><CalendarClock size={14} style={{ verticalAlign: -2 }} /> Due {task.due_at ? fmtDate(task.due_at) : 'not set'}</span><Badge tone={STATUS_TONE[task.status]} dot>{STATUS_LABEL[task.status]}</Badge></div>
          {task.booking_code && <p className="pt-small" style={{ marginTop: 8 }}>Related to <strong>{task.booking_code}</strong>{task.booking_place ? ` | ${task.booking_place}` : ''}</p>}
        </div>
        {task.customer_name && <div><h3 className="pt-h3" style={{ marginBottom: 8 }}>Customer</h3><div className="pt-item static"><Avatar user={{ displayName: task.customer_name }} size="sm" /><div className="pt-item-body"><div className="pt-item-title">{task.customer_name}</div><div className="pt-item-sub">{task.customer_code}{task.customer_tier ? <> · <TierIcon tier={task.customer_tier} size={12} /> {task.customer_tier}</> : null}</div></div><button type="button" className="pt-btn ghost xs" onClick={() => navigate(`/admin/customers/${task.customer_id}`)}>View customer</button></div></div>}
        {task.description && <div><h3 className="pt-h3" style={{ marginBottom: 8 }}>Notes</h3><div className="pt-notice plain" style={{ whiteSpace: 'pre-wrap' }}>{task.description}</div></div>}
        <Field label="Next contact date"><div className="pt-row"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /><button type="button" className="pt-btn soft sm" disabled={busy || !due} onClick={() => patch({ due_at: new Date(`${due}T10:00:00`).toISOString() }, 'Next contact date updated')}>Update</button></div></Field>
        <Field label="Add a note"><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={500} placeholder="Spoke to the customer. They are considering an earlier departure…" /></Field>
        <div className="pt-grid2">
          <button type="button" className="pt-btn" disabled={busy || !note.trim()} onClick={saveNote}>Save note</button>
          {isOpen(task) ? <button type="button" className="pt-btn gold" disabled={busy} onClick={() => patch({ status: 'done' }, 'Marked complete')}><Check size={16} /> Mark complete</button> : <button type="button" className="pt-btn soft" disabled={busy} onClick={() => patch({ status: 'pending' }, 'Reopened')}>Reopen</button>}
        </div>
        {isOpen(task) && task.status !== 'in_progress' && <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => patch({ status: 'in_progress' }, 'Marked in progress')}>Mark as in progress</button>}
      </div>
    </Modal>
  );
}

function NewTask({ preset, customers, onClose, onSaved }) {
  const { allBookings } = useAdminBooking();
  const [f, setF] = useState({ title: '', description: '', due: '', priority: 'medium', customerId: preset?.id || '', bookingId: '' });
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const found = customers.filter((c) => `${c.name} ${c.membership_code}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const bookings = allBookings.filter((b) => b.userId === f.customerId);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/portal/staff/tasks', { title: f.title, description: f.description || undefined, priority: f.priority, due_at: f.due ? new Date(f.due).toISOString() : null, customer_id: f.customerId || undefined, booking_id: f.bookingId || undefined }); toast.success('Follow-up scheduled'); onSaved(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} side label="New follow-up">
      <ModalHead title="New follow-up" onClose={onClose} />
      <form onSubmit={save} className="pt-stack">
        <Field label="Subject *"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Call customer about quotation" /></Field>
        {preset ? <Field label="Customer"><Input value={preset.name} disabled /></Field> : (
          <Field label="Customer" optional><SearchBox value={q} onChange={setQ} placeholder="Search customers…" />
            <div className="pt-menu-list" style={{ marginTop: 8 }}>{found.map((c) => <button type="button" key={c.id} style={{ background: f.customerId === c.id ? '#eaf3fb' : undefined }} onClick={() => setF({ ...f, customerId: c.id, bookingId: '' })}><span className="pt-item-title">{c.name}</span><span className="pt-item-sub">{c.membership_code}</span></button>)}{!found.length && <div style={{ padding: 14 }} className="pt-sub">No matches.</div>}</div></Field>
        )}
        {f.customerId && bookings.length > 0 && <Field label="Related booking" optional><Select value={f.bookingId} onChange={(e) => setF({ ...f, bookingId: e.target.value })}><option value="">Enquiry (no booking)</option>{bookings.map((b) => <option key={b.docId} value={b.docId}>{b.id} · {serviceOf(b.type).label}</option>)}</Select></Field>}
        <div className="pt-grid2"><Field label="Due"><Input type="datetime-local" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field><Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select></Field></div>
        <Field label="Notes" optional><TextArea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} max={500} /></Field>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="submit" className="pt-btn" disabled={busy || !f.title.trim()}>{busy ? 'Saving…' : 'Schedule'}</button></div>
      </form>
    </Modal>
  );
}

