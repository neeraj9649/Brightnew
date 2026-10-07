import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CircleAlert, List, LayoutGrid, MapPin, Phone, Plus, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { api } from '../../services/api';
import { Avatar, Badge, Card, Check2, Empty, Field, Modal, ModalHead, Notice, SearchBox, Select, Skeleton, TextArea, fmtDate, useAsync } from '../ui';
import { SERVICES, SERVICE_ORDER, bookingTitle, serviceOf, statusMeta, STATUS } from '../booking';
import { FieldView, initialForm, validateTrip } from '../customer/BookingNew';
import StaffShell from './StaffShell';

const COLUMNS = [
  ['Requested', ['new'], '#fbe4e1', '#b04a43'],
  ['Assigned', ['assigned', 'contacted'], '#e3effa', '#28628d'],
  ['Quoted', ['awaiting_approval', 'awaiting_payment'], '#fdf0d6', '#94651d'],
  ['Confirmed', ['payment_received', 'booking_confirmed'], '#e1f3ea', '#14735f'],
  ['Completed', ['completed'], '#ecedf0', '#52606f'],
];

const dateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null);

export default function StaffBookings() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { allBookings, employees, allUsers, loading, updateBookingStatus } = useAdminBooking();
  const { data: tasks } = useAsync(() => api.get(`/portal/staff/tasks${isAdmin ? '?scope=all' : ''}`).catch(() => []), [isAdmin]);
  const [view, setView] = useState(isAdmin ? 'list' : 'board');
  const [query, setQuery] = useState('');
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');
  const [owner, setOwner] = useState('all');
  const [range, setRange] = useState('all');
  const [selected, setSelected] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const followBy = useMemo(() => {
    const m = new Map();
    (tasks || []).filter((t) => ['pending', 'in_progress'].includes(t.status) && t.booking_id && t.due_at).forEach((t) => { if (!m.has(t.booking_id) || new Date(t.due_at) < new Date(m.get(t.booking_id))) m.set(t.booking_id, t.due_at); });
    return m;
  }, [tasks]);
  const employeeName = (id) => employees.find((e) => e.uid === id)?.displayName || (id ? 'Staff' : null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 864e5;
    return allBookings.filter((b) => {
      if (service !== 'all' && b.type !== service) return false;
      if (status !== 'all' && b.status !== status) return false;
      if (owner === 'none' ? b.assignedEmployeeId : owner !== 'all' && b.assignedEmployeeId !== owner) return false;
      if (cutoff && b.createdAt.getTime() < cutoff) return false;
      return !q || `${b.id} ${b.userName || ''} ${b.userPhone || ''} ${bookingTitle(b)} ${serviceOf(b.type).label}`.toLowerCase().includes(q);
    });
  }, [allBookings, query, service, status, owner, range]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectedBookings = allBookings.filter((b) => selected.includes(b.docId));

  const filters = (
    <>
      <Select value={service} onChange={(e) => setService(e.target.value)} style={{ minWidth: 150 }}><option value="all">All services</option>{SERVICE_ORDER.map((t) => <option key={t} value={t}>{SERVICES[t].label}</option>)}</Select>
      {isAdmin && <>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 150 }}><option value="all">All statuses</option>{Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ minWidth: 170 }}><option value="all">All employees</option><option value="none">Unassigned</option>{employees.map((e) => <option key={e.uid} value={e.uid}>{e.displayName}</option>)}</Select>
        <Select value={range} onChange={(e) => setRange(e.target.value)} style={{ minWidth: 150 }}><option value="all">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></Select>
        {(status !== 'all' || owner !== 'all' || range !== 'all' || service !== 'all') && <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => { setStatus('all'); setOwner('all'); setRange('all'); setService('all'); }}>Clear filters</button>}
      </>}
    </>
  );

  return (
    <StaffShell
      title={isAdmin ? 'All bookings' : 'Assigned bookings pipeline'}
      sub={isAdmin ? 'View, manage and assign bookings across all services.' : 'Track and manage all bookings assigned to you.'}
      actions={<>
        {!isAdmin && <SearchBox value={query} onChange={setQuery} placeholder="Search by customer name or reference" />}
        <div className="pt-seg" style={{ minWidth: 150 }}><button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><LayoutGrid size={15} style={{ verticalAlign: -2 }} /> Board</button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={15} style={{ verticalAlign: -2 }} /> List</button></div>
        <button type="button" className="pt-btn sm" onClick={() => setCreateOpen(true)}><Plus size={16} /> New booking</button>
      </>}
    >
      <div className="pt-stack lg">
        <div className="pt-toolbar">{isAdmin && <SearchBox value={query} onChange={setQuery} placeholder="Search booking ID, customer or service" />}{filters}</div>

        {loading && !allBookings.length ? <Skeleton h={300} r={18} /> : view === 'board' ? (
          <div className="st-board">
            {COLUMNS.map(([label, statuses, bgc, fg]) => {
              const col = list.filter((b) => statuses.includes(b.status));
              return (
                <div key={label} className="st-col" style={{ background: bgc }}>
                  <h3 style={{ color: fg }}>{label} <span className="count">{col.length}</span></h3>
                  {col.map((b) => {
                    const f = followBy.get(b.docId);
                    const overdue = f && new Date(f) < new Date();
                    return (
                      <button type="button" key={b.docId} className="st-bcard" onClick={() => navigate(`/admin/bookings/${b.docId}`)}>
                        <div className="pt-row between"><span className="pt-tiny">{b.id}</span><Phone size={16} style={{ color: 'var(--pt-muted)' }} /></div>
                        <strong style={{ color: 'var(--pt-navy)' }}>{b.userName}</strong>
                        <span className="pt-small pt-row" style={{ gap: 5 }}><MapPin size={13} />{bookingTitle(b)}</span>
                        <span className="pt-small pt-row" style={{ gap: 5 }}><Calendar size={13} />{fmtDate(serviceOf(b.type).date_of(b))}<Badge style={{ marginLeft: 'auto' }}>{serviceOf(b.type).label}</Badge></span>
                        {f ? <span className="pt-tiny pt-row" style={{ gap: 5, color: overdue ? 'var(--pt-red)' : 'var(--pt-muted)' }}><CircleAlert size={13} /> Follow up: {dateTime(f)}</span> : <span className="pt-tiny">No follow-up scheduled</span>}
                        {isAdmin && <span className="pt-tiny">{employeeName(b.assignedEmployeeId) || 'Unassigned'}</span>}
                      </button>
                    );
                  })}
                  {!col.length && <p className="pt-tiny" style={{ padding: '6px 8px' }}>Nothing here</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isAdmin && selected.length ? 'minmax(0, 1fr) minmax(0, 340px)' : 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
            <Card pad={false}>
              <div className="pt-table-wrap">
                <table className="pt-table">
                  <thead><tr>{isAdmin && <th style={{ width: 36 }} />}<th>Booking ID</th><th>Customer</th><th>Service</th><th>Status</th>{isAdmin && <th>Assigned employee</th>}<th>Next follow-up</th><th>Created on</th></tr></thead>
                  <tbody>
                    {list.map((b) => { const m = statusMeta(b.status); const f = followBy.get(b.docId); return (
                      <tr key={b.docId} className={`clickable ${selected.includes(b.docId) ? 'sel' : ''}`} onClick={() => navigate(`/admin/bookings/${b.docId}`)}>
                        {isAdmin && <td onClick={(e) => e.stopPropagation()}><Check2 checked={selected.includes(b.docId)} onChange={() => toggle(b.docId)}>{' '}</Check2></td>}
                        <td><strong>{b.id}</strong></td><td>{b.userName || '—'}</td><td>{bookingTitle(b)}<span className="sub">{serviceOf(b.type).label}</span></td>
                        <td><Badge tone={m.tone}>{m.label}</Badge></td>
                        {isAdmin && <td>{employeeName(b.assignedEmployeeId) || <span style={{ color: 'var(--pt-muted)' }}>Unassigned</span>}</td>}
                        <td>{f ? fmtDate(f) : '—'}</td><td>{fmtDate(b.createdAt)}</td>
                      </tr>
                    ); })}
                    {!list.length && <tr><td colSpan={8}><Empty icon={Search} title="No bookings match">Try adjusting your filters or search.</Empty></td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
            {isAdmin && selected.length > 0 && (
              <Card>
                <div className="pt-row between"><h2 className="pt-h2">Assign employee</h2><button type="button" className="pt-link muted" onClick={() => setSelected([])}>Clear</button></div>
                {selected.length === 1 ? <div style={{ marginTop: 10 }}>{[['Booking ID', selectedBookings[0]?.id], ['Customer', selectedBookings[0]?.userName], ['Service', bookingTitle(selectedBookings[0] || {})], ['Current status', statusMeta(selectedBookings[0]?.status).label]].map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div> : <p className="pt-sub" style={{ marginTop: 8 }}>{selected.length} bookings selected.</p>}
                <button type="button" className="pt-btn full" style={{ marginTop: 14 }} onClick={() => setAssignOpen(true)}><Users size={17} /> Choose employee</button>
              </Card>
            )}
          </div>
        )}
      </div>

      <AssignModal open={assignOpen} bookings={selectedBookings} employees={employees} onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); setSelected([]); }} update={updateBookingStatus} />
      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} users={allUsers} />
    </StaffShell>
  );
}

function AssignModal({ open, bookings, employees, onClose, onDone, update }) {
  const [pick, setPick] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const shown = employees.filter((e) => e.displayName.toLowerCase().includes(q.toLowerCase()));
  const save = async () => {
    setBusy(true);
    try {
      for (const b of bookings) {
        // Assigning moves a brand-new request to "Assigned"; later stages keep their status.
        await update(b.id, { assignedEmployeeId: pick, status: b.status === 'new' ? 'assigned' : undefined, adminNotes: note || undefined });
      }
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} side label="Assign employee">
      <ModalHead title="Assign employee" sub={bookings.length === 1 ? `Booking ${bookings[0].id}` : `${bookings.length} bookings`} onClose={onClose} />
      <div className="pt-stack">
        <SearchBox value={q} onChange={setQ} placeholder="Search employee…" />
        <div className="pt-menu-list">
          {shown.map((e) => (
            <button type="button" key={e.uid} onClick={() => setPick(e.uid)} style={{ background: pick === e.uid ? '#eaf3fb' : undefined }}>
              <Avatar user={e} size="sm" /><span><span className="pt-item-title" style={{ display: 'block' }}>{e.displayName}</span><span className="pt-item-sub" style={{ display: 'block' }}>Travel consultant</span></span>
              {pick === e.uid && <span className="chev" style={{ color: 'var(--pt-blue)', fontWeight: 800 }}>✓</span>}
            </button>
          ))}
          {!shown.length && <div style={{ padding: 16 }} className="pt-sub">No employees found.</div>}
        </div>
        <Field label="Add a note" optional><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={500} placeholder="e.g. Special instructions or context…" /></Field>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={!pick || busy} onClick={save}>{busy ? 'Saving…' : 'Save assignment'}</button></div>
      </div>
    </Modal>
  );
}

function CreateBookingModal({ open, onClose, users }) {
  const navigate = useNavigate();
  const { staffCreateBooking } = useAdminBooking();
  const [q, setQ] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [service, setService] = useState('flight');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const customers = users.filter((u) => u.role === 'customer' && `${u.displayName} ${u.profile?.phone} ${u.membershipCode}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const svc = SERVICES[service];
  const f = form || initialForm(svc, new URLSearchParams(), null);

  const save = async () => {
    const e = validateTrip(svc, f);
    setErrors(e);
    if (!customerId) { toast.error('Choose a customer first'); return; }
    if (Object.keys(e).some((k) => e[k])) { toast.error('Please complete the highlighted details'); return; }
    setBusy(true);
    const { specialRequests, ...details } = f;
    const created = await staffCreateBooking({ userId: customerId, type: service, details, specialRequests });
    setBusy(false);
    if (created) { onClose(); navigate(`/admin/bookings/${created.docId}`); }
  };

  return (
    <Modal open={open} onClose={onClose} side label="New booking">
      <ModalHead title="New booking" sub="Create a booking on behalf of a customer." onClose={onClose} />
      <div className="pt-stack">
        <Field label="Customer"><SearchBox value={q} onChange={setQ} placeholder="Search name, phone or member ID" /></Field>
        <div className="pt-menu-list">
          {customers.map((u) => <button type="button" key={u.uid} onClick={() => setCustomerId(u.uid)} style={{ background: customerId === u.uid ? '#eaf3fb' : undefined }}><Avatar user={u} size="sm" /><span><span className="pt-item-title" style={{ display: 'block' }}>{u.displayName}</span><span className="pt-item-sub" style={{ display: 'block' }}>{u.profile?.phone} · {u.membershipCode}</span></span></button>)}
          {!customers.length && <div style={{ padding: 16 }} className="pt-sub">No matching customers.</div>}
        </div>
        <Field label="Service"><Select value={service} onChange={(e) => { setService(e.target.value); setForm(null); setErrors({}); }}>{SERVICE_ORDER.map((t) => <option key={t} value={t}>{SERVICES[t].label}</option>)}</Select></Field>
        {svc.fields.map((row, i) => (Array.isArray(row)
          ? <div className="pt-grid2" key={i} style={{ alignItems: 'start' }}>{row.map((fd) => <FieldView key={fd.key} def={fd} form={f} set={(k, v) => setForm({ ...f, [k]: v })} error={errors[fd.key]} />)}</div>
          : <FieldView key={row.key} def={row} form={f} set={(k, v) => setForm({ ...f, [k]: v })} error={row.type === 'route' ? errors.route : errors[row.key]} />))}
        <Notice icon={Users}>The customer will see this request in their portal and receive Wings when it is completed.</Notice>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={busy} onClick={save}>{busy ? 'Creating…' : 'Create booking'}</button></div>
      </div>
    </Modal>
  );
}

