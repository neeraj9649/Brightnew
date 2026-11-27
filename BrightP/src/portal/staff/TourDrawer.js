import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Card, Check2, Field, Input, Modal, ModalHead, Select, TextArea } from '../ui';
import { ImagePick } from './Blog';

const featureFields = [
  { key: 'title', label: 'Card title', max: 150 },
  { key: 'text', label: 'Card description', max: 500, optional: true },
];
const rowGroups = [
  { key: 'hotels', title: 'Hotels', singular: 'hotel', hint: 'Shown in the indicative hotel cards on the detail page.', fields: featureFields, photo: true, limit: 12 },
  { key: 'travel_info', title: 'Travel information', singular: 'travel detail', hint: 'Shown as label and value pairs, such as Currency and AED.', fields: [
    { key: 'label', label: 'Label', max: 80 }, { key: 'value', label: 'Value', max: 300 },
  ], limit: 20 },
  { key: 'activities', title: 'Activities', singular: 'activity', hint: 'Shown below Hotels and Travel Information. The first activity with a photo is also shown beside the overview.', fields: featureFields, photo: true, limit: 12 },
  { key: 'faqs', title: 'FAQs', singular: 'FAQ', hint: 'Shown as expandable questions and answers at the bottom of the detail page.', fields: [
    { key: 'question', label: 'Question', max: 300 }, { key: 'answer', label: 'Answer', max: 5000, multiline: true },
  ], limit: 20 },
];

const lines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);
const withKeys = (rows = []) => rows.map((row) => ({ ...row, key: crypto.randomUUID() }));
const stripKeys = (rows) => rows.map(({ key, ...row }) => row);
const blankRow = ({ fields, photo }) => ({
  ...Object.fromEntries(fields.map(({ key }) => [key, ''])),
  ...(photo ? { image: '' } : {}),
});

function initialForm(tour) {
  const content = tour?.presentation;
  return {
    package_type: tour?.package_type || '',
    title: tour?.title || '',
    headline: tour?.headline || '',
    location: tour?.location || '',
    duration: tour?.duration || '',
    activity_type: tour?.activity_type || '',
    audience: content?.audience || '',
    summary: content?.summary || '',
    card_image: tour?.card_image || '',
    hero_image: content?.hero_image || '',
    slider_images: withKeys(tour?.slider_images?.map((url) => ({ url }))),
    overview: tour?.overview || '',
    highlights: (tour?.highlights || []).join('\n'),
    hotels: withKeys(content?.hotels),
    travel_info: withKeys(content?.travel_info),
    activities: withKeys(content?.activities),
    faqs: withKeys(tour?.faqs),
    is_featured: tour?.is_featured || false,
    is_published: tour?.is_published || false,
    sort_order: tour?.sort_order ?? 0,
  };
}

function FormSection({ title, children }) {
  return <Card><div className="pt-stack"><h3 className="pt-h3">{title}</h3>{children}</div></Card>;
}

function RepeatableFields({ group, rows, add, update, remove, onUploadChange }) {
  return (
    <FormSection title={group.title}>
      <p className="pt-hint">{group.hint}</p>
      {rows.map((row, index) => (
        <div key={row.key} className="pt-stack" style={{ padding: 12, border: '1px solid var(--pt-line)', borderRadius: 12 }}>
          <div className="pt-row between">
            <strong>{group.singular} {index + 1}</strong>
            <button type="button" className="pt-icon-btn" aria-label={`Remove ${group.singular} ${index + 1}`} onClick={() => remove(row.key)}><Trash2 size={16} /></button>
          </div>
          {group.fields.map(({ key, label, max, optional, multiline }) => (
            <Field key={key} label={label} optional={optional}>
              {multiline
                ? <TextArea aria-label={label} value={row[key]} onChange={(e) => update(row.key, key, e.target.value)} max={max} rows={3} />
                : <Input aria-label={label} value={row[key]} onChange={(e) => update(row.key, key, e.target.value)} maxLength={max} />}
            </Field>
          ))}
          {group.photo && <Field label="Card photo" optional><ImagePick value={row.image} label={`${group.singular} photo`} onChange={(url) => update(row.key, 'image', url)} onUploadChange={onUploadChange} /></Field>}
        </div>
      ))}
      {rows.length < group.limit && <button type="button" className="pt-btn soft sm" onClick={() => add(blankRow(group))}><Plus size={15} /> Add {group.singular}</button>}
    </FormSection>
  );
}

