import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Copy, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { fileUrl } from '../../services/storage';
import { AppBar, Empty, ErrorState, Page, Shell, Skeleton, fmtDate, useAsync, useCopy, useWide } from '../ui';
import { SERVICES } from '../booking';

export function OfferCard({ offer }) {
  const navigate = useNavigate();
  const { copied, copy } = useCopy();
  const svc = offer.service_type ? SERVICES[offer.service_type] : null;
  return (
    <article className="pt-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 150, background: offer.image_file_id ? `center / cover url(${fileUrl(offer.image_file_id)})` : 'linear-gradient(135deg, #10283f, #c9963e)', position: 'relative' }}>
        {offer.badge && <span className="pt-badge gold" style={{ position: 'absolute', left: 12, top: 12, fontWeight: 800 }}>{offer.badge}</span>}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 className="pt-serif-h" style={{ fontSize: 19 }}>{offer.title}</h3>
        {offer.description && <p className="pt-sub" style={{ margin: 0, fontSize: 14 }}>{offer.description}</p>}
        <div className="pt-tiny">{offer.valid_until ? `Valid until ${fmtDate(offer.valid_until)}` : 'Limited-time offer'}</div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 6 }}>
          {offer.code && (
            <button type="button" className="pt-btn ghost sm" onClick={async () => { if (await copy(offer.code, `offer-${offer.id}`)) toast.success('Code copied'); }} aria-label={`Copy code ${offer.code}`}>
              {copied === `offer-${offer.id}` ? <Check size={14} /> : <Copy size={14} />} {offer.code}
            </button>
          )}
          <button type="button" className="pt-btn sm" onClick={() => navigate(offer.service_type ? `/bookings/new/${offer.service_type}` : '/bookings/new')}>{svc ? `Request ${svc.label.toLowerCase()}` : 'Plan a trip'} <ArrowRight size={14} /></button>
        </div>
      </div>
    </article>
  );
}

/** A few live offers for the home page; renders nothing when there are none. */
export function OffersStrip({ limit = 3, title = 'Offers for you' }) {
  const navigate = useNavigate();
  const { data } = useAsync(() => api.get('/portal/offers').catch(() => []), []);
  const offers = (data || []).slice(0, limit);
  if (!offers.length) return null;
  return (
    <section className="pt-stack" style={{ marginTop: 22 }} aria-label="Offers">
      <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 22 }}>{title}</h2>{(data || []).length > limit && <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => navigate('/offers')}>View all offers →</button>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 16 }}>{offers.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
    </section>
  );
}

export default function CustomerOffers() {
  const navigate = useNavigate();
  const wide = useWide();
  const { data, loading, error, reload } = useAsync(() => api.get('/portal/offers'), []);
  const offers = data || [];
  return (
    <Shell active="home" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Offers" onBack={() => navigate(-1)} /></div>}
      <Page wide>
        {wide && <><h1 className="pt-title" style={{ marginTop: 8 }}>Offers</h1><p className="pt-lede">Deals and member perks from the Bright Wings travel team.</p></>}
        <div style={{ marginTop: 18 }}>
          {loading && !data ? <Skeleton h={220} r={16} /> : error ? <ErrorState onRetry={reload} /> : !offers.length ? (
            <div className="pt-card" style={{ padding: 24 }}><Empty icon={Tag} title="No offers right now">New offers from our travel team will show up here. In the meantime you can plan a trip and get a quotation.</Empty></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>{offers.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
          )}
        </div>
      </Page>
    </Shell>
  );
}
