import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Gift, Info, Plane, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import {
  BellButton, Card, Hero, IMG, Progress, Shell, Page, Skeleton, bg, fmtNum, memberName, useAsync, useWide,
} from '../ui';
import { BookingCard, TierIcon } from './parts';
import { isPast, bookingDate } from '../booking';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};


export function MobileHome() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { bookings, loading: bookingsLoading } = useBooking();
  const { data: summary, loading } = useAsync(() => api.get('/loyalty/summary'), []);

  const name = memberName(userData);
  const balance = Number(summary?.balance ?? userData?.tokens ?? 0);
  const tier = summary?.tier || { current: userData?.membershipTier || 'Silver', lifetime_wings: userData?.lifetimePointsEarned || 0, next_tier: null, next_threshold: null, progress_percent: 0 };
  const lifetime = Number(tier.lifetime_wings || 0);
  const remaining = tier.next_threshold ? Math.max(0, tier.next_threshold - lifetime) : 0;

  const upcoming = useMemo(() => {
    const active = (bookings || []).filter((b) => !isPast(b));
    const dated = (b) => { const d = new Date(bookingDate(b)); return Number.isNaN(d.getTime()) ? Infinity : d.getTime(); };
    return [...active].sort((a, b) => dated(a) - dated(b))[0] || null;
  }, [bookings]);

  const WalletMobile = (
    <div className="pt-wallet">
      <div className="pt-row between top">
        <div>
          <div className="label">Your Wings <Info size={13} /></div>
          <div className="big" style={{ marginTop: 6 }}>{loading ? <Skeleton h={38} w={140} /> : <>{fmtNum(balance)} <span style={{ fontSize: 22 }}>Wings</span></>}</div>
        </div>
        <button type="button" className="pt-tier-pill" onClick={() => navigate('/tier-benefits')}><TierIcon tier={tier.current} size={16} /> {tier.current} <ChevronRight size={15} /></button>
      </div>
      <button type="button" className="pt-btn sm" style={{ marginTop: 14, background: 'transparent', border: '1px solid rgba(255,255,255,.7)', boxShadow: 'none' }} onClick={() => navigate('/rewards')}>View wallet <ArrowRight size={16} /></button>
      <hr className="pt-divider" style={{ borderTop: '1px solid rgba(255,255,255,.18)', background: 'none' }} />
      <div className="pt-row between" style={{ fontSize: 12, color: 'rgba(255,255,255,.78)' }}><span>Lifetime Wings</span>{tier.next_tier && <span>{fmtNum(remaining)} to {tier.next_tier}</span>}</div>
      <div style={{ margin: '6px 0 10px' }}><strong className="pt-serif" style={{ fontSize: 22 }}>{fmtNum(lifetime)}</strong> <span style={{ opacity: 0.75, fontSize: 13 }}>{tier.next_threshold ? `of ${fmtNum(tier.next_threshold)}` : '· top tier'}</span></div>
      <Progress dark value={tier.progress_percent || (tier.next_tier ? 0 : 100)} />
    </div>
  );

  const UpcomingCard = (
    <Card>
      <div className="pt-row between" style={{ marginBottom: 12 }}>
        <h2 className="pt-h2" style={{ fontSize: 16 }}>{wide ? 'Upcoming trip' : 'Upcoming booking'}</h2>
        <button type="button" className="pt-link gold" onClick={() => navigate('/bookings')}>View all {wide ? '→' : <ChevronRight size={14} style={{ verticalAlign: -3 }} />}</button>
      </div>
      {bookingsLoading && !upcoming ? <Skeleton h={92} r={14} /> : upcoming ? (
        <BookingCard booking={upcoming} onClick={() => navigate(`/bookings/${upcoming.docId}`)} />
      ) : (
        <div className="pt-notice plain" style={{ alignItems: 'center' }}>
          <Plane size={18} />
          <div style={{ flex: 1 }}>No trips planned yet. Request your first quote in a minute.</div>
          <button type="button" className="pt-btn xs" onClick={() => navigate('/bookings/new')}>Start booking</button>
        </div>
      )}
    </Card>
  );

  const ExtraWings = (
    <div className="pt-banner" style={{ backgroundImage: bg(IMG.chairs), minHeight: 150, justifyContent: 'flex-end' }}>
      <div className="kicker">TRAVEL MORE. EARN MORE.</div>
      <h2>Extra Wings<br />for unforgettable<br />journeys</h2>
      <button type="button" className="pt-btn xs" style={{ position: 'absolute', right: 14, bottom: 16, background: '#fff', color: 'var(--pt-navy)', borderColor: '#fff', boxShadow: 'none', zIndex: 2 }} onClick={() => navigate('/tier-benefits')}>Explore benefits <ArrowRight size={14} /></button>
    </div>
  );

  if (!wide) {
    return (
      <Shell active="home" topbar={false}>
        <Hero image={IMG.palace} right={<BellButton light />} style={{ minHeight: 210, paddingBottom: 70 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 15 }}>{greeting()},</div>
            <h1 style={{ fontSize: 30 }}>{name}</h1>
            <p style={{ marginTop: 4, fontSize: 13 }}>More journeys. Brighter rewards.</p>
          </div>
        </Hero>
        <Page style={{ marginTop: -52, position: 'relative' }}>
          <div className="pt-stack lg">
            {WalletMobile}
            <div className="pt-tiles">
              <button type="button" className="pt-tile" onClick={() => navigate('/bookings/new')}><Plane size={26} strokeWidth={1.5} />Book a trip</button>
              <button type="button" className="pt-tile" onClick={() => navigate('/referrals')}><Users size={26} strokeWidth={1.5} />Refer a friend</button>
              <button type="button" className="pt-tile" onClick={() => navigate('/rewards/catalog')}><Gift size={26} strokeWidth={1.5} />Redeem</button>
            </div>
            {UpcomingCard}
            {ExtraWings}
          </div>
        </Page>
      </Shell>
    );
  }

  return null;
}
