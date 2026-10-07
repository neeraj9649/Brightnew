import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CircleAlert, Copy, Plus, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import {
  Chips, Empty, IMG, Modal, ModalHead, Page, SearchBox, Select, Shell, Skeleton, Tabs, Field, bg, useCopy, useWide,
} from '../ui';
import { BookingCard } from './parts';
import { bookingDate, bookingTitle, isPast, serviceOf, STATUS } from '../booking';

const DRAFT_KEY = 'bw_booking_draft';
export const saveDraft = (draft) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ } };
export const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ } };
export const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };

/** Mock 33: a calm, recoverable failure state. */
export function RecoverableError({ title = 'We couldn’t load your booking', body = 'We’re having a temporary issue connecting to our systems. Your request is safe and no changes have been made.', draft, onRetry, onSupport, busy }) {
  const { copied, copy } = useCopy();
  return (
    <div className="pt-stack lg" style={{ textAlign: 'center', paddingTop: 8 }}>
      <div style={{ position: 'relative', width: 92, margin: '8px auto 0' }}>
        <Briefcase size={72} strokeWidth={1.3} style={{ color: 'var(--pt-navy)' }} />
        <span style={{ position: 'absolute', right: -2, top: -4, width: 28, height: 28, borderRadius: '50%', background: '#c0443a', display: 'grid', placeItems: 'center', color: '#fff' }}><CircleAlert size={16} /></span>
      </div>
      <div><h2 className="pt-h1" style={{ fontSize: 24 }}>{title}</h2><p className="pt-sub" style={{ marginTop: 8 }}>{body}</p></div>
      {draft && (
        <div className="pt-notice red" style={{ textAlign: 'left', display: 'block' }}>
          <div className="pt-row" style={{ gap: 10, marginBottom: 8 }}><ShieldCheck size={20} /><div><strong style={{ margin: 0 }}>Your request is safe</strong>We’ve saved your booking details and you can try again in a moment.</div></div>
          <div className="pt-card flat" style={{ padding: 12, background: '#fff', color: 'var(--pt-ink)' }}>
            <div className="pt-small">Booking reference (saved)</div>
            <div className="pt-row between"><strong className="pt-serif" style={{ fontSize: 20, color: 'var(--pt-navy)' }}>{draft.ref}</strong><button type="button" className="pt-icon-btn" aria-label="Copy reference" onClick={() => copy(draft.ref, 'ref')}><Copy size={16} /></button></div>
            <div className="pt-small">{copied === 'ref' ? 'Copied' : draft.summary}</div>
          </div>
        </div>
      )}
      <div className="pt-stack" style={{ gap: 10 }}>
        <button type="button" className="pt-btn full" onClick={onRetry} disabled={busy}>{busy ? 'Trying again…' : 'Try again'}</button>
        <button type="button" className="pt-btn ghost full" onClick={onSupport}>Contact support</button>
      </div>
    </div>
  );
}