export default function TourDrawer({ tour, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(tour));
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const bind = (key, label) => ({ 'aria-label': label, value: form[key], onChange: (event) => set(key, event.target.value) });
  const changeUploads = (uploading) => setUploads((count) => count + (uploading ? 1 : -1));
  const changeRows = (group, update) => setForm((current) => ({ ...current, [group]: update(current[group]) }));
  const addRow = (group, row) => {
    const key = crypto.randomUUID();
    changeRows(group, (rows) => [...rows, { ...row, key }]);
  };
  const removeRow = (group, key) => changeRows(group, (rows) => rows.filter((row) => row.key !== key));
  const updateRow = (group, key, field, value) => changeRows(group, (rows) => rows.map((row) => row.key === key ? { ...row, [field]: value } : row));

  const save = async (event) => {
    event.preventDefault();
    if (busy || uploads) return;
    if (!form.card_image) {
      setError('Upload the package card image.');
      return;
    }
    setError('');
    setBusy(true);
    const body = {
      ...tour,
      package_type: form.package_type, title: form.title, headline: form.headline, location: form.location,
      duration: form.duration, activity_type: form.activity_type, card_image: form.card_image,
      slider_images: form.slider_images.map(({ url }) => url), overview: form.overview, highlights: lines(form.highlights),
      faqs: stripKeys(form.faqs), is_published: form.is_published, is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
      presentation: {
        summary: form.summary, hero_image: form.hero_image, audience: form.audience,
        hotels: stripKeys(form.hotels), activities: stripKeys(form.activities), travel_info: stripKeys(form.travel_info),
      },
    };
    try {
      if (tour) await api.put(`/admin/tours/items/${tour.id}`, body);
      else await api.post('/admin/tours/items', body);
      toast.success(form.is_published ? 'Package published' : 'Package saved as a draft');
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the package.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} side label="Tour package" className={tour ? 'tour-drawer tour-drawer-edit' : 'tour-drawer'}>
      <ModalHead title={tour ? 'Edit package' : 'New tour package'} sub="Fields follow the order visitors see on the website." onClose={onClose} />
      <form onSubmit={save}>
        <fieldset disabled={busy} className="pt-stack" style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <FormSection title="Package card">
            <Field label="Package type" hint="Individual packages appear in Experiences. Holiday packages appear in Holiday Packages.">
              <Select {...bind('package_type', 'Package type')} required><option value="">Choose package type</option><option value="individual">Individual package</option><option value="holiday">Holiday package</option></Select>
            </Field>
            <Field label="Card title" hint="Shown on listing cards and used as the detail heading when no page title is entered.">
              <Input {...bind('title', 'Card title')} required maxLength={200} />
            </Field>
            <Field label="Card image" hint="Shown on listing cards. Also used in the detail hero if no separate hero image is uploaded.">
              <ImagePick value={form.card_image} onChange={(url) => set('card_image', url)} label="card image" onUploadChange={changeUploads} />
            </Field>
            <Field label="Short description" optional hint="Shown on the listing card and below the title on the detail page.">
              <Input {...bind('summary', 'Short description')} maxLength={500} />
            </Field>
          </FormSection>
          <FormSection title="Detail heading and photos">
            <Field label="Page title" optional hint="The main heading on the detail page.">
              <Input {...bind('headline', 'Page title')} maxLength={300} />
            </Field>
            <div className="pt-grid2">
              <Field label="Location" optional hint="Shown above the heading, on listing cards, and used for destination filters. Choose Dubai, Thailand, or Jaipur to list the package on its destination page.">
                <Input {...bind('location', 'Location')} maxLength={120} list="tour-destinations" placeholder="Choose or enter a location" />
                <datalist id="tour-destinations">
                  <option value="Dubai" />
                  <option value="Thailand" />
                  <option value="Jaipur" />
                </datalist>
              </Field>
              <Field label="Duration" optional hint="Shown on listing cards and under the heading. Start with a number for duration sorting.">
                <Input {...bind('duration', 'Duration')} maxLength={120} placeholder="5 days / 4 nights" />
              </Field>
              <Field label="Category" optional hint="Shown under the heading and on listing cards.">
                <Input {...bind('activity_type', 'Category')} maxLength={120} placeholder="City, Desert & Leisure" />
              </Field>
              <Field label="Best for" optional hint="Shown under the heading.">
                <Input {...bind('audience', 'Best for')} maxLength={120} placeholder="Families & couples" />
              </Field>
            </div>
            <Field label="Hero background" optional hint="The wide image behind the heading and photo gallery.">
              <ImagePick value={form.hero_image} onChange={(url) => set('hero_image', url)} label="hero image" onUploadChange={changeUploads} />
            </Field>
            <Field label="Gallery photos" optional hint="Shown beside the detail heading and in the full-screen gallery, in upload order. Up to 12 photos.">
              <div className="pt-stack">
                {form.slider_images.map(({ key, url }, index) => (
                  <ImagePick key={key} value={url} onChange={(next) => next ? updateRow('slider_images', key, 'url', next) : removeRow('slider_images', key)} label={`gallery photo ${index + 1}`} onUploadChange={changeUploads} />
                ))}
                {form.slider_images.length < 12 && <ImagePick value="" onChange={(url) => url && addRow('slider_images', { url })} label="a gallery photo" onUploadChange={changeUploads} />}
              </div>
            </Field>
          </FormSection>
          <FormSection title="Package overview">
            <Field label="Overview" optional hint="Shown below the tabs.">
              <TextArea {...bind('overview', 'Overview')} rows={5} max={20000} />
            </Field>
            <Field label="Highlights" optional hint="Shown below the overview. Enter one highlight per line.">
              <TextArea {...bind('highlights', 'Highlights')} rows={3} />
            </Field>
          </FormSection>
          {rowGroups.map((group) => (
            <RepeatableFields key={group.key} group={group} rows={form[group.key]}
              add={(row) => addRow(group.key, row)}
              remove={(key) => removeRow(group.key, key)}
              update={(key, field, value) => updateRow(group.key, key, field, value)}
              onUploadChange={changeUploads} />
          ))}
          <FormSection title="Publishing">
            <Field label="Display order" hint="Lower numbers appear first in website listings.">
              <Input type="number" {...bind('sort_order', 'Display order')} />
            </Field>
            <Check2 checked={form.is_featured} onChange={(value) => set('is_featured', value)}>
              {form.package_type === 'holiday' ? 'Feature on the matching destination page' : 'Feature in the home page Experiences section'}
            </Check2>
            <Check2 checked={form.is_published} onChange={(value) => set('is_published', value)}>Publish on the website</Check2>
          </FormSection>
          {error && <p role="alert" className="pt-err-text">{error}</p>}
          <div className="pt-grid2">
            <button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="pt-btn" disabled={busy || uploads > 0}>{busy ? 'Saving…' : uploads ? 'Uploading photos…' : form.is_published ? 'Save and publish' : 'Save draft'}</button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
