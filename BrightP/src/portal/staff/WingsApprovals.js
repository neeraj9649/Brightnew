import React, { useState } from 'react';
import { BadgeCheck, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Badge, Card, Empty, ErrorState, Field, Modal, ModalHead, Segmented, Skeleton, TextArea, fmtDateTime, fmtNum, useAsync } from '../ui';
import StaffShell from './StaffShell';

const TONE = { pending: 'amber', approved: 'green', rejected: 'red' };

export default function WingsApprovals() {
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useAsync(() => api.get(`/admin/portal/wings-requests?status=${status}`), [status]);
  const [reject, setReject] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const approve = async (r) => {
    setBusy(r.id);
    try { await api.post(`/admin/portal/wings-requests/${r.id}/approve`, {}); toast.success(`${fmtNum(r.points)} Wings added to ${r.customer_name}`); reload(); } catch (e) { toast.error(e.message || 'Could not approve'); reload(); } finally { setBusy(''); }
  };
  const decline = async () => {
    setBusy(reject.id);
    try { await api.post(`/admin/portal/wings-requests/${reject.id}/reject`, { note: note.trim() || undefined }); toast.success('Request declined'); setReject(null); setNote(''); reload(); } catch (e) { toast.error(e.message || 'Could not decline'); } finally { setBusy(''); }
  };
  const rows = data || [];
  return (
    <StaffShell active="approvals" title="Wings approvals" sub="Extra Wings entered by staff wait here until an admin approves them. The standard Wings per service are credited automatically.">
      <div style={{ marginBottom: 16 }}><Segmented options={[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Declined']]} value={status} onChange={setStatus} /></div>
      {loading && !data ? <Skeleton h={160} /> : error ? <ErrorState onRetry={reload} /> : !rows.length ? (
        <Card><Empty icon={BadgeCheck} title={status === 'pending' ? 'Nothing waiting for approval' : 'Nothing here yet'}>{status === 'pending' ? 'When a staff member asks for extra Wings on a booking it will appear here.' : 'Requests you review will be listed here.'}</Empty></Card>
      ) : (
        <Card pad={false}>
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead><tr><th>Customer</th><th>Booking</th><th>Wings</th><th>Reason</th><th>Requested by</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.customer_name}</strong><span className="sub">{r.customer_code}</span></td>
                    <td>{r.booking_code || '—'}</td>
                    <td><strong>+{fmtNum(r.points)}</strong></td>
                    <td style={{ maxWidth: 260 }}>{r.reason}{r.review_note && <span className="sub">Note: {r.review_note}</span>}</td>
                    <td>{r.requested_by_name}<span className="sub">{fmtDateTime(r.created_at)}</span></td>
                    <td><Badge tone={TONE[r.status]}>{r.status === 'rejected' ? 'Declined' : r.status[0].toUpperCase() + r.status.slice(1)}</Badge>{r.reviewed_by_name && <span className="sub">{r.reviewed_by_name}</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {r.status === 'pending' && (
                        <span className="pt-row" style={{ gap: 8 }}>
                          <button type="button" className="pt-btn sm" disabled={busy === r.id} onClick={() => approve(r)}><Check size={15} /> Approve</button>
                          <button type="button" className="pt-btn ghost sm" disabled={busy === r.id} onClick={() => { setReject(r); setNote(''); }}><X size={15} /> Decline</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Modal open={!!reject} onClose={() => setReject(null)} label="Decline request">
        <ModalHead title="Decline this request?" sub={reject ? `${fmtNum(reject.points)} Wings for ${reject.customer_name} — nothing will be credited.` : ''} onClose={() => setReject(null)} />
        <div className="pt-stack">
          <Field label="Note for the staff member" optional><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={300} placeholder="Why it was declined" /></Field>
          <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={() => setReject(null)}>Keep pending</button><button type="button" className="pt-btn danger" disabled={busy === reject?.id} onClick={decline}>Decline request</button></div>
        </div>
      </Modal>
    </StaffShell>
  );
}
