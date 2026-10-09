import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Coins, Crown, Gem, Gift, ListChecks, Medal, Plane, Star, Ticket, UserRound, Users, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import { Badge, Page, Progress, Shell, Skeleton, bg, fmtDate, fmtNum, memberName, useAsync } from '../ui';
import { PHOTO, photoFor } from '../photos';
import { bookingDate, bookingTitle, isPast, serviceOf, statusMeta } from '../booking';
import { MemberCardFace } from '../customer/parts';
import { fmtRange, milestoneDates, nightsBetween } from './common';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const TIER_ICON = { Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };

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
  const tier = summary?.tier || { current: userData?.membershipTier || 'Silver', lifetime_wings: userData?.lifetimePointsEarned || 0, progress_percent: 0 };
  const lifetime = Number(tier.lifetime_wings || 0);
  const TierIcon = TIER_ICON[tier.current] || Medal;
  const remaining = tier.next_threshold ? Math.max(0, tier.next_threshold - lifetime) : 0;
  const since = userData?.joinedAt ? new Date(userData.joinedAt).toLocaleString('en-IN', { month: 'short', year: 'numeric' }) : '—';
  const ledger = (summary?.ledger || []).slice(0, 4);
  const rewards = (summary?.catalog || []).slice(0, 2);

  // "Current trip": the booking nearest in time that is still active, else the latest.
  const trip = useMemo(() => {
    const dated = (b) => { const d = new Date(bookingDate(b)); return Number.isNaN(d.getTime()) ? Infinity : d.getTime(); };
    const active = (bookings || []).filter((b) => !isPast(b)).sort((a, b) => dated(a) - dated(b));
    return active[0] || [...(bookings || [])].sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  }, [bookings]);
  const tripEvents = trip ? feed?.[trip.docId]?.events || [] : [];
  const dates = trip ? milestoneDates(tripEvents, trip) : {};
  const svc = trip ? serviceOf(trip.type) : null;
  const start = trip && svc.date_of(trip);
  const end = trip && (trip.returnDate || trip.checkOut || trip.endDate || trip.dropoffAt);
  const nights = nightsBetween(start, end);
  const meta = trip ? statusMeta(trip.status) : null;

  const steps = trip ? [
    ['Request received', dates.created, Plane, true],
    ['Advisor assigned', dates.assigned, UserRound, !!dates.assigned],
    ['Quotation ready', dates.quote, Ticket, !!dates.quote],
    ['Booking confirmed', dates.confirmed, Building2, !!dates.confirmed],
  ] : [];

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
              <span className="pt-row" style={{ gap: 12, minWidth: 0 }}><span className="dh-crown"><TierIcon size={34} strokeWidth={1.3} /></span><strong className="dh-gold-title">{tier.current} Member</strong></span>
              <button type="button" className="pt-link" style={{ textDecoration: 'none', color: 'var(--pt-muted)', fontWeight: 600 }} onClick={() => navigate('/tier-benefits')}>View benefits <ChevronRight size={14} style={{ verticalAlign: -3 }} /></button>
            </div>
            <div><p className="dh-away">{tier.next_tier ? <>You’re <b>{fmtNum(remaining)} Wings</b> away from {tier.next_tier}</> : 'You’ve reached our highest tier'}</p>
            <Progress value={tier.progress_percent || (tier.next_tier ? 0 : 100)} />
            <div className="pt-row between pt-small" style={{ marginTop: 10, color: 'var(--pt-navy)', fontWeight: 600 }}><span>{fmtNum(lifetime)} Wings</span>{tier.next_threshold && <span>{fmtNum(tier.next_threshold)} Wings</span>}</div></div>
          </div>

          <button type="button" className="dh-card-link" onClick={() => navigate('/membership')} aria-label="Open membership card">
            <MemberCardFace name={name} code={userData?.membershipCode} tier={tier.current} qr={false} compact />
          </button>
        </section>

        <section className="dh-row2">
          <div className="pt-card dh-trip">
            <div className="pt-row between"><h2 className="dh-sec"><Plane size={20} /> {trip ? 'Your current trip' : 'Your next trip'}</h2>{trip && <button type="button" className="dh-more" onClick={() => navigate(`/bookings/${trip.docId}`)}>View booking <ChevronRight size={14} /></button>}</div>
            {trip ? (
              <div className="dh-trip-body">
                <div className="dh-trip-photo" style={{ backgroundImage: `url(${photoFor(trip.type, trip.destination, trip.to, trip.hotel, trip.region)})` }} />
                <div>
                  <h3>{bookingTitle(trip)}</h3>
                  <p className="pt-small" style={{ fontSize: 14, marginTop: 4 }}>{fmtRange(start, end) || 'Dates to be confirmed'}{nights ? ` · ${nights} nights` : ''}</p>
                  <Badge tone={meta.tone} style={{ marginTop: 10 }}><span style={{ fontWeight: 700 }}>✓</span> {meta.label}</Badge>
                  <ol className="dh-steps">
                    {steps.map(([label, at, Icon, done]) => (
                      <li key={label} className={done ? 'done' : ''}>
                        <span className="dh-step-ic"><Icon size={16} /></span>
                        <span><b>{label}</b><small>{done && at ? fmtDate(at) : 'Pending'}</small></span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
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

