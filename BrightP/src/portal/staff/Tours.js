import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Map as MapIcon, MessageSquare, Pencil, Plus, Star, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Card, Empty, ErrorState, Skeleton, Tabs, fmtDateTime, useAsync } from '../ui';
import StaffShell from './StaffShell';
import TourDrawer from './TourDrawer';
import WebsiteCatalogueCard, { catalogueGridStyle } from './WebsiteCatalogueCard';

// Tours appear on the public website (Tours list, home page, tour pages).
const WEBSITE = 'https://brightwingstravel.com';
const tourLink = (id) => `${WEBSITE}/packages/${encodeURIComponent(id)}`;
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
  const list = useAsync(() => api.get(`/admin/tours/items?catalog=true&limit=${PAGE}&offset=${offset}`), [offset]);
  const [edit, setEdit] = useState(undefined); // undefined = closed, null = new, object = editing
  const pending = list.data?.pending_reviews || 0;

  const [updating, setUpdating] = useState(null);
  const togglePublished = async (tour) => {
    setUpdating(tour.id);
    try {
      await api.patch(`/admin/tours/items/${tour.id}/publication`, { is_published: !tour.is_published });
      list.reload();
    } catch (error) {
      toast.error(error.message || 'Could not update');
    } finally {
      setUpdating(null);
    }
  };

  // Copies every tour and blog image that is not on the file server yet, 20 per call, until none are left.
  // Links that fail are sent back as `skip`, so one broken image never stops the rest.
  const [moving, setMoving] = useState(false);
  const moveImages = async () => {
    if (!window.confirm('Copy all tour and blog images to the file server and update their links? This can take a minute.')) return;
    setMoving(true);
    const skip = [];
    let moved = 0;
    const progress = toast.loading('Moving images…');
    try {
      for (let round = 0; round < 100; round += 1) {
        const res = await api.post('/admin/media/move-site-images?limit=20', { skip });
        moved += res.moved;
        skip.push(...res.failed.map((f) => f.url));
        toast.loading(`Moving images… ${moved} moved${res.remaining ? `, ${res.remaining} left` : ''}`, { id: progress });
        if (!res.remaining || (!res.moved && !res.failed.length)) break;
      }
      toast.dismiss(progress);
      if (skip.length) toast.error(`${moved} images moved. ${skip.length} could not be copied and were left as they are.`, { duration: 8000 });
      else toast.success(moved ? `${moved} images moved to the file server.` : 'All images are already on the file server.');
      list.reload();
    } catch (e) {
      toast.dismiss(progress);
      toast.error(e.message || 'Could not move the images');
    } finally {
      setMoving(false);
    }
  };

  return (
    <StaffShell active="tours" title="Tours" sub="Manage the individual experiences and holiday packages published on the website."
      actions={tab === 'tours' && (
        <div className="pt-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="pt-btn ghost" disabled={moving} onClick={moveImages} title="Copy tour and blog images to the file server"><Upload size={17} /> {moving ? 'Moving images…' : 'Move images to file server'}</button>
          <button type="button" className="pt-btn" onClick={() => setEdit(null)}><Plus size={17} /> New tour</button>
        </div>
      )}>
      <div style={{ marginBottom: 18 }}>
        <Tabs value={tab} onChange={setTab} tabs={[['tours', 'Tours'], ['reviews', pending ? `Reviews (${pending} waiting)` : 'Reviews']]} />
      </div>
      {tab === 'reviews' ? <Reviews onChange={list.reload} /> : list.loading && !list.data ? <Skeleton h={220} /> : list.error ? <ErrorState onRetry={list.reload} /> : !list.data.items.length ? (
        <Card><Empty icon={MapIcon} title="No tours yet" action={<button type="button" className="pt-btn" onClick={() => setEdit(null)}>Add the first tour</button>}>Create an individual experience or holiday package with photos and travel details.</Empty></Card>
      ) : (
        <>
          <div style={catalogueGridStyle}>
            {list.data.items.map((t) => (
              <WebsiteCatalogueCard key={t.id} image={t.card_image} title={t.title} published={t.is_published} featured={t.is_featured}
                details={[t.package_type === 'holiday' ? 'Holiday package' : 'Individual package', t.location, t.duration].filter(Boolean).join(' · ')}>
                <button type="button" className="pt-btn ghost sm" onClick={() => setEdit(t)}><Pencil size={14} /> Edit</button>
                <button type="button" className="pt-btn ghost sm" disabled={updating !== null} onClick={() => togglePublished(t)}>{t.is_published ? 'Hide' : 'Publish'}</button>
                {t.is_published && <a className="pt-btn ghost sm" href={tourLink(t.id)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View</a>}
              </WebsiteCatalogueCard>
            ))}
          </div>
          <Pager offset={offset} total={list.data.total} onChange={setOffset} />
        </>
      )}
      {edit !== undefined && <TourDrawer tour={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); if (edit || offset === 0) list.reload(); else setOffset(0); }} />}
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

