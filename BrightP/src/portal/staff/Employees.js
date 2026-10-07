import React, { useMemo, useState } from 'react';
import { Check, CircleAlert, CircleCheck, MoreVertical, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Avatar, Badge, Card, Empty, Field, Input, Modal, ModalHead, Notice, PhoneField, SearchBox, Select, Skeleton, fmtDate, formatPhone, isValidIndianMobile, nationalNumber, useAsync } from '../ui';
import StaffShell from './StaffShell';

const PERMISSIONS = [
  ['View customers', true, true], ['Create / edit customers', true, true], ['View bookings', true, true], ['Create / edit bookings', true, true],
  ['Manage Wings & rewards', true, false], ['Manage employees', true, false], ['View reports', true, false],
];

export default function Employees() {
  const { userData } = useAuth();
  const { allUsers, loadAllUsers, loading } = useAdminBooking();
  const stats = useAsync(() => api.get('/admin/analytics/employees').catch(() => []), []);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [pick, setPick] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const staff = useMemo(() => allUsers.filter((u) => u.role === 'employee' || u.role === 'admin'), [allUsers]);
  const list = staff.filter((u) => {
    if (role !== 'all' && u.role !== role) return false;
    if (status !== 'all' && (status === 'active') !== u.isActive) return false;
    const s = q.trim().toLowerCase();
    return !s || `${u.displayName} ${u.profile?.phone}`.toLowerCase().includes(s);
  });
  const sel = staff.find((u) => u.uid === pick) || list[0];
  const assigned = (u) => (stats.data || []).find((s) => s.user_id === u.uid)?.assigned ?? 0;

  const setActive = async (u, active) => {
    if (u.uid === userData?.uid && !active) { toast.error('You can’t deactivate your own account'); return; }
    if (!window.confirm(active ? `Reactivate ${u.displayName}?` : `Deactivate ${u.displayName}? This immediately revokes their access to the portal.`)) return;
    setBusy(true);
    try { await api.patch('/admin/users', { id: u.uid, is_active: active }); toast.success(active ? 'Access restored' : 'Access revoked'); await loadAllUsers(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const setRoleOf = async (u, next) => {
    if (u.uid === userData?.uid) { toast.error('You can’t change your own role'); return; }
    setBusy(true);
    try { await api.patch('/admin/users', { id: u.uid, role: next }); toast.success('Role updated'); await loadAllUsers(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <StaffShell title="Team & permissions" sub="Manage staff, set roles and control access to bookings."
      actions={<><SearchBox value={q} onChange={setQ} placeholder="Search name or phone…" /><Select value={role} onChange={(e) => setRole(e.target.value)} style={{ minWidth: 130 }}><option value="all">All roles</option><option value="admin">Admin</option><option value="employee">Employee</option></Select><Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 120 }}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></Select><button type="button" className="pt-btn sm" onClick={() => setInviteOpen(true)}><Plus size={16} /> Invite employee</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18, alignItems: 'start' }}>
        <Card pad={false} className="st-span2">
          {loading && !staff.length ? <div style={{ padding: 18 }}><Skeleton h={220} /></div> : (
            <div className="pt-table-wrap"><table className="pt-table">
              <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Active assignments</th><th>Joined on</th><th style={{ width: 40 }} /></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.uid} className={`clickable ${sel?.uid === u.uid ? 'sel' : ''}`} onClick={() => setPick(u.uid)}>
                    <td><span className="pt-row"><Avatar user={u} size="sm" /><span><strong>{u.displayName}</strong><span className="sub">{formatPhone(u.profile?.phone)}</span></span></span></td>
                    <td><Badge tone={u.role === 'admin' ? 'gold' : ''}>{u.role === 'admin' ? 'Admin' : 'Employee'}</Badge></td>
                    <td><Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td>{u.role === 'admin' ? 'All bookings' : `${assigned(u)} booking${assigned(u) === 1 ? '' : 's'}`}</td>
                    <td>{fmtDate(u.joinedAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}><button type="button" className="pt-icon-btn" aria-label="Select" onClick={() => setPick(u.uid)}><MoreVertical size={17} /></button></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={6}><Empty icon={Search} title="No team members match" /></td></tr>}
              </tbody>
            </table></div>
          )}
        </Card>

        {sel && (
          <div className="pt-stack lg">
            <Card>
              <div className="pt-row between"><h2 className="pt-h2">Role details</h2><Badge tone={sel.role === 'admin' ? 'gold' : ''}>{sel.role === 'admin' ? 'Admin' : 'Employee'}</Badge></div>
              <p className="pt-small" style={{ margin: '6px 0 12px' }}>{sel.role === 'admin' ? 'Full access to all features and data.' : 'Works on assigned bookings and their customers.'}</p>
              <table className="pt-table" style={{ border: '1px solid var(--pt-line)', borderRadius: 12 }}>
                <thead><tr><th>Permission</th><th>Admin</th><th>Employee</th></tr></thead>
                <tbody>{PERMISSIONS.map(([name, a, e]) => <tr key={name}><td>{name}</td><td>{a ? <Check size={16} style={{ color: 'var(--pt-green)' }} /> : '—'}</td><td>{e ? <Check size={16} style={{ color: 'var(--pt-green)' }} /> : '—'}</td></tr>)}<tr><td>Access scope</td><td className="pt-tiny">All bookings</td><td className="pt-tiny">Assigned only</td></tr></tbody>
              </table>
              <div className="pt-grid2" style={{ marginTop: 14 }}>
                <Field label="Role"><Select value={sel.role} disabled={busy || sel.uid === userData?.uid} onChange={(e) => setRoleOf(sel, e.target.value)}><option value="employee">Employee</option><option value="admin">Admin</option></Select></Field>
              </div>
            </Card>
            <div className="pt-notice red" style={{ display: 'block', borderRadius: 18, padding: 18 }}>
              <div className="pt-row" style={{ gap: 10, marginBottom: 6 }}><CircleAlert size={20} /><strong style={{ margin: 0, fontSize: 15 }}>{sel.isActive ? 'Deactivate employee' : 'Reactivate employee'}</strong></div>
              <p style={{ marginBottom: 12 }}>{sel.isActive ? 'This will immediately revoke access to the portal. The employee will not be able to sign in.' : 'This restores sign-in access for this employee.'}</p>
              <button type="button" className="pt-btn danger full" disabled={busy || (sel.uid === userData?.uid && sel.isActive)} onClick={() => setActive(sel, !sel.isActive)}><Trash2 size={16} /> {sel.isActive ? 'Deactivate employee' : 'Reactivate employee'}</button>
            </div>
          </div>
        )}
      </div>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onDone={() => { setInviteOpen(false); loadAllUsers(); }} />
    </StaffShell>
  );
}

function InviteModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', hr: '', role: 'employee' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const close = () => { setForm({ name: '', phone: '', email: '', hr: '', role: 'employee' }); setErrors({}); setDone(null); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter the employee’s name';
    if (!isValidIndianMobile(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!form.hr.trim()) next.hr = 'HR code is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const [first, ...rest] = form.name.trim().split(/\s+/);
      const user = await api.post('/admin/users', { first_name: first, last_name: rest.join(' ') || null, phone: nationalNumber(form.phone), email: form.email.trim() || undefined, hr_code: form.hr.trim() });
      if (form.role !== 'customer') await api.patch('/admin/users', { id: user.id, role: form.role });
      setDone(user);
    } catch (err) { setErrors({ form: err.status === 409 ? 'That phone number or HR code is already in use.' : err.message }); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={close} side label="Invite employee">
      {done ? (
        <div className="pt-stack lg" style={{ textAlign: 'center', paddingTop: 30 }}>
          <div className="pt-success-mark"><CircleCheck size={44} /></div>
          <div><h2 className="pt-h1" style={{ fontSize: 22 }}>{done.first_name} has been added</h2><p className="pt-sub" style={{ marginTop: 6 }}>They can sign in once they set a PIN with <strong>Forgot PIN</strong> on the sign-in page, using {formatPhone(done.phone)}.</p></div>
          <Notice icon={ShieldCheck}>No PIN is set or visible to you.</Notice>
          <button type="button" className="pt-btn full" onClick={() => { setDone(null); onDone(); }}>Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="pt-stack lg">
          <ModalHead title="Invite employee" sub="Add a team member and choose their access." onClose={close} />
          {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
          <Field label="Full name *" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} /></Field>
          <Field label="Phone number *" error={errors.phone}><PhoneField value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} /></Field>
          <Field label="Email" optional><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="HR code *" error={errors.hr}><Input value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} error={errors.hr} /></Field>
          <Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="employee">Employee — assigned bookings only</option><option value="admin">Admin — full access</option></Select></Field>
          <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={close}>Cancel</button><button type="submit" className="pt-btn" disabled={busy}>{busy ? 'Inviting…' : 'Invite employee'}</button></div>
        </form>
      )}
    </Modal>
  );
}

