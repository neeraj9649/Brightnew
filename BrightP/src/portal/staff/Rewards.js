import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CircleAlert, Gift, MoreVertical, Plus, RefreshCw, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { fileUrl, uploadProfileImage, validateFile } from '../../services/storage';
import { Avatar, Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, Notice, RupeeCoin, SearchBox, Select, Skeleton, Tabs, TextArea, fmtDate, fmtDateTime, fmtNum, useAsync } from '../ui';
import { RewardArt, TierIcon } from '../customer/parts';
import StaffShell from './StaffShell';

const CATEGORIES = ['Hotel Stays', 'Airport Services', 'Flight Benefits', 'Experiences', 'Tickets', 'Travel', 'Membership'];
const STATUS_TONE = { requested: 'amber', approved: 'blue', voucher_issued: 'green', delivered: 'green', rejected: 'red', cancelled: '' };
const STATUS_LABEL = { requested: 'Pending', approved: 'In review', voucher_issued: 'Issued', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled' };

/* ------------------------------------------------------------ reward catalog */

export function RewardCatalogAdmin() {
  const items = useAsync(() => api.get('/admin/reward-items'), []);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [edit, setEdit] = useState(undefined); // undefined closed, null new, item edit
  const [menu, setMenu] = useState(null);
  const list = (items.data || []).filter((i) => (category === 'all' || i.category === category) && (status === 'all' || (status === 'active') === i.is_active) && `${i.name} ${i.description || ''}`.toLowerCase().includes(q.toLowerCase()));
  const categories = [...new Set([...(items.data || []).map((i) => i.category).filter(Boolean)])];

  const toggle = async (item) => { setMenu(null); try { await api.patch(`/admin/reward-items/${item.id}`, { is_active: !item.is_active }); toast.success(item.is_active ? 'Moved to draft' : 'Reward is now active'); items.reload(); } catch (e) { toast.error(e.message); } };

  return (
    <StaffShell title="Reward catalog" sub="Create and manage rewards for the Bright Wings loyalty program." actions={<button type="button" className="pt-btn gold sm" onClick={() => setEdit(null)}><Plus size={16} /> Add reward</button>}>
      <Card pad={false}>
        <div className="pt-toolbar" style={{ padding: 16 }}><SearchBox value={q} onChange={setQ} placeholder="Search rewards by name or keyword…" /><Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 160 }}><option value="all">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</Select><Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 130 }}><option value="all">All status</option><option value="active">Active</option><option value="draft">Draft</option></Select></div>
        {items.error ? <ErrorState onRetry={items.reload} /> : items.loading && !items.data ? <div style={{ padding: 18 }}><Skeleton h={220} /></div> : (
          <div className="pt-table-wrap"><table className="pt-table">
            <thead><tr><th>Reward</th><th>Category</th><th>Wings cost</th><th>Stock</th><th>Validity</th><th>Status</th><th>Updated</th><th style={{ width: 40 }} /></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td><span className="pt-row" style={{ gap: 12 }}><RewardArt item={i} height={54} style={{ width: 76, borderRadius: 10, flex: 'none' }} /><span><strong>{i.name}</strong><span className="sub" style={{ maxWidth: 240 }}>{i.description}</span></span></span></td>
                  <td><Badge tone="amber">{i.category || '—'}</Badge></td>
                  <td><strong>{fmtNum(i.wings_cost)}</strong><span className="sub">Wings</span></td>
                  <td>{i.stock == null ? 'Unlimited' : i.stock}</td>
                  <td>{i.validity_days} days<span className="sub">from issue</span></td>
                  <td><Badge tone={i.is_active ? 'green' : ''} dot>{i.is_active ? 'Active' : 'Draft'}</Badge></td>
                  <td>{fmtDate(i.updated_at)}<span className="sub">by Admin</span></td>
                  <td style={{ position: 'relative' }}><button type="button" className="pt-icon-btn" aria-label="Actions" onClick={() => setMenu(menu === i.id ? null : i.id)}><MoreVertical size={17} /></button>{menu === i.id && <div className="pt-popover" style={{ width: 190, top: '70%', zIndex: 20 }}><div className="pt-menu-list" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}><button type="button" onClick={() => { setMenu(null); setEdit(i); }}>Edit reward</button><button type="button" onClick={() => toggle(i)}>{i.is_active ? 'Move to draft' : 'Activate'}</button></div></div>}</td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8}><Empty icon={Gift} title="No rewards found" action={<button type="button" className="pt-btn sm" onClick={() => setEdit(null)}>Add reward</button>}>Create your first reward for members to redeem.</Empty></td></tr>}
            </tbody>
          </table></div>
        )}
      </Card>
      {edit !== undefined && <RewardDrawer item={edit} categories={[...new Set([...CATEGORIES, ...categories])]} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); items.reload(); }} />}
    </StaffShell>
  );
}