export default function Bookings() {
  const navigate = useNavigate();
  const wide = useWide();
  const { bookings, loading, error, loadUserBookings } = useBooking();
  const [tab, setTab] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('soonest');
  const [retrying, setRetrying] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUserBookings(); }, []);

  const counts = useMemo(() => ({
    upcoming: bookings.filter((b) => !isPast(b)).length,
    past: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }), [bookings]);

  const inTab = useMemo(() => bookings.filter((b) => (tab === 'upcoming' ? !isPast(b) : tab === 'past' ? b.status === 'completed' : b.status === 'cancelled')), [bookings, tab]);
  const typeCounts = useMemo(() => inTab.reduce((acc, b) => ({ ...acc, [b.type]: (acc[b.type] || 0) + 1 }), {}), [inTab]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = inTab.filter((b) => {
      if (type !== 'all' && b.type !== type) return false;
      if (status !== 'all' && b.status !== status) return false;
      if (!q) return true;
      return `${bookingTitle(b)} ${b.id} ${b.destination || ''} ${b.hotel || ''} ${serviceOf(b.type).label}`.toLowerCase().includes(q);
    });
    const when = (b) => { const d = new Date(bookingDate(b)); return Number.isNaN(d.getTime()) ? Infinity : d.getTime(); };
    return [...list].sort(sort === 'newest' ? (a, b) => b.createdAt - a.createdAt : (a, b) => when(a) - when(b) || b.createdAt - a.createdAt);
  }, [inTab, query, type, status, sort]);

  const retry = async () => { setRetrying(true); await loadUserBookings(); setRetrying(false); };
  const typeChips = [['all', `All (${inTab.length})`], ...Object.keys(typeCounts).map((t) => [t, `${serviceOf(t).label} (${typeCounts[t]})`])];

  const tabs = [['upcoming', `Upcoming (${counts.upcoming})`], ['past', `Past (${counts.past})`], ...(counts.cancelled ? [['cancelled', `Cancelled (${counts.cancelled})`]] : [])];

  return (
    <Shell active="bookings" topbar={wide}>
      <Page wide={wide}>
        <div className="pt-row between top" style={{ margin: wide ? '4px 0 14px' : '22px 0 14px', gap: 14 }}>
          <div><h1 className="pt-h1">My bookings</h1><p className="pt-sub" style={{ marginTop: 5 }}>Plan, track and manage all your trips in one place.</p></div>
          <button type="button" className="pt-btn sm" style={{ flex: 'none' }} onClick={() => navigate('/bookings/new')}><Plus size={16} /> Start booking</button>
        </div>

        {error && !bookings.length ? (
          <>
            <RecoverableError draft={readDraft()} onRetry={retry} busy={retrying} onSupport={() => navigate('/support')} />
            <div style={{ marginTop: 22 }}><div className="pt-row between" style={{ marginBottom: 8 }}><h3 className="pt-h3">Your bookings</h3></div><Card2><Empty icon={Briefcase} title="No bookings to show">When your bookings are available, they’ll appear here.</Empty></Card2></div>
          </>
        ) : (
          <div className="pt-stack lg">
            <Tabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setType('all'); }} />
            <div className="pt-toolbar">
              <SearchBox value={query} onChange={setQuery} placeholder="Search by destination, booking ID or hotel" />
              <button type="button" className="pt-icon-btn" aria-label="Filters" style={{ border: '1px solid var(--pt-line-strong)', borderRadius: 13, width: 46, height: 46, background: '#fff' }} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={18} /></button>
            </div>
            {typeChips.length > 2 && <Chips scroll options={typeChips} value={type} onChange={setType} />}

            {loading && !bookings.length ? (
              <div className="pt-stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={110} r={16} />)}</div>
            ) : shown.length === 0 ? (
              <Card2>
                <Empty icon={Briefcase} title={query || type !== 'all' || status !== 'all' ? 'No bookings match your filters' : tab === 'upcoming' ? 'No upcoming bookings yet' : `No ${tab} bookings`}>
                  {tab === 'upcoming' && !query ? 'Flights, hotels, transfers and curated experiences are one request away.' : 'Try clearing your search or filters.'}
                  {tab === 'upcoming' && <button type="button" className="pt-btn sm" style={{ marginTop: 6 }} onClick={() => navigate('/bookings/new')}>Start booking</button>}
                </Empty>
              </Card2>
            ) : (
              <div className="pt-stack" style={wide ? { gridTemplateColumns: 'repeat(2, minmax(0,1fr))' } : undefined}>
                {shown.map((b) => <BookingCard key={b.docId} booking={b} onClick={() => navigate(`/bookings/${b.docId}`)} />)}
              </div>
            )}

            <div className="pt-banner" style={{ backgroundImage: bg(IMG.palace), minHeight: 130 }}>
              <h2 style={{ fontSize: 18 }}>Planning your next trip?</h2>
              <p>Flights, hotels, transfers and curated experiences, all in one place.</p>
              <button type="button" className="pt-btn xs" style={{ marginTop: 10, alignSelf: 'flex-start' }} onClick={() => navigate('/bookings/new')}>Start booking <Plus size={14} /></button>
            </div>
          </div>
        )}
      </Page>

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} label="Filter bookings">
        <ModalHead title="Filter bookings" onClose={() => setFilterOpen(false)} />
        <div className="pt-stack lg">
          <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</Select></Field>
          <Field label="Sort by"><Select value={sort} onChange={(e) => setSort(e.target.value)}><option value="soonest">Soonest travel date</option><option value="newest">Newest request</option></Select></Field>
          <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={() => { setStatus('all'); setSort('soonest'); }}>Reset</button><button type="button" className="pt-btn" onClick={() => setFilterOpen(false)}>Apply</button></div>
        </div>
      </Modal>
    </Shell>
  );
}

const Card2 = ({ children }) => <div className="pt-card">{children}</div>;
