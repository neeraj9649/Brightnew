import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins, Crown, Gem, Gift, ListChecks, Medal, Plane, Star, Users, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import { Badge, Page, Progress, Shell, Skeleton, bg, fmtDate, fmtNum, memberName, useAsync, tierTitle } from '../ui';
import { PHOTO, photoFor } from '../photos';
import { bookingTitle, isPast, serviceOf, statusMeta } from '../booking';
import { MemberCardFace } from '../customer/parts';
import { OffersStrip } from '../customer/Offers';
import { fmtRange } from './common';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const TIER_ICON = { Member: Users, Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };

const REASON_ICON = { booking: Plane, first_booking: Gift, welcome_bonus: Gift, referral: Users, manual: Star, redemption: Gift };
const REASON_TITLE = { booking: 'Trip completed', first_booking: 'First booking bonus', welcome_bonus: 'Welcome bonus', referral: 'Referral bonus', manual: 'Wings adjustment', redemption: 'Reward redemption' };

export default function DeskHome() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { bookings } = useBooking();
  const { data: summary, loading } = useAsync(() => api.get('/loyalty/summary'), []);
  const { data: feed } = useAsync(() => api.get('/portal/bookings').catch(() => ({})), []);

  const name = memberName(userData);
  const first = name.split(' ')[0];
  const balance = Number(summary?.balance ?? userData?.tokens ?? 0);
  const tier = summary?.tier || { current: userData?.membershipTier || 'Member', lifetime_wings: userData?.lifetimePointsEarned || 0, progress_percent: 0 };
  const lifetime = Number(tier.lifetime_wings || 0);
  const TierIcon = TIER_ICON[tier.current] || Medal;
  const remaining = tier.next_threshold ? Math.max(0, tier.next_threshold - lifetime) : 0;
  const since = userData?.joinedAt ? new Date(userData.joinedAt).toLocaleString('en-IN', { month: 'short', year: 'numeric' }) : '—';
  const ledger = (summary?.ledger || []).slice(0, 4);
  const rewards = (summary?.catalog || []).slice(0, 2);

  // Every request the member has made (cancelled ones aside): open ones first, newest first.
  const trips = useMemo(() => (bookings || [])
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => Number(isPast(a)) - Number(isPast(b)) || b.createdAt - a.createdAt), [bookings]);

  return (
    <Shell active="home">
      <Page wide>
        <section className="dh-hero">
          <div className="dh-hero-copy">
            <div className="dh-eyebrow">{greeting().toUpperCase()},</div>
            <h1>{first}</h1>
            <span className="dh-rule" />
            <p>Here’s what’s happening with your Bright Wings journey today.</p>
          </div>
          <div className="dh-hero-art" style={{ backgroundImage: `url(${PHOTO.santorini})` }}><em>Further<br />together</em></div>
        </section>

        <section className="dh-row3">
          <div className="pt-card dh-balance">
            <div className="pt-row" style={{ gap: 14 }}>
              <span className="dh-ic"><Coins size={22} /></span>
              <strong className="dh-cardtitle">Available balance</strong>
            </div>
            <div className="pt-row between" style={{ marginTop: 14 }}>
              {loading && !summary ? <Skeleton h={54} w={190} /> : <div className="dh-big">{fmtNum(balance)} <span>Wings</span></div>}
              <button type="button" className="dh-round" aria-label="Open wallet" onClick={() => navigate('/rewards')}><ChevronRight size={20} /></button>
            </div>
            <div className="dh-split"><div><small>Lifetime total</small><b>{fmtNum(lifetime)} Wings</b></div><div><small>Member since</small><b>{since}</b></div></div>
          </div>

          <div className="pt-card dh-tier">
            <div className="pt-row between" style={{ gap: 12 }}>
              <span className="pt-row" style={{ gap: 12, minWidth: 0 }}><span className="dh-crown"><TierIcon size={34} strokeWidth={1.3} /></span><strong className="dh-gold-title">{tierTitle(tier.current)}</strong></span>
              <button type="button" className="pt-link" style={{ textDecoration: 'none', color: 'var(--pt-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => navigate('/tier-benefits')}>View benefits <ChevronRight size={14} /></button>
            </div>
            <div><p className="dh-away">{tier.next_tier ? <>You’re <b>{fmtNum(remaining)} Wings</b> away from {tier.next_tier}</> : 'You’ve reached our highest tier'}</p>
            <Progress value={tier.progress_percent || (tier.next_tier ? 0 : 100)} />
            <div className="pt-row between pt-small" style={{ marginTop: 10, color: 'var(--pt-navy)', fontWeight: 600 }}><span>{fmtNum(lifetime)} Wings</span>{tier.next_threshold && <span>{fmtNum(tier.next_threshold)} Wings</span>}</div></div>
          </div>

          <button type="button" className="dh-card-link" onClick={() => navigate('/membership')} aria-label="Open membership card">
            <MemberCardFace name={summary?.card?.name || name} code={summary?.card?.membership_code || userData?.membershipCode} tier={tier.current} validUntil={summary?.card?.valid_until} />
          </button>
        </section>

        <section className="dh-row2">
          <div className="pt-card dh-trip">
            <div className="pt-row between"><h2 className="dh-sec"><Plane size={20} /> {trips.length ? 'Your trips' : 'Your next trip'}</h2>{trips.length > 0 && <button type="button" className="dh-more" onClick={() => navigate('/bookings')}>View all bookings <ChevronRight size={14} /></button>}</div>
            {trips.length ? (
              <ul className="dh-trips">
                {trips.map((b) => {
                  const svc = serviceOf(b.type);
                  const meta = statusMeta(b.status);
                  const start = svc.date_of(b);
                  const end = b.returnDate || b.checkOut || b.endDate || b.dropoffAt;
                  const advisor = feed?.[b.docId]?.advisor?.name;
                  return (
                    <li key={b.docId}>
                      <button type="button" className="dh-trip-row" onClick={() => navigate(`/bookings/${b.docId}`)}>
                        <span className="dh-trip-thumb" style={{ backgroundImage: `url(${photoFor(b.type, b.destination, b.to, b.hotel, b.region, b.country, b.destinations)})` }} />
                        <span className="dh-trip-info">
                          <small><svc.Icon size={13} /> {svc.label} · Ref. {b.id}</small>
                          <b>{bookingTitle(b)}</b>
                          <span>{start ? (end ? fmtRange(start, end) : /^\d{4}-/.test(String(start)) ? fmtDate(start) : String(start)) : 'Dates to be confirmed'}</span>
                          <span>{advisor ? `Advisor: ${advisor}` : 'Advisor will be assigned soon'}</span>
                        </span>
                        <span className="dh-trip-end"><Badge tone={meta.tone}>{meta.label}</Badge><ChevronRight size={18} /></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="dh-empty"><p>No trips yet. Request your first quote in a couple of minutes.</p><button type="button" className="pt-gold-btn sm" onClick={() => navigate('/bookings/new')}>Book travel</button></div>
            )}
          </div>

          <div className="pt-card dh-actions">
            <h2 className="dh-sec"><Zap size={20} /> Quick actions</h2>
            {[
              ['Book travel', 'Explore amazing destinations', Plane, PHOTO.wing, '/bookings/new'],
              ['Redeem Wings', 'Flights, hotels and more', Gift, PHOTO.resort, '/rewards'],
              ['Refer a friend', 'Share Bright Wings and earn', Users, PHOTO.beach, '/referrals'],
            ].map(([title, sub, Icon, img, to]) => (
              <button type="button" key={title} className="dh-action" onClick={() => navigate(to)}>
                <span className="dh-action-photo" style={{ backgroundImage: `url(${img})` }} />
                <span className="dh-action-ic"><Icon size={22} /></span>
                <span className="dh-action-text"><b>{title}</b><small>{sub}</small></span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>

        <OffersStrip />

        <section className="dh-row2 last">
          <div className="pt-card dh-activity">
            <div className="pt-row between"><h2 className="dh-sec"><ListChecks size={20} /> Recent activity</h2><button type="button" className="dh-more" onClick={() => navigate('/rewards')}>View all activity <ChevronRight size={14} /></button></div>
            {ledger.length === 0 ? <p className="pt-sub" style={{ padding: '20px 0' }}>Your Wings activity will appear here.</p> : (
              <ul>
                {ledger.map((e) => {
                  const Icon = REASON_ICON[e.reason] || Star;
                  const pos = e.points > 0;
                  return (
                    <li key={e.id}>
                      <Icon size={20} className="ic" />
                      <b>{e.source_type === 'redemption_refund' ? 'Redemption refund' : REASON_TITLE[e.reason] || e.reason}</b>
                      <span className="d">{e.description || ''}</span>
                      <span className="t">{fmtDate(e.created_at)}</span>
                      <strong className={pos ? 'pos' : 'neg'}>{pos ? '+' : '−'}{fmtNum(Math.abs(e.points))} Wings</strong>
                      <ChevronRight size={16} className="chev" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="dh-earn" style={{ backgroundImage: bg(`url(${PHOTO.mykonos})`) }}>
            <div>
              <h3>Earn more Wings<br />everywhere you go</h3>
              <p>From flights to hotels and everyday partners, your journeys take you further.</p>
              <button type="button" className="pt-gold-btn sm" onClick={() => navigate('/rewards')}>View rewards <ChevronRight size={16} /></button>
            </div>
            {rewards.length > 0 && <small>{rewards.map((r) => r.name).join(' · ')}</small>}
          </div>
        </section>
      </Page>
    </Shell>
  );
}

