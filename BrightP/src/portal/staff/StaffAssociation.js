import React, { useState } from 'react';
import { Check, Copy, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Badge, Card, Field, Modal, ModalHead, Notice, Select, Skeleton, fmtNum, useAsync, useCopy } from '../ui';

export const SOURCE_LABEL = { staff_added: 'Added by this staff member', staff_code: 'Signed up with the staff code', referral: 'Joined through a referral', admin: 'Assigned by an admin' };

/** "Anita" or a "Not assigned" badge. */
export function StaffBadge({ name }) {
  return name ? <span>{name}</span> : <Badge tone="amber">Not assigned</Badge>;
}

/** The signed-in staff member's own code: customers who sign up with it are associated with them. */
export function StaffCodeCard() {
  const { data } = useAsync(() => api.get('/referrals/me').catch(() => null), []);
  const { copied, copy } = useCopy();
  const code = data?.referral_code;
  if (!code) return null;
  const link = `${window.location.origin}/auth?ref=${encodeURIComponent(code)}`;
  const share = async (text, key, msg) => { if (await copy(text, key)) toast.success(msg); else toast.error('Copy is not available in this browser'); };
  return (
    <Card style={{ marginBottom: 18 }}>
      <div className="pt-row between wrap" style={{ gap: 16 }}>
        <div className="pt-row" style={{ gap: 14 }}>
          <span className="pt-item-icon round" style={{ background: '#f6f2e9' }}><UserCheck size={22} /></span>
          <div><div className="pt-small">Your staff code</div><strong style={{ fontSize: 26, letterSpacing: '0.14em', color: 'var(--pt-navy)' }}>{code}</strong><div className="pt-tiny" style={{ marginTop: 2 }}>Customers who enter this code when they join become your customers.</div></div>
        </div>
        <div className="pt-row" style={{ gap: 10 }}>
          <button type="button" className="pt-btn ghost sm" onClick={() => share(code, 'code', 'Code copied')}>{copied === 'code' ? <Check size={15} /> : <Copy size={15} />} Copy code</button>
          <button type="button" className="pt-btn sm" onClick={() => share(link, 'link', 'Sign-up link copied')}>{copied === 'link' ? <Check size={15} /> : <Copy size={15} />} Copy sign-up link</button>
        </div>
      </div>
    </Card>
  );
}

/** Admin: associate one or many customers with a staff member. `customers` = [{ id, name, staff_name }]. */
export function AssignStaffModal({ open, customers, onClose, onDone }) {
  const staff = useAsync(() => (open ? api.get('/admin/portal/staff') : Promise.resolve([])), [open]);
  const [staffId, setStaffId] = useState('');
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [busy, setBusy] = useState(false);
  const many = customers.length > 1;
  const assigned = customers.filter((c) => c.staff_name).length;
  const save = async () => {
    setBusy(true);
    try {
      if (many) {
        const r = await api.post('/admin/portal/customers/assign-staff', { customer_ids: customers.map((c) => c.id), staff_id: staffId, only_unassigned: onlyUnassigned });
        toast.success(`${fmtNum(r.assigned)} customer${r.assigned === 1 ? '' : 's'} assigned`);
      } else {
        await api.put(`/admin/portal/customers/${customers[0].id}/staff`, { staff_id: staffId || null });
        toast.success(staffId ? 'Staff member assigned' : 'Association removed');
      }
      setStaffId('');
      onDone();
    } catch (e) { toast.error(e.message || 'Could not assign'); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} label="Assign staff">
      <ModalHead title={many ? `Assign ${customers.length} customers` : 'Assign staff'} sub={many ? 'They will be looked after by the staff member you choose.' : `${customers[0]?.name || ''}${customers[0]?.staff_name ? ` is currently with ${customers[0].staff_name}.` : ' is not associated with anyone yet.'}`} onClose={onClose} />
      <div className="pt-stack">
        {staff.loading && !staff.data ? <Skeleton h={50} /> : (
          <Field label="Staff member"><Select value={staffId} onChange={(e) => setStaffId(e.target.value)}><option value="">{many ? 'Choose a staff member…' : 'No one (remove association)'}</option>{(staff.data || []).map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role === 'employee' ? 'Employee' : 'Admin'} ({fmtNum(s.customers)} customers)</option>)}</Select></Field>
        )}
        {many && assigned > 0 && (
          <label className="pt-check"><input type="checkbox" checked={onlyUnassigned} onChange={(e) => setOnlyUnassigned(e.target.checked)} /><span className="box">{onlyUnassigned ? '✓' : ''}</span><span>Keep the {assigned} that already have a staff member</span></label>
        )}
        <Notice icon={UserCheck}>New booking requests from these customers go to the staff member. Bookings that already exist are not moved.</Notice>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={busy || (many && !staffId)} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></div>
      </div>
    </Modal>
  );
}
