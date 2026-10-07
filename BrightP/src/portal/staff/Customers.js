import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CircleCheck, Gift, MoreVertical, Plus, Search, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { api } from '../../services/api';
import {
  Avatar, Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, Notice, PhoneField, SearchBox, Select, Skeleton, TextArea, fmtDate, fmtNum, formatPhone, humanize, isValidIndianMobile, nationalNumber, useAsync,
} from '../ui';
import { TIERS, bookingTitle, serviceOf, statusMeta } from '../booking';
import { TierIcon } from '../customer/parts';
import StaffShell from './StaffShell';

const TIER_TONE = { Silver: '', Gold: 'gold', Platinum: 'blue', Titanium: 'navy' };
const nextTier = (lifetime) => TIERS.find(([, t]) => t > lifetime);

export default function Customers() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get('/portal/staff/customers'), []);
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('all');
  const [status, setStatus] = useState('all');
  const [pick, setPick] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [menu, setMenu] = useState(null);

  const list = useMemo(() => (data || []).filter((c) => {
    if (tier !== 'all' && c.membership_tier !== tier) return false;
    if (status !== 'all' && (status === 'active') !== c.is_active) return false;
    const s = q.trim().toLowerCase();
    return !s || `${c.name} ${c.phone} ${c.membership_code}`.toLowerCase().includes(s);
  }), [data, q, tier, status]);
  const sel = list.find((c) => c.id === pick) || list[0];
  const nt = sel && nextTier(sel.lifetime_wings);

  return (
    <StaffShell
      title="Customer administration"
      sub="Search members, view tier status and manage accounts."
      actions={<><SearchBox value={q} onChange={setQ} placeholder="Search by name, phone or membership ID…" /><button type="button" className="pt-btn sm" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create customer</button></>}
    >
      {error ? <ErrorState onRetry={reload} /> : (
        <div className="pt-stack lg">
          {sel && (
            <Card>
              <div className="pt-row between wrap" style={{ gap: 18 }}>
                <div className="pt-row" style={{ gap: 16 }}>
                  <Avatar user={{ displayName: sel.name }} size="lg" />
                  <div><div className="pt-row" style={{ gap: 10 }}><h2 className="pt-h1" style={{ fontSize: 22 }}>{sel.name}</h2><Badge tone={TIER_TONE[sel.membership_tier]}><TierIcon tier={sel.membership_tier} size={13} /> {sel.membership_tier}</Badge></div><div className="pt-small" style={{ marginTop: 4 }}>{sel.membership_code} · Joined {fmtDate(sel.joined_at)}</div></div>
                </div>
                <div className="pt-row wrap" style={{ gap: 28 }}>
                  {[[fmtNum(sel.tokens), 'Wings balance'], [fmtNum(sel.lifetime_wings), 'Lifetime Wings'], [nt ? fmtNum(nt[1] - sel.lifetime_wings) : '—', nt ? `to ${nt[0]} (${fmtNum(nt[1])})` : 'Top tier']].map(([v, l]) => <div key={l} style={{ textAlign: 'center' }}><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{v}</strong><div className="pt-small">{l}</div></div>)}
                  <button type="button" className="pt-btn ghost sm" onClick={() => navigate(`/admin/customers/${sel.id}`)}>View details <ChevronRight size={15} /></button>
                </div>
              </div>
            </Card>
          )}
          <Card pad={false}>
            <div className="pt-row between wrap" style={{ padding: 18, gap: 12 }}>
              <h2 className="pt-h2">All customers ({list.length})</h2>
              <div className="pt-row wrap"><Select value={tier} onChange={(e) => setTier(e.target.value)} style={{ minWidth: 130 }}><option value="all">All tiers</option>{TIERS.map(([t]) => <option key={t}>{t}</option>)}</Select><Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 130 }}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></Select></div>
            </div>
            {loading && !data ? <div style={{ padding: 18 }}><Skeleton h={200} /></div> : (
              <div className="pt-table-wrap"><table className="pt-table">
                <thead><tr><th>Name</th><th>Membership ID</th><th>Phone</th><th>Tier</th><th>Wings balance</th><th>Lifetime Wings</th><th>Joined on</th><th>Status</th><th style={{ width: 40 }} /></tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className={`clickable ${sel?.id === c.id ? 'sel' : ''}`} onClick={() => setPick(c.id)} onDoubleClick={() => navigate(`/admin/customers/${c.id}`)}>
                      <td><strong>{c.name}</strong></td><td>{c.membership_code}</td><td>{formatPhone(c.phone)}</td><td><Badge tone={TIER_TONE[c.membership_tier]}>{c.membership_tier}</Badge></td><td>{fmtNum(c.tokens)}</td><td>{fmtNum(c.lifetime_wings)}</td><td>{fmtDate(c.joined_at)}</td>
                      <td><Badge tone={c.is_active ? 'green' : 'red'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}><button type="button" className="pt-icon-btn" aria-label="Actions" onClick={() => setMenu(menu === c.id ? null : c.id)}><MoreVertical size={17} /></button>{menu === c.id && <div className="pt-popover" style={{ width: 190, top: '70%', zIndex: 20 }}><div className="pt-menu-list" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}><button type="button" onClick={() => navigate(`/admin/customers/${c.id}`)}>View details</button></div></div>}</td>
                    </tr>
                  ))}
                  {!list.length && <tr><td colSpan={9}><Empty icon={Search} title="No customers found">{isAdmin ? 'Try a different search, or create a new customer.' : 'You only see customers whose bookings are assigned to you.'}</Empty></td></tr>}
                </tbody>
              </table></div>
            )}
          </Card>
        </div>
      )}
      <CreateCustomer open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(u) => { setCreateOpen(false); reload(); setPick(u.id); }} />
    </StaffShell>
  );
}