function RewardDrawer({ item, categories, onClose, onSaved }) {
  const [f, setF] = useState({ name: item?.name || '', category: item?.category || 'Hotel Stays', wings_cost: item?.wings_cost || '', unlimited: item ? item.stock == null : true, stock: item?.stock ?? '', validity_days: item?.validity_days || 90, terms: item?.terms || '', description: item?.description || '', reward_value: item?.reward_value || '', image_file_id: item?.image_file_id || '', min_tier: item?.min_tier || 'Silver', destination: item?.destination || '', is_active: item ? item.is_active : true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef(null);
  const set = (k, v) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: undefined }); };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp(true);
    try { validateFile(file, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/jpg']); const { file_id: id } = await uploadProfileImage(file); set('image_file_id', id); toast.success('Image uploaded'); } catch (err) { toast.error(err.message || 'Upload failed'); } finally { setUp(false); e.target.value = ''; }
  };
  const save = async (asActive) => {
    const next = {};
    if (!f.name.trim()) next.name = 'Give the reward a title';
    if (!(Number(f.wings_cost) > 0)) next.wings_cost = 'Enter a Wings cost above zero';
    if (!f.unlimited && !(Number(f.stock) >= 0 && f.stock !== '')) next.stock = 'Enter the available stock';
    if (!(Number(f.validity_days) > 0)) next.validity_days = 'Enter the validity in days';
    if (!f.terms.trim()) next.terms = 'Terms & conditions are required';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = { name: f.name.trim(), category: f.category, description: f.description || undefined, wings_cost: Number(f.wings_cost), validity_days: Number(f.validity_days), terms: f.terms.trim(), reward_value: f.reward_value || undefined, min_tier: f.min_tier, destination: f.destination.trim() || undefined, image_file_id: f.image_file_id || undefined, is_active: asActive, stock: f.unlimited ? (item ? -1 : undefined) : Number(f.stock) };
    try { if (item) await api.patch(`/admin/reward-items/${item.id}`, body); else await api.post('/admin/reward-items', body); toast.success(item ? 'Reward updated' : 'Reward created'); onSaved(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} side label="Reward">
      <ModalHead title={item ? 'Edit reward' : 'Add reward'} onClose={onClose} />
      <div className="pt-stack">
        <Field label="Reward title *" error={errors.name}><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="₹500 Hotel Credit" error={errors.name} /></Field>
        <Field label="Short description" optional><Input value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Instant credit on hotel bookings" /></Field>
        <div className="pt-grid2"><Field label="Category *"><Select value={f.category} onChange={(e) => set('category', e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="Wings cost *" error={errors.wings_cost}><Input type="number" min="1" value={f.wings_cost} onChange={(e) => set('wings_cost', e.target.value)} error={errors.wings_cost} /></Field></div>
        <div className="pt-grid2"><Field label="Minimum tier" hint="Members below this tier can see the reward but not redeem it."><Select value={f.min_tier} onChange={(e) => set('min_tier', e.target.value)}>{['Silver', 'Gold', 'Platinum', 'Titanium'].map((t) => <option key={t}>{t}</option>)}</Select></Field><Field label="Destination" optional><Input value={f.destination} onChange={(e) => set('destination', e.target.value)} placeholder="Maldives" /></Field></div>
        <div className="pt-grid2"><Field label="Stock availability *" error={errors.stock}><Select value={f.unlimited ? 'unlimited' : 'limited'} onChange={(e) => set('unlimited', e.target.value === 'unlimited')}><option value="unlimited">Unlimited</option><option value="limited">Limited stock</option></Select></Field>{!f.unlimited && <Field label="Units available" error={errors.stock}><Input type="number" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} error={errors.stock} /></Field>}</div>
        <div className="pt-grid2"><Field label="Validity (days from issue) *" error={errors.validity_days}><Input type="number" min="1" value={f.validity_days} onChange={(e) => set('validity_days', e.target.value)} error={errors.validity_days} /></Field><Field label="Reward value" optional><Input value={f.reward_value} onChange={(e) => set('reward_value', e.target.value)} placeholder="₹500 booking credit" /></Field></div>
        <Field label="Terms & conditions *" error={errors.terms} hint="One condition per line — shown as bullet points to members."><TextArea value={f.terms} onChange={(e) => set('terms', e.target.value)} max={500} error={errors.terms} placeholder="Valid on hotel bookings across partner hotels.&#10;Minimum booking value ₹3,000." /></Field>
        <Field label="Reward image">
          <div className="pt-row" style={{ gap: 14 }}>{f.image_file_id ? <img src={fileUrl(f.image_file_id)} alt="" style={{ width: 96, height: 70, objectFit: 'cover', borderRadius: 10 }} /> : <RewardArt item={{ category: f.category }} height={70} style={{ width: 96, borderRadius: 10 }} />}<div><input ref={ref} type="file" hidden accept="image/png,image/jpeg" onChange={upload} /><button type="button" className="pt-btn soft sm" disabled={up} onClick={() => ref.current?.click()}><Upload size={15} /> {up ? 'Uploading…' : f.image_file_id ? 'Change image' : 'Upload image'}</button><div className="pt-tiny" style={{ marginTop: 6 }}>JPG or PNG, up to 5MB</div></div></div>
        </Field>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button>{!item || !item.is_active ? <button type="button" className="pt-btn soft" disabled={busy} onClick={() => save(false)}>Save as draft</button> : <span />}</div>
        <button type="button" className="pt-btn full" disabled={busy} onClick={() => save(true)}>{busy ? 'Saving…' : item ? 'Save reward' : 'Save & activate'}</button>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------- redemptions */

const TAB_FILTER = { pending: ['requested'], approved: ['approved', 'voucher_issued'], rejected: ['rejected', 'cancelled'], delivered: ['delivered'] };

const voucherRef = (r) => `BW-VH-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(r.display_code).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

export function Redemptions() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [params] = useSearchParams();
  const list = useAsync(() => api.get('/admin/redemptions'), []);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(params.get('open'));
  const rows = useMemo(() => list.data || [], [list.data]);
  const count = (t) => rows.filter((r) => TAB_FILTER[t].includes(r.status)).length;
  const shown = rows.filter((r) => TAB_FILTER[tab].includes(r.status) && `${r.user_name} ${r.display_code} ${r.item_name}`.toLowerCase().includes(q.toLowerCase()));
  const sel = rows.find((r) => r.id === pick) || shown[0];

  useEffect(() => { const open = rows.find((r) => r.id === params.get('open')); if (open) { setTab(Object.keys(TAB_FILTER).find((t) => TAB_FILTER[t].includes(open.status))); setPick(open.id); } }, [rows, params]);

  return (
    <StaffShell title="Redemption approvals" sub="Review and process reward redemption requests from members." actions={<SearchBox value={q} onChange={setQ} placeholder="Search by member name or request ID…" />}>
      <div className="pt-stack lg">
        <Tabs tabs={[['pending', `Pending (${count('pending')})`], ['approved', `Approved (${count('approved')})`], ['rejected', `Rejected (${count('rejected')})`], ['delivered', `Delivered (${count('delivered')})`]]} value={tab} onChange={(t) => { setTab(t); setPick(null); }} />
        {list.error ? <ErrorState onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton h={300} r={18} /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18, alignItems: 'start' }}>
            <div className="pt-stack">
              {shown.map((r) => (
                <button type="button" key={r.id} className="pt-item" style={{ borderColor: sel?.id === r.id ? '#e1a93e' : undefined, background: sel?.id === r.id ? '#fff8ea' : '#fff' }} onClick={() => setPick(r.id)}>
                  <Avatar user={{ displayName: r.user_name }} />
                  <div className="pt-item-body"><div className="pt-tiny">{r.display_code}</div><div className="pt-item-title">{r.user_name}</div><div className="pt-item-sub">{r.item_name}</div></div>
                  <div style={{ textAlign: 'right' }}><strong style={{ color: 'var(--pt-navy)' }}>{fmtNum(r.wings_cost)} Wings</strong><div><Badge tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Badge></div><div className="pt-tiny" style={{ marginTop: 3 }}>{fmtDate(r.created_at)}</div></div>
                </button>
              ))}
              {!shown.length && <Card><Empty icon={Gift} title="Nothing here">No {tab} redemptions right now.</Empty></Card>}
            </div>
            {sel && <RedemptionDetail r={sel} onChanged={list.reload} onProfile={() => navigate(`/admin/customers/${sel.user_id}`)} isAdmin={isAdmin} />}
          </div>
        )}
      </div>
    </StaffShell>
  );
}

function RedemptionDetail({ r, onChanged, onProfile, isAdmin }) {
  const [code, setCode] = useState(voucherRef(r));
  const [valid, setValid] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const validity = useAsync(() => (isAdmin ? api.get('/admin/reward-items').then((all) => all.find((i) => i.id === r.reward_item_id)?.validity_days) : Promise.resolve(null)), [r.reward_item_id, isAdmin]);
  useEffect(() => { setCode(r.voucher_code || voucherRef(r)); setValid(r.valid_till || new Date(Date.now() + (validity.data || 90) * 864e5).toISOString().slice(0, 10)); }, [r, validity.data]);

  const act = async (body, ok) => {
    setBusy(true);
    try { await api.post(`/admin/redemptions/${r.id}/status`, body); toast.success(ok); onChanged(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const open = ['requested', 'approved'].includes(r.status);
  const timeline = [['Request submitted', r.created_at], ['Approved', r.approved_at], ['Voucher issued', r.issued_at], ['Delivered', r.delivered_at]];

  return (
    <Card>
      <div className="pt-row between top wrap"><div><div className="pt-row" style={{ gap: 10 }}><h2 className="pt-h1" style={{ fontSize: 22 }}>{r.display_code}</h2><Badge tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Badge></div><div className="pt-small" style={{ marginTop: 4 }}>Requested on {fmtDateTime(r.created_at)}</div></div><button type="button" className="pt-btn ghost sm" onClick={onProfile}>View member profile</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14, margin: '16px 0' }}>
        <div className="pt-card flat pad"><h3 className="pt-h3" style={{ marginBottom: 10 }}>Member details</h3><div className="pt-row"><Avatar user={{ displayName: r.user_name }} /><div><strong style={{ color: 'var(--pt-navy)' }}>{r.user_name}</strong><div className="pt-small">Membership No. {r.membership_code} <Badge tone="gold" style={{ marginLeft: 4 }}><TierIcon tier={r.membership_tier} size={12} /> {r.membership_tier}</Badge></div></div></div><div className="pt-grid2" style={{ marginTop: 12, background: '#f6f3ea', borderRadius: 12, padding: 12 }}><div><div className="pt-tiny">Spendable balance</div><strong style={{ color: 'var(--pt-navy)' }}>{fmtNum(r.balance)} Wings</strong></div><div><div className="pt-tiny">Lifetime earnings</div><strong style={{ color: 'var(--pt-navy)' }}>{fmtNum(r.lifetime_wings)} Wings</strong></div></div></div>
        <div className="pt-card flat pad"><h3 className="pt-h3" style={{ marginBottom: 10 }}>Reward details</h3><div className="pt-row top"><RewardArt item={r} height={64} style={{ width: 84, borderRadius: 10, flex: 'none' }} /><div style={{ flex: 1 }}><strong style={{ color: 'var(--pt-navy)', fontSize: 14 }}>{r.item_name}</strong><div className="pt-small">{r.reward_value}</div></div><div style={{ textAlign: 'right' }}><div className="pt-serif" style={{ fontWeight: 700, color: 'var(--pt-gold-dark)', fontSize: 18 }}>{fmtNum(r.wings_cost)} Wings</div></div></div><div className="pt-kv" style={{ marginTop: 8 }}><span>Category</span><strong>{r.category || '—'}</strong></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
        <div>
          <h3 className="pt-h3" style={{ marginBottom: 8 }}>Ledger confirmation</h3>
          {open ? <div className="pt-notice" style={{ display: 'block' }}><div className="pt-small" style={{ marginBottom: 8 }}>{fmtNum(r.wings_cost)} Wings were debited at submission. No further debit on approval.</div><div className="pt-notice red" style={{ alignItems: 'center' }}><RupeeCoin size={30} /><div><strong style={{ margin: 0, color: 'var(--pt-red)' }}>Already debited {fmtNum(r.wings_cost)} Wings</strong>{fmtNum(r.balance)} Wings remaining available balance</div></div></div>
            : <div className="pt-notice plain" style={{ display: 'block' }}>{r.status === 'rejected' || r.status === 'cancelled' ? `${fmtNum(r.wings_cost)} Wings were refunded to the member.` : `${fmtNum(r.wings_cost)} Wings were debited when the request was submitted.`}</div>}
          <h3 className="pt-h3" style={{ margin: '16px 0 8px' }}>Delivery status</h3>
          <div className="pt-vtl">{timeline.map(([t, at], i) => <div key={t} className={`pt-vtl-row ${at ? 'done' : i === 0 ? 'now' : ''}`}><span className="pt-vtl-dot">{at && <Check size={12} strokeWidth={3} />}</span><div className="pt-vtl-body"><strong>{t}</strong><span>{at ? fmtDateTime(at) : '—'}</span></div></div>)}{r.rejected_at && <div className="pt-vtl-row bad"><span className="pt-vtl-dot"><X size={12} strokeWidth={3} /></span><div className="pt-vtl-body"><strong>Rejected</strong><span>{fmtDateTime(r.rejected_at)}</span></div></div>}</div>
        </div>
        <div>
          <h3 className="pt-h3" style={{ marginBottom: 8 }}>Voucher issuance</h3>
          <div className="pt-stack">
            <Field label="Voucher reference *"><div className="pt-row"><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={!open} /><button type="button" className="pt-icon-btn" aria-label="Generate reference" disabled={!open} onClick={() => setCode(`BW-VH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`)} style={{ border: '1px solid var(--pt-line-strong)' }}><RefreshCw size={16} /></button></div></Field>
            <Field label="Valid till *"><Input type="date" value={valid} onChange={(e) => setValid(e.target.value)} disabled={!open} /></Field>
            {open && <button type="button" className="pt-btn full" disabled={busy || !code.trim() || !valid} onClick={() => act({ status: 'voucher_issued', voucher_code: code.trim(), valid_till: valid }, 'Voucher issued')}><Check size={16} /> Approve &amp; issue</button>}
            {open && <><button type="button" className="pt-btn danger full" disabled={busy} onClick={() => setRejectOpen(true)}><X size={16} /> Reject request</button><p className="pt-tiny" style={{ color: 'var(--pt-red)', textAlign: 'center' }}>Rejecting refunds {fmtNum(r.wings_cost)} Wings once.</p></>}
            {r.status === 'voucher_issued' && <button type="button" className="pt-btn gold full" disabled={busy} onClick={() => act({ status: 'delivered' }, 'Marked as delivered')}>Mark as delivered</button>}
            {!open && r.voucher_code && <Notice icon={Check} tone="green" title={`Voucher ${r.voucher_code}`}>Valid till {fmtDate(r.valid_till)}</Notice>}
            {r.admin_note && <Notice icon={CircleAlert}>{r.admin_note}</Notice>}
          </div>
        </div>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} label="Reject request">
        <ModalHead title="Reject this request?" onClose={() => setRejectOpen(false)} />
        <p className="pt-sub">{fmtNum(r.wings_cost)} Wings will be refunded to {r.user_name} and the member is notified.</p>
        <Field label="Reason (shown to the member)"><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={300} placeholder="e.g. This reward is not available on the requested dates." /></Field>
        <div className="pt-grid2" style={{ marginTop: 16 }}><button type="button" className="pt-btn ghost" onClick={() => setRejectOpen(false)}>Cancel</button><button type="button" className="pt-btn danger" disabled={busy} onClick={async () => { await act({ status: 'rejected', admin_note: note.trim() || undefined }, 'Request rejected and Wings refunded'); setRejectOpen(false); }}>Reject &amp; refund</button></div>
      </Modal>
    </Card>
  );
}

