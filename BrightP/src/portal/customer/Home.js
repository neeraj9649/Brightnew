import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Gift, Info, Plane, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import {
  BellButton, Card, Hero, IMG, Progress, Shell, Page, Skeleton, WingsIcon, bg, fmtNum, memberName, useAsync, useWide,
} from '../ui';
import { BookingCard, MemberCardFace, RewardArt, TierIcon } from './parts';
import { isPast, bookingDate } from '../booking';
import { TIER_BENEFITS } from '../booking';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const DESTINATIONS = [
  ['Rajasthan', 'Royal stays and timeless heritage', IMG.palace],
  ['Kerala', 'Backwaters and serene escapes', 'linear-gradient(160deg,#1f6b4f,#7ac2a0)'],
  ['Himalayas', 'Mountains, monasteries and more', 'linear-gradient(160deg,#35577a,#cfe0ef)'],
  ['Goa', 'Beaches, culture and laid-back days', bg(IMG.coast)],
];

export default function Home() {
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
  const rewards = (summary?.catalog || []).slice(0, wide ? 2 : 3);

  const Greeting = (
    <div>
      <div className="pt-small" style={{ fontSize: 14 }}>{greeting()},</div>
      <h1 className="pt-h1 serif" style={{ fontSize: 30 }}>{name}</h1>
      <p className="pt-sub" style={{ marginTop: 4 }}>Here’s what’s next on your travel journey.</p>
    </div>
  );

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

  const WalletDesktop = (
    <div className="pt-wallet" style={{ display: 'grid', alignContent: 'space-between', minHeight: 230 }}>
      <div className="pt-row between top"><div className="label">Your Wings balance</div><RewardCoin /></div>
      <div><div className="big">{fmtNum(balance)} <span style={{ fontSize: 22 }}>Wings</span></div><div className="label" style={{ marginTop: 6 }}>Available to spend <Info size={13} /></div></div>
      <div style={{ display: 'grid', gap: 10 }}>
        <button type="button" className="pt-btn sm" style={{ background: '#fff', color: 'var(--pt-navy)', borderColor: '#fff' }} onClick={() => navigate('/bookings/new')}>Book a trip <ArrowRight size={16} /></button>
        <button type="button" className="pt-btn sm" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.7)', boxShadow: 'none' }} onClick={() => navigate('/rewards/catalog')}>View rewards <ArrowRight size={16} /></button>
      </div>
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

  const benefits = (TIER_BENEFITS[tier.current] || []).slice(0, 3);
  return (
    <Shell active="home" greeting={Greeting}>
      <Page wide>
        <div className="pt-stack lg" style={{ marginTop: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.2fr 1.1fr', gap: 16 }}>
            {WalletDesktop}
            <Card>
              <h2 className="pt-h2" style={{ fontSize: 16 }}>Your tier progress</h2>
              <div className="pt-row" style={{ marginTop: 14 }}>
                <span className="pt-item-icon round" style={{ width: 46, height: 46 }}><TierIcon tier={tier.current} size={22} /></span>
                <div><strong style={{ color: 'var(--pt-navy)' }}>{tier.current} Member</strong><div className="pt-small">{fmtNum(lifetime)} lifetime Wings</div></div>
              </div>
              <div className="pt-progress" style={{ margin: '16px 0 8px' }}><span style={{ width: `${tier.progress_percent || (tier.next_tier ? 0 : 100)}%` }} /></div>
              <div className="pt-row between pt-small"><span>{tier.next_tier ? `Next stop: ${tier.next_tier} at ${fmtNum(tier.next_threshold)} lifetime Wings` : 'You are on our highest tier'}</span>{tier.next_tier && <strong style={{ color: 'var(--pt-navy)', textAlign: 'right' }}>{fmtNum(remaining)}<br /><span style={{ fontWeight: 500 }}>remaining</span></strong>}</div>
              <div className="pt-notice gold" style={{ marginTop: 14, display: 'block' }}>
                <div className="pt-row" style={{ marginBottom: 6 }}><Gift size={16} /><strong style={{ margin: 0 }}>{tier.current} benefits (illustrative)</strong></div>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 3 }}>{benefits.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
            </Card>
            <MemberCardFace name={name} code={userData?.membershipCode} tier={tier.current} qr={false} />
          </div>

          <div className="pt-banner" style={{ backgroundImage: bg(IMG.lake), minHeight: 170, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 28 }}>Find your next<br />unforgettable journey</h2>
              <p style={{ marginTop: 8, fontSize: 14, maxWidth: 360 }}>Handpicked stays, curated experiences and more Wings on every trip.</p>
              <button type="button" className="pt-btn sm" style={{ marginTop: 14 }} onClick={() => navigate('/bookings/new')}>Book a trip <ArrowRight size={16} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16 }}>
            {UpcomingCard}
            <Card>
              <div className="pt-row between" style={{ marginBottom: 12 }}><h2 className="pt-h2" style={{ fontSize: 16 }}>Featured rewards</h2><button type="button" className="pt-link gold" onClick={() => navigate('/rewards/catalog')}>View all rewards →</button></div>
              <div className="pt-grid2">
                {rewards.length === 0 && <p className="pt-small">Rewards will appear here.</p>}
                {rewards.map((r) => (
                  <button type="button" key={r.id} className="pt-item" style={{ display: 'block', padding: 0, overflow: 'hidden' }} onClick={() => navigate(`/rewards/catalog/${r.id}`)}>
                    <RewardArt item={r} height={84} style={{ borderRadius: 0 }} />
                    <div style={{ padding: '10px 12px' }}><div className="pt-item-title" style={{ fontSize: 13 }}>{r.name}</div><div className="pt-small" style={{ color: 'var(--pt-gold-dark)', marginTop: 4, fontWeight: 700 }}>{fmtNum(r.wings_cost)} Wings</div></div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="pt-row between" style={{ marginBottom: 12 }}><h2 className="pt-h2" style={{ fontSize: 16 }}>Destinations for you</h2><button type="button" className="pt-link gold" onClick={() => navigate('/bookings/new')}>Explore all destinations →</button></div>
            <div className="pt-grid4">
              {DESTINATIONS.map(([title, sub, art]) => (
                <button type="button" key={title} className="pt-art-tile" style={{ minHeight: 150, backgroundImage: art }} onClick={() => navigate(`/bookings/new/custom?destinations=${encodeURIComponent(title)}`)}>
                  <div><strong>{title}</strong><span>{sub}</span></div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </Page>
    </Shell>
  );
}

function RewardCoin() {
  return <span className="pt-coin"><WingsIcon size={22} color="#fff" strokeWidth={1.9} /></span>;
}

