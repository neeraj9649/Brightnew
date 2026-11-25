import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Map as MapIcon, MessageSquare, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Badge, Card, Check2, Empty, ErrorState, Field, Input, Modal, ModalHead, Select, Skeleton, Tabs, TextArea, fmtDateTime, useAsync } from '../ui';
import StaffShell from './StaffShell';
import { ImagePick } from './Blog';

// Tours appear on the public website (Tours list, home page, tour pages).
const WEBSITE = 'https://brightwingstravel.com';
const tourLink = (slug) => `${WEBSITE}/tour/${encodeURIComponent(slug)}/`;
const PAGE = 15;

/** "Showing 16–30 of 42" with previous / next buttons. */
function Pager({ offset, total, onChange }) {
  if (total <= PAGE) return null;
  return (
    <div className="pt-row between" style={{ marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
      <span className="pt-tiny">Showing {offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
      <div className="pt-row" style={{ gap: 8 }}>
        <button type="button" className="pt-btn ghost sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - PAGE))}><ChevronLeft size={15} /> Previous</button>
        <button type="button" className="pt-btn ghost sm" disabled={offset + PAGE >= total} onClick={() => onChange(offset + PAGE)}>Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

const Stars = ({ n }) => <span style={{ color: '#f7921e', whiteSpace: 'nowrap' }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} fill={i <= n ? '#f7921e' : 'none'} />)}</span>;

/** Admin: create and edit the website's tours, approve visitors' reviews. */
export default function Tours() {
  const [tab, setTab] = useState('tours');
  const [offset, setOffset] = useState(0);
  const list = useAsync(() => api.get(`/admin/tours/items?limit=${PAGE}&offset=${offset}`), [offset]);
  const [edit, setEdit] = useState(undefined); // undefined = closed, null = new, object = editing
  const pending = list.data?.pending_reviews || 0;

  const save = async (t, patch) => {
    try { await api.put(`/admin/tours/items/${t.id}`, { ...t, ...patch }); list.reload(); } catch (e) { toast.error(e.message || 'Could not update'); }
  };

  return (
    <StaffShell active="tours" title="Tours" sub="Tours you publish here appear on the website's Tours page. Visitors' reviews show only after you approve them."
      actions={tab === 'tours' && <button type="button" className="pt-btn" onClick={() => setEdit(null)}><Plus size={17} /> New tour</button>}>
      <div style={{ marginBottom: 18 }}>
        <Tabs value={tab} onChange={setTab} tabs={[['tours', 'Tours'], ['reviews', pending ? `Reviews (${pending} waiting)` : 'Reviews']]} />
      </div>
      {tab === 'reviews' ? <Reviews onChange={list.reload} /> : list.loading && !list.data ? <Skeleton h={220} /> : list.error ? <ErrorState onRetry={list.reload} /> : !list.data.items.length ? (
        <Card><Empty icon={MapIcon} title="No tours yet" action={<button type="button" className="pt-btn" onClick={() => setEdit(null)}>Add the first tour</button>}>Add a tour with photos, highlights and a day-by-day plan.</Empty></Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>
            {list.data.items.map((t) => (
              <Card key={t.id} pad={false}>
                <div style={{ height: 150, background: `center / cover url(${t.card_image})`, borderRadius: '16px 16px 0 0', position: 'relative' }}>
                  <span style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 6 }}>
                    {t.is_featured && <Badge tone="gold">Home page</Badge>}
                    <Badge tone={t.is_published ? 'green' : ''}>{t.is_published ? 'Published' : 'Hidden'}</Badge>
                  </span>
                </div>
                <div style={{ padding: 16 }}>
                  <strong style={{ fontSize: 16, color: 'var(--pt-navy)' }}>{t.title}</strong>
                  <div className="pt-tiny" style={{ marginTop: 6 }}>{t.location}{Number(t.pending_reviews) ? <> · <b>{t.pending_reviews} review{Number(t.pending_reviews) > 1 ? 's' : ''} waiting</b></> : null}</div>
                  <div className="pt-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="pt-btn ghost sm" onClick={() => setEdit(t)}><Pencil size={14} /> Edit</button>
                    <button type="button" className="pt-btn ghost sm" onClick={() => save(t, { is_published: !t.is_published })}>{t.is_published ? 'Hide' : 'Publish'}</button>
                    {t.is_published && <a className="pt-btn ghost sm" href={tourLink(t.slug)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View</a>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pager offset={offset} total={list.data.total} onChange={setOffset} />
        </>
      )}
      {edit !== undefined && <TourDrawer tour={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); list.reload(); }} />}
    </StaffShell>
  );
}

function Reviews({ onChange }) {
  const [status, setStatus] = useState('pending');
  const [offset, setOffset] = useState(0);
  const { data, loading, error, reload } = useAsync(() => api.get(`/admin/tours/reviews?status=${status}&limit=${PAGE}&offset=${offset}`), [status, offset]);
  const pick = (s) => { setStatus(s); setOffset(0); };
  const review = async (r, next) => {
    try {
      await api.put(`/admin/tours/reviews/${r.id}`, { status: next });
      toast.success(next === 'approved' ? 'Review approved. It is now on the website.' : 'Review rejected');
      reload(); onChange();
    } catch (e) { toast.error(e.message || 'Could not update'); }
  };
  return (
    <div className="pt-stack">
      <Tabs value={status} onChange={pick} tabs={[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']]} />
      {loading && !data ? <Skeleton h={160} /> : error ? <ErrorState onRetry={reload} /> : !data.items.length ? (
        <Card><Empty icon={MessageSquare} title={status === 'pending' ? 'No reviews waiting' : `No ${status} reviews`}>New reviews from the website appear here for approval.</Empty></Card>
      ) : (
        <>
          {data.items.map((r) => (
            <Card key={r.id}>
              <div className="pt-row between top" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ color: 'var(--pt-navy)' }}>{r.name}</strong> {r.email && <span className="pt-tiny">{r.email}</span>} <Stars n={r.rating} />
                  <div className="pt-tiny" style={{ marginTop: 2 }}>On <a href={tourLink(r.tour_slug)} target="_blank" rel="noreferrer">{r.tour_title}</a> · {fmtDateTime(r.created_at)}</div>
                  <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.message}</p>
                </div>
                <div className="pt-row" style={{ gap: 8 }}>
                  {r.status !== 'approved' && <button type="button" className="pt-btn sm" onClick={() => review(r, 'approved')}><Check size={15} /> Approve</button>}
                  {r.status !== 'rejected' && <button type="button" className="pt-btn ghost sm" onClick={() => review(r, 'rejected')}><X size={15} /> Reject</button>}
                </div>
              </div>
            </Card>
          ))}
          <Pager offset={offset} total={data.total} onChange={setOffset} />
        </>
      )}
    </div>
  );
}

const lines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

function TourDrawer({ tour, onClose, onSaved }) {
  const [f, setF] = useState({
    title: tour?.title || '', headline: tour?.headline || '', card_image: tour?.card_image || '', location: tour?.location || '',
    discount: tour?.discount ?? '', rating: tour?.rating ?? 5, overview: tour?.overview || '', slider_images: tour?.slider_images || [],
    thumb_1: tour?.thumb_images?.[0] || '', thumb_2: tour?.thumb_images?.[1] || '',
    highlights: (tour?.highlights || []).join('\n'), included: (tour?.included || []).join('\n'), excluded: (tour?.excluded || []).join('\n'),
    faqs: tour?.faqs?.length ? tour.faqs : [{ question: '', answer: '' }], map_embed_url: tour?.map_embed_url || '',
    is_featured: tour?.is_featured || false, is_published: tour ? tour.is_published : true, sort_order: tour?.sort_order ?? 0,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF((old) => ({ ...old, [k]: v })); setErrors((old) => ({ ...old, [k]: undefined })); };
  const setFaq = (i, k, v) => set('faqs', f.faqs.map((q, j) => (j === i ? { ...q, [k]: v } : q)));

  const save = async () => {
    const next = {};
    if (!f.title.trim()) next.title = 'Give the tour a title';
    if (!f.card_image) next.card_image = 'Upload a card image';
    if (f.discount !== '' && !(Number(f.discount) >= 1 && Number(f.discount) <= 99)) next.discount = 'Between 1 and 99';
    if (!f.location.trim()) next.location = 'Enter the location';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      title: f.title.trim(), headline: f.headline, card_image: f.card_image, location: f.location.trim(),
      discount: f.discount === '' ? null : Number(f.discount), rating: Number(f.rating), overview: f.overview,
      slider_images: f.slider_images.filter(Boolean), thumb_images: [f.thumb_1, f.thumb_2].filter(Boolean),
      highlights: lines(f.highlights), included: lines(f.included), excluded: lines(f.excluded),
      faqs: f.faqs.filter((q) => q.question.trim()), map_embed_url: f.map_embed_url.trim(),
      is_featured: f.is_featured, is_published: f.is_published, sort_order: Number(f.sort_order) || 0,
    };
    try {
      if (tour) await api.put(`/admin/tours/items/${tour.id}`, body); else await api.post('/admin/tours/items', body);
      toast.success(tour ? 'Tour updated' : f.is_published ? 'Tour published' : 'Tour saved as hidden');
      onSaved();
    } catch (err) { toast.error(err.message || 'Could not save'); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} side label="Tour" className="tour-drawer">
      <ModalHead title={tour ? 'Edit tour' : 'New tour'} sub="Laid out like the website's tour page, top to bottom." onClose={onClose} />
      <div className="pt-stack">
        <Field label="Card title *" error={errors.title} hint="Shown on the Tours list and home page cards."><Input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={200} placeholder="The Burj Khalifa" error={errors.title} /></Field>
        <Field label="Page title" optional hint="The big title at the top of the tour page. Leave empty to use the card title."><Input value={f.headline} onChange={(e) => set('headline', e.target.value)} maxLength={300} /></Field>
        <Field label="Card image *" error={errors.card_image}><ImagePick value={f.card_image} onChange={(v) => set('card_image', v)} label="card image" /></Field>
        <Field label="Location *" error={errors.location} hint="Shown on the tour cards and under the tour's title."><Input value={f.location} onChange={(e) => set('location', e.target.value)} maxLength={120} placeholder="Dubai" error={errors.location} /></Field>
        <div className="pt-grid2">
          <Field label="Discount %" optional error={errors.discount}><Input type="number" min={1} max={99} value={f.discount} onChange={(e) => set('discount', e.target.value)} error={errors.discount} /></Field>
          <Field label="Stars on the card"><Select value={f.rating} onChange={(e) => set('rating', e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</Select></Field>
        </div>
        <Field label="Slider images" optional hint="The big photos at the top of the tour page (up to 12).">
          <div className="pt-stack">
            {f.slider_images.map((url, i) => (
              <div key={i} className="pt-row" style={{ gap: 8 }}>
                <div style={{ flex: 1 }}><ImagePick value={url} onChange={(v) => set('slider_images', v ? f.slider_images.map((u, j) => (j === i ? v : u)) : f.slider_images.filter((_, j) => j !== i))} label={`photo ${i + 1}`} /></div>
              </div>
            ))}
            {f.slider_images.length < 12 && <ImagePick value="" onChange={(v) => v && set('slider_images', [...f.slider_images, v])} label="a slider photo" />}
          </div>
        </Field>
        <Field label="Overview" optional><TextArea value={f.overview} onChange={(e) => set('overview', e.target.value)} rows={5} max={20000} /></Field>
        <Field label="Highlights" optional hint="One per line."><TextArea value={f.highlights} onChange={(e) => set('highlights', e.target.value)} rows={5} /></Field>
        <div className="pt-grid2">
          <Field label="Included (✓)" optional hint="One per line."><TextArea value={f.included} onChange={(e) => set('included', e.target.value)} rows={5} /></Field>
          <Field label="Not included (✗)" optional hint="One per line."><TextArea value={f.excluded} onChange={(e) => set('excluded', e.target.value)} rows={5} /></Field>
        </div>
        <Field label="Two photos" optional hint="Shown side by side under the amenities.">
          <div className="pt-stack"><ImagePick value={f.thumb_1} onChange={(v) => set('thumb_1', v)} label="photo 1" /><ImagePick value={f.thumb_2} onChange={(v) => set('thumb_2', v)} label="photo 2" /></div>
        </Field>
        <Field label="Tour plan" optional hint="One step per day: a title and the plan for that day. Visitors open each day like a dropdown.">
          <div className="pt-stack">
            {f.faqs.map((q, i) => (
              <div key={i} className="pt-stack" style={{ padding: 12, border: '1px solid var(--pt-line, #e5e7eb)', borderRadius: 12 }}>
                <span className="pt-badge gold" style={{ alignSelf: 'flex-start' }}>Day {i + 1}</span>
                <div className="pt-row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}><Input value={q.question} onChange={(e) => setFaq(i, 'question', e.target.value)} maxLength={300} placeholder={`Day ${i + 1} title, e.g. Arrival and city tour`} /></div>
                  <button type="button" className="pt-icon-btn" aria-label={`Remove day ${i + 1}`} onClick={() => set('faqs', f.faqs.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
                </div>
                <TextArea value={q.answer} onChange={(e) => setFaq(i, 'answer', e.target.value)} rows={3} max={5000} placeholder={`What happens on day ${i + 1}`} />
              </div>
            ))}
            {f.faqs.length < 20 && <button type="button" className="pt-btn soft sm" onClick={() => set('faqs', [...f.faqs, { question: '', answer: '' }])}><Plus size={15} /> Add day {f.faqs.length + 1}</button>}
          </div>
        </Field>
        <Field label="Google Maps embed link" optional hint="Google Maps > Share > Embed a map, then copy only the link inside src=&quot;…&quot;."><Input value={f.map_embed_url} onChange={(e) => set('map_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=…" /></Field>
        <Field label="Order" hint="Position on the Tours page and the home page slider: 1 shows first, then 2, 3… Tours with the same number show oldest first. The tour page's Related Tour List picks 2 other tours at random."><Input type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
        <Check2 checked={f.is_featured} onChange={(on) => set('is_featured', on)}>Show on the home page (Most Popular Tours)</Check2>
        <Check2 checked={f.is_published} onChange={(on) => set('is_published', on)}>Published — visible on the website</Check2>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : tour ? 'Save changes' : 'Publish tour'}</button></div>
      </div>
    </Modal>
  );
}