function CreateCustomer({ open, onClose, onCreated }) {
  const { loadAllUsers } = useAdminBooking();
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter the customer’s name';
    if (!isValidIndianMobile(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const [first, ...rest] = form.name.trim().split(/\s+/);
      const user = await api.post('/staff/users', { first_name: first, last_name: rest.join(' ') || null, phone: nationalNumber(form.phone) });
      if (isAdmin) loadAllUsers();
      setDone(user);
    } catch (err) { setErrors({ form: err.status === 409 ? 'A member with this phone number already exists.' : err.message }); } finally { setBusy(false); }
  };
  const close = () => { setForm({ name: '', phone: '' }); setErrors({}); setDone(null); onClose(); };
  return (
    <Modal open={open} onClose={close} side label="Create customer">
      {done ? (
        <div className="pt-stack lg" style={{ textAlign: 'center', paddingTop: 30 }}>
          <div className="pt-success-mark"><CircleCheck size={44} /></div>
          <div><h2 className="pt-h1" style={{ fontSize: 22 }}>{done.first_name}’s membership is ready</h2><p className="pt-sub" style={{ marginTop: 6 }}>Member number <strong>{done.membership_code}</strong> · Silver tier · {fmtNum(done.tokens)} welcome Wings added.</p></div>
          <Notice icon={ShieldCheck} title="PIN setup invitation">The customer sets their own PIN using Forgot PIN on the sign-in page with {formatPhone(done.phone)}. No PIN is set or visible to you.</Notice>
          <button type="button" className="pt-btn full" onClick={() => onCreated(done)}>Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="pt-stack lg">
          <ModalHead title="Create customer" onClose={close} />
          {errors.form && <Notice tone="red">{errors.form}</Notice>}
          <Field label="Full name *" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter customer name" error={errors.name} /></Field>
          <Field label="Phone number *" error={errors.phone}><PhoneField value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} placeholder="Enter 10 digit mobile number" /></Field>
          <Notice tone="gold" icon={Gift}>A new <strong style={{ display: 'inline' }}>Silver membership</strong> will be created automatically with a welcome bonus, identical to self signup.</Notice>
          <div><h3 className="pt-h3">PIN setup invitation</h3><p className="pt-sub" style={{ marginTop: 4 }}>We’ll send a secure PIN setup message by SMS (when an SMS gateway is configured). The customer creates their own 4-digit PIN to access their account.</p></div>
          <div className="pt-notice green" style={{ display: 'block' }}>{['Creates Silver tier membership', 'Adds welcome Wings to wallet', 'Generates a referral code', 'No PIN is set or visible to you'].map((t) => <div key={t} className="pt-row" style={{ gap: 8, margin: '3px 0' }}><CircleCheck size={15} /> {t}</div>)}</div>
          <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={close}>Cancel</button><button type="submit" className="pt-btn" disabled={busy}>{busy ? 'Creating…' : 'Create customer'}</button></div>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ customer detail */

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { allBookings, addUserTokens, removeUserTokens, loadAllUsers } = useAdminBooking();
  const user = useAsync(() => api.get(`/staff/users/${id}`), [id]);
  const wings = useAsync(() => (isAdmin ? api.get(`/admin/rewards/users/${id}`) : Promise.resolve([])), [id, isAdmin]);
  const [adjust, setAdjust] = useState({ mode: 'add', amount: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const u = user.data;
  const bookings = allBookings.filter((b) => b.userId === id);

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(adjust.amount);
    if (!Number.isInteger(amount) || amount <= 0) { toast.error('Enter a positive whole number of Wings'); return; }
    if (!adjust.reason.trim()) { toast.error('Please give a reason for the adjustment'); return; }
    setBusy(true);
    await loadAllUsers();
    const ok = adjust.mode === 'add' ? await addUserTokens(id, amount, adjust.reason.trim()) : await removeUserTokens(id, amount, adjust.reason.trim());
    setBusy(false);
    if (ok) { setAdjust({ mode: 'add', amount: '', reason: '' }); user.reload(); wings.reload(); }
  };
  const toggleActive = async () => {
    if (!window.confirm(u.is_active ? 'Deactivate this account? They will be signed out and unable to sign in.' : 'Reactivate this account?')) return;
    try { await api.patch('/admin/users', { id, is_active: !u.is_active }); toast.success(u.is_active ? 'Account deactivated' : 'Account reactivated'); user.reload(); } catch (err) { toast.error(err.message); }
  };

  return (
    <StaffShell active="customers" title={u ? u.first_name + (u.last_name ? ` ${u.last_name}` : '') : 'Customer'} sub={u ? `${u.membership_code} · ${formatPhone(u.phone)}` : ''} actions={<button type="button" className="pt-btn ghost sm" onClick={() => navigate('/admin/customers')}>All customers</button>}>
      {user.error ? <ErrorState onRetry={user.reload}>We couldn’t load this customer.</ErrorState> : !u ? <Skeleton h={300} r={18} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18, alignItems: 'start' }}>
          <div className="pt-stack lg">
            <Card>
              <div className="pt-row" style={{ gap: 16 }}><Avatar user={{ displayName: u.first_name, photoURL: u.profile_image_url }} size="lg" /><div><Badge tone={TIER_TONE[u.membership_tier]}><TierIcon tier={u.membership_tier} size={13} /> {u.membership_tier}</Badge> <Badge tone={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Inactive'}</Badge><div className="pt-small" style={{ marginTop: 8 }}>Joined {fmtDate(u.joined_at)} · Last active {fmtDate(u.last_active)}</div></div></div>
              <hr className="pt-divider" />
              {[['Wings balance', fmtNum(u.tokens)], ['Lifetime Wings', fmtNum(u.lifetime_points_earned)], ['Referral code', u.referral_code], ['Email', u.email], ['Total bookings', bookings.length || u.total_bookings]].map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{v ?? '—'}</strong></div>)}
              {isAdmin && <button type="button" className={`pt-btn sm ${u.is_active ? 'danger' : ''}`} style={{ marginTop: 14 }} onClick={toggleActive}>{u.is_active ? 'Deactivate account' : 'Reactivate account'}</button>}
            </Card>
            {isAdmin && (
              <Card>
                <h2 className="pt-h2" style={{ marginBottom: 12 }}>Adjust Wings</h2>
                <form onSubmit={submit} className="pt-stack">
                  <div className="pt-seg"><button type="button" className={adjust.mode === 'add' ? 'active' : ''} onClick={() => setAdjust({ ...adjust, mode: 'add' })}>Add Wings</button><button type="button" className={adjust.mode === 'remove' ? 'active' : ''} onClick={() => setAdjust({ ...adjust, mode: 'remove' })}>Remove Wings</button></div>
                  <Input type="number" min="1" placeholder="Number of Wings" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
                  <TextArea value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} max={200} placeholder="Reason (shown in the member’s Wings history)" />
                  <button type="submit" className="pt-btn sm" disabled={busy}>{busy ? 'Applying…' : 'Apply adjustment'}</button>
                </form>
              </Card>
            )}
          </div>
          <div className="pt-stack lg">
            <Card pad={false}>
              <div style={{ padding: '18px 18px 8px' }}><h2 className="pt-h2">Bookings</h2></div>
              {!bookings.length ? <Empty icon={Star} title="No bookings">{isAdmin ? 'This customer has not requested any trips yet.' : 'No bookings assigned to you for this customer.'}</Empty> : <div className="pt-table-wrap"><table className="pt-table"><thead><tr><th>ID</th><th>Service</th><th>Status</th><th>Created</th></tr></thead><tbody>{bookings.map((b) => { const m = statusMeta(b.status); return <tr key={b.docId} className="clickable" onClick={() => navigate(`/admin/bookings/${b.docId}`)}><td><strong>{b.id}</strong></td><td>{bookingTitle(b)}<span className="sub">{serviceOf(b.type).label}</span></td><td><Badge tone={m.tone}>{m.label}</Badge></td><td>{fmtDate(b.createdAt)}</td></tr>; })}</tbody></table></div>}
            </Card>
            {isAdmin && (
              <Card>
                <h2 className="pt-h2" style={{ marginBottom: 6 }}>Wings history</h2>
                {wings.loading && !wings.data ? <Skeleton h={90} /> : !(wings.data || []).length ? <p className="pt-sub">No Wings activity yet.</p> : (wings.data || []).map((w) => <div key={w.id} className="pt-row between" style={{ padding: '11px 0', borderTop: '1px solid var(--pt-line)' }}><span><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>{w.description || humanize(w.reason)}</strong><br /><span className="pt-tiny">{humanize(w.reason)} · {fmtDate(w.created_at)}</span></span><strong style={{ color: w.points > 0 ? 'var(--pt-green)' : 'var(--pt-red)' }}>{w.points > 0 ? '+' : '−'}{fmtNum(Math.abs(w.points))}</strong></div>)}
              </Card>
            )}
          </div>
        </div>
      )}
    </StaffShell>
  );
}

