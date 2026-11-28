import React, { useState } from 'react';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, Skeleton, useAsync } from '../ui';
import StaffShell from './StaffShell';
import { ImagePick } from './Blog';

const endpoint = '/admin/website-services';
const kinds = {
  flights: 'Flight Arrangements', hotels: 'Hotel & Stay', tours: 'Tour Plan',
  transfers: 'Airport Transfers', activities: 'Activities', visa: 'Visa Assistance', general: 'General service',
};
const blank = { slug: '', kind: 'general', title: '', description: '', image: '', secondary_image: '', offers: [], benefits: [], sort_order: 0, is_published: false };
const lineList = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);

function ServiceEditor({ service, onClose, onSaved }) {
  const [form, setForm] = useState(service || blank);
  const [offers, setOffers] = useState(() => (service?.offers || []).map((item) => ({ ...item, key: crypto.randomUUID() })));
  const [benefits, setBenefits] = useState((service?.benefits || []).join('\n'));
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const changeUploads = (uploading) => setUploads((count) => count + (uploading ? 1 : -1));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const editOffer = (key, field, value) => setOffers((rows) => rows.map((row) => row.key === key ? { ...row, [field]: value } : row));

  const save = async (event) => {
    event.preventDefault();
    if (busy || uploads) return;
    const payload = { ...form, offers: offers.map(({ key, ...offer }) => offer), benefits: lineList(benefits) };
    setBusy(true);
    try {
      if (service) await api.put(`${endpoint}/${encodeURIComponent(service.slug)}`, payload);
      else await api.post(endpoint, payload);
      toast.success(form.is_published ? 'Service published' : 'Service saved as a draft');
      onSaved();
    } catch (error) {
      toast.error(error.message || 'Could not save the service');
    } finally {
      setBusy(false);
    }
  };

  return <Modal open side onClose={() => { if (!busy && !uploads) onClose(); }} label={service ? 'Edit service' : 'New service'}>
    <ModalHead title={service ? 'Edit service' : 'New service'} onClose={() => { if (!busy && !uploads) onClose(); }} />
    <form onSubmit={save} className="pt-stack" style={{ gap: 16, padding: 20 }}>
      <Field label="Service title" hint="Shown on the homepage card and in the detail hero.">
        <Input required maxLength={120} value={form.title} onChange={(event) => set('title', event.target.value)} />
      </Field>
      <Field label="Page URL slug" hint="Use lowercase letters, numbers and hyphens. The slug becomes part of the public URL.">
        <Input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} readOnly={Boolean(service)} value={form.slug} onChange={(event) => set('slug', event.target.value)} />
      </Field>
      <Field label="Service type" hint="Controls the icon, default images and enquiry fields.">
        <select className="pt-input" value={form.kind} onChange={(event) => set('kind', event.target.value)}>
          {Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </Field>
      <Field label="Description" hint="Shown under the title on the card and detail page.">
        <textarea className="pt-input" required rows={3} maxLength={800} value={form.description} onChange={(event) => set('description', event.target.value)} />
      </Field>
      <Field label="Card and hero image" optional hint="Leave empty to use the service type’s default photo.">
        <ImagePick label="Service hero photo" value={form.image} onChange={(url) => set('image', url)} onUploadChange={changeUploads} />
      </Field>
      <Field label="Benefits image" optional hint="Shown behind the benefits section.">
        <ImagePick label="Benefits photo" value={form.secondary_image} onChange={(url) => set('secondary_image', url)} onUploadChange={changeUploads} />
      </Field>
      <div className="pt-stack" style={{ gap: 12 }}>
        <h3>What We Offer</h3>
        {offers.map((offer) => <Card key={offer.key}>
          <Field label="Offer title"><Input required maxLength={100} value={offer.title} onChange={(event) => editOffer(offer.key, 'title', event.target.value)} /></Field>
          <Field label="Offer description" optional><textarea className="pt-input" rows={2} maxLength={400} value={offer.description} onChange={(event) => editOffer(offer.key, 'description', event.target.value)} /></Field>
          <Field label="Offer image" optional><ImagePick label="Offer photo" value={offer.image || ''} onChange={(url) => editOffer(offer.key, 'image', url)} onUploadChange={changeUploads} /></Field>
          <button type="button" className="pt-btn ghost sm" onClick={() => setOffers((rows) => rows.filter((row) => row.key !== offer.key))}>Remove offer</button>
        </Card>)}
        <button type="button" className="pt-btn ghost sm" disabled={offers.length >= 12} onClick={() => setOffers((rows) => [...rows, { key: crypto.randomUUID(), title: '', description: '', image: '' }])}><Plus size={15} /> Add offer</button>
      </div>
      <Field label="Benefits" optional hint="Add one benefit per line. These appear under Why Choose Bright Wings?">
        <textarea className="pt-input" rows={5} value={benefits} onChange={(event) => setBenefits(event.target.value)} />
      </Field>
      <Field label="Display order" hint="Lower numbers appear first on the homepage.">
        <Input type="number" required min={0} value={form.sort_order} onChange={(event) => set('sort_order', Number(event.target.value))} />
      </Field>
      <label className="pt-row" style={{ gap: 8 }}><input type="checkbox" checked={form.is_published} onChange={(event) => set('is_published', event.target.checked)} /> Show on the website</label>
      <button type="submit" className="pt-btn" disabled={busy || uploads > 0}>{busy ? 'Saving…' : uploads ? 'Uploading…' : form.is_published ? 'Save and publish' : 'Save draft'}</button>
    </form>
  </Modal>;
}

export default function WebsiteServices() {
  const list = useAsync(() => api.get(endpoint), []);
  const [editing, setEditing] = useState(undefined);

  return <StaffShell active="website-services" title="Website Services" sub="Manage service cards and detail pages on the public website."
    actions={<button type="button" className="pt-btn" onClick={() => setEditing(null)}><Plus size={17} /> New service</button>}>
    {list.loading && <Skeleton />}
    {list.error && <ErrorState onRetry={list.reload}>{list.error}</ErrorState>}
    {list.data?.length === 0 && <Empty title="No services yet" />}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16 }}>
      {list.data?.map((service) => <Card key={service.slug}>
        <Badge tone={service.is_published ? 'green' : 'muted'}>{service.is_published ? 'Published' : 'Draft'}</Badge>
        <h2 style={{ margin: '12px 0 6px' }}>{service.title}</h2>
        <p className="pt-tiny">{service.description}</p>
        <div className="pt-row" style={{ gap: 8, marginTop: 14 }}>
          <button type="button" className="pt-btn ghost sm" onClick={() => setEditing(service)}><Pencil size={15} /> Edit</button>
          {service.is_published && <a className="pt-btn ghost sm" href={`https://brightwingstravel.com/services/${encodeURIComponent(service.slug)}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View</a>}
        </div>
      </Card>)}
    </div>
    {editing !== undefined && <ServiceEditor service={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); list.reload(); }} />}
  </StaffShell>;
}
