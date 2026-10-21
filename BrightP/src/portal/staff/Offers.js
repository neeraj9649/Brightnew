import React, { useRef, useState } from 'react';
import { Pencil, Plus, Tag, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { fileUrl, uploadProfileImage, validateFile } from '../../services/storage';
import { Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, Select, Skeleton, TextArea, fmtDate, useAsync } from '../ui';
import { SERVICES, SERVICE_ORDER } from '../booking';
import StaffShell from './StaffShell';

const today = () => new Date().toISOString().slice(0, 10);

function state(o) {
  if (!o.is_active) return ['Paused', ''];
  if (o.valid_until && o.valid_until < today()) return ['Expired', 'red'];
  if (o.valid_from && o.valid_from > today()) return ['Scheduled', 'amber'];
  return ['Live', 'green'];
}

export default function Offers() {
  const { data, loading, error, reload } = useAsync(() => api.get('/portal/staff/offers'), []);
  const [edit, setEdit] = useState(undefined); // undefined = closed, null = new, object = editing
  const remove = async (o) => {
    if (!window.confirm(`Delete “${o.title}”? Customers will no longer see it.`)) return;
    try { await api.delete(`/portal/staff/offers/${o.id}`); toast.success('Offer deleted'); reload(); } catch (e) { toast.error(e.message || 'Could not delete'); }
  };
  const toggle = async (o) => {
    try { await api.put(`/portal/staff/offers/${o.id}`, { ...o, is_active: !o.is_active }); reload(); } catch (e) { toast.error(e.message || 'Could not update'); }
  };
  const offers = data || [];
  return (
    <StaffShell active="offers" title="Offers" sub="Offers you publish here appear in every customer's portal while they are live."
      actions={<button type="button" className="pt-btn" onClick={() => setEdit(null)}><Plus size={17} /> New offer</button>}>
      {loading && !data ? <Skeleton h={220} /> : error ? <ErrorState onRetry={reload} /> : !offers.length ? (
        <Card><Empty icon={Tag} title="No offers yet" action={<button type="button" className="pt-btn" onClick={() => setEdit(null)}>Create the first offer</button>}>Add a deal, a seasonal package or a member perk. Customers see it on their home page.</Empty></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {offers.map((o) => {
            const [label, tone] = state(o);
            return (
              <Card key={o.id} pad={false}>
                <div style={{ height: 140, background: o.image_file_id ? `center / cover url(${fileUrl(o.image_file_id)})` : 'linear-gradient(135deg, #10283f, #c9963e)', borderRadius: '16px 16px 0 0', position: 'relative' }}>
                  {o.badge && <span className="pt-badge gold" style={{ position: 'absolute', left: 12, top: 12 }}>{o.badge}</span>}
                  <span style={{ position: 'absolute', right: 12, top: 12 }}><Badge tone={tone}>{label}</Badge></span>
                </div>
                <div style={{ padding: 16 }}>
                  <strong style={{ fontSize: 16, color: 'var(--pt-navy)' }}>{o.title}</strong>
                  {o.description && <p className="pt-sub" style={{ margin: '6px 0 0', fontSize: 13 }}>{o.description}</p>}
                  <div className="pt-tiny" style={{ marginTop: 8 }}>{o.code ? <>Code <b>{o.code}</b> · </> : null}{o.valid_from ? `From ${fmtDate(o.valid_from)} · ` : ''}{o.valid_until ? `Until ${fmtDate(o.valid_until)}` : 'No end date'}</div>
                  <div className="pt-row" style={{ gap: 8, marginTop: 12 }}>
                    <button type="button" className="pt-btn ghost sm" onClick={() => setEdit(o)}><Pencil size={14} /> Edit</button>
                    <button type="button" className="pt-btn ghost sm" onClick={() => toggle(o)}>{o.is_active ? 'Pause' : 'Publish'}</button>
                    <button type="button" className="pt-icon-btn" aria-label="Delete offer" onClick={() => remove(o)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {edit !== undefined && <OfferDrawer offer={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); reload(); }} />}
    </StaffShell>
  );
}

function OfferDrawer({ offer, onClose, onSaved }) {
  const [f, setF] = useState({
    title: offer?.title || '', description: offer?.description || '', badge: offer?.badge || '', code: offer?.code || '', image_file_id: offer?.image_file_id || '',
    service_type: offer?.service_type || '', valid_from: offer?.valid_from || '', valid_until: offer?.valid_until || '', is_active: offer ? offer.is_active : true,
  });
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
  const save = async () => {
    const next = {};
    if (f.title.trim().length < 3) next.title = 'Give the offer a title';
    if (f.valid_from && f.valid_until && f.valid_until < f.valid_from) next.valid_until = 'The end date is before the start date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = { title: f.title.trim(), description: f.description || null, badge: f.badge || null, code: f.code || null, image_file_id: f.image_file_id || null, service_type: f.service_type || null, valid_from: f.valid_from || null, valid_until: f.valid_until || null, is_active: f.is_active };
    try { if (offer) await api.put(`/portal/staff/offers/${offer.id}`, body); else await api.post('/portal/staff/offers', body); toast.success(offer ? 'Offer updated' : 'Offer published'); onSaved(); } catch (err) { toast.error(err.message || 'Could not save'); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} side label="Offer">
      <ModalHead title={offer ? 'Edit offer' : 'New offer'} sub="Customers see this on their home page and Offers page while it is live." onClose={onClose} />
      <div className="pt-stack">
        <Field label="Title *" error={errors.title}><Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Dubai escape — flights + 3 nights" error={errors.title} maxLength={120} /></Field>
        <Field label="Details" optional><TextArea value={f.description} onChange={(e) => set('description', e.target.value)} max={1000} placeholder="What is included, who it is for, any conditions" /></Field>
        <div className="pt-grid2">
          <Field label="Badge" optional hint="Short label, e.g. 15% OFF"><Input value={f.badge} onChange={(e) => set('badge', e.target.value)} maxLength={40} placeholder="15% OFF" /></Field>
          <Field label="Offer code" optional><Input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} maxLength={40} placeholder="DXB15" /></Field>
        </div>
        <Field label="Service" optional hint="Lets the customer start a request for this service from the offer."><Select value={f.service_type} onChange={(e) => set('service_type', e.target.value)}><option value="">Any / not specific</option>{SERVICE_ORDER.map((t) => <option key={t} value={t}>{SERVICES[t].label}</option>)}</Select></Field>
        <div className="pt-grid2">
          <Field label="Starts" optional><Input type="date" value={f.valid_from} onChange={(e) => set('valid_from', e.target.value)} /></Field>
          <Field label="Ends" optional error={errors.valid_until}><Input type="date" value={f.valid_until} min={f.valid_from || undefined} onChange={(e) => set('valid_until', e.target.value)} error={errors.valid_until} /></Field>
        </div>
        <Field label="Image" optional>
          <div className="pt-row" style={{ gap: 14 }}>
            {f.image_file_id ? <img src={fileUrl(f.image_file_id)} alt="" style={{ width: 110, height: 70, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ width: 110, height: 70, borderRadius: 10, background: 'linear-gradient(135deg, #10283f, #c9963e)' }} />}
            <div><input ref={ref} type="file" hidden accept="image/png,image/jpeg" onChange={upload} /><button type="button" className="pt-btn soft sm" disabled={up} onClick={() => ref.current?.click()}><Upload size={15} /> {up ? 'Uploading…' : f.image_file_id ? 'Change image' : 'Upload image'}</button><div className="pt-tiny" style={{ marginTop: 6 }}>JPG or PNG, up to 5MB</div></div>
          </div>
        </Field>
        <label className="pt-check"><input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /><span className="box">{f.is_active ? '✓' : ''}</span><span>Published — visible to customers (within the dates above)</span></label>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : offer ? 'Save changes' : 'Publish offer'}</button></div>
      </div>
    </Modal>
  );
}
