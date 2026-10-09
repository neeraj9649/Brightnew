import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChartNoAxesColumn, Clock, Coins as CoinsIcon, Crown, FileText, Gem, Gift, Info, Medal, Plane, RotateCcw, ShieldCheck, Star, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Badge, ErrorState, Page, Progress, Select, Shell, Skeleton, WingsIcon, fmtDate, fmtDateTime, fmtNum, humanize, useAsync } from '../ui';
import { PHOTO } from '../photos';
import { rewardImage } from '../customer/parts';
import { TIERS, TIER_BENEFITS, serviceOf } from '../booking';

const TIER_RANK = { Silver: 0, Gold: 1, Platinum: 2, Titanium: 3 };
const TIER_ICON = { Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };
const RANGES = [['', 'All Wings ranges'], ['0-500', 'Up to 500 Wings'], ['500-1500', '500 – 1,500 Wings'], ['1500-5000', '1,500 – 5,000 Wings'], ['5000-', '5,000+ Wings']];

const activityTitle = (e) => {
  if (e.source_type === 'redemption_refund') return ['Redemption refund', 'Wings returned'];
  switch (e.reason) {
    case 'booking': return [`${serviceOf(e.source_type || '').label} completed`, 'Earned Wings'];
    case 'first_booking': return ['First booking bonus', 'Earned Wings'];
    case 'welcome_bonus': return ['Welcome to Bright Wings', 'Earned Wings'];
    case 'referral': return [e.description?.replace(/^Referral bonus:\s*/, '') || 'Refer a friend', 'Earned Wings'];
    case 'redemption': return [`${(e.description || '').replace(/^Redeemed:\s*/, '') || 'Reward'} redemption`, 'Spent Wings'];
    default: return [e.description || 'Wings adjustment', e.points > 0 ? 'Earned Wings' : 'Spent Wings'];
  }
};

const eligibility = (tier) => {
  if (!tier || tier === 'Silver') return ['For all members', Users];
  return [`For ${tier} members and above`, tier === 'Gold' ? Users : Gift];
};

export function DeskWings({ initialTab = 'rewards', showAllRewards = false }) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [allActivity, setAllActivity] = useState(false);
  const [allRewards, setAllRewards] = useState(showAllRewards);
  const [cat, setCat] = useState('');
  const [range, setRange] = useState('');
  const [dest, setDest] = useState('');
  const summary = useAsync(() => api.get('/loyalty/summary'), []);
  const catalog = useAsync(() => api.get('/redemptions/catalog'), []);
  const config = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);

  const s = summary.data;
  const tier = s?.tier || { current: userData?.membershipTier || 'Silver', lifetime_wings: userData?.lifetimePointsEarned || 0, progress_percent: 0 };
  const balance = Number(s?.balance ?? userData?.tokens ?? 0);
  const lifetime = Number(tier.lifetime_wings || 0);
  const TierGlyph = TIER_ICON[tier.current] || Medal;
  const currentFloor = TIERS.find(([n]) => n === tier.current)?.[1] ?? 0;
  const ledger = s?.ledger || [];
  const items = useMemo(() => catalog.data || [], [catalog.data]);
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const dests = [...new Set(items.map((i) => i.destination).filter(Boolean))];
  const shown = useMemo(() => items.filter((i) => {
    if (cat && i.category !== cat) return false;
    if (dest && i.destination !== dest) return false;
    if (range) { const [lo, hi] = range.split('-'); if (i.wings_cost < Number(lo || 0) || (hi && i.wings_cost > Number(hi))) return false; }
    return true;
  }), [items, cat, dest, range]);
  const visible = allRewards ? shown : shown.slice(0, 3);

  const activity = (
    <section className="dw-activity">
      <div className="pt-row between"><h2 className="dw-h">Recent activity</h2>{ledger.length > 5 && <button type="button" className="dh-more" onClick={() => setAllActivity(!allActivity)}>{allActivity ? 'Show less' : 'View all activity'} <ArrowRight size={14} /></button>}</div>
      <div className="pt-card" style={{ marginTop: 14 }}>
        {summary.loading && !s ? <div style={{ padding: 20 }}><Skeleton h={200} /></div> : ledger.length === 0 ? <p className="pt-sub" style={{ padding: 24 }}>Earn Wings by completing trips and referring friends — your activity will show up here.</p> : (
          <ul>
            {(allActivity ? ledger : ledger.slice(0, 5)).map((e) => {
              const [title, sub] = activityTitle(e);
              const pos = e.points > 0;
              return (
                <li key={e.id}>
                  <span className="d">{fmtDate(e.created_at)}</span>
                  <span><b>{title}</b><small>{sub}</small></span>
                  <strong className={pos ? 'pos' : 'neg'}>{pos ? '+ ' : '− '}{fmtNum(Math.abs(e.points))}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );

  return (
    <Shell active="wings">
      <Page wide>
        <section className="dw-hero" style={{ backgroundImage: `url(${PHOTO.santorini})` }}>
          <div className="dw-hero-fade" />
          <div className="dw-hero-copy"><small>BRIGHT WINGS</small><h1>Your Wings</h1></div>
          <div className="dw-hero-tag">MORE PLACES<br />BRIGHTER DAYS<span /></div>
        </section>

        <section className="pt-card dw-stats">
          <div><span className="dw-stat-ic"><CoinsIcon size={30} strokeWidth={1.4} /></span><div><small>Available balance <Info size={13} /></small><b>{fmtNum(balance)} <i>Wings</i></b></div></div>
          <div><span className="dw-stat-ic"><ChartNoAxesColumn size={30} strokeWidth={1.4} /></span><div><small>Lifetime earned <Info size={13} /></small><b>{fmtNum(lifetime)} <i>Wings</i></b></div></div>
          <div className="dw-tier">
            <span className="dw-medal"><TierGlyph size={34} strokeWidth={1.3} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pt-row between top"><div><b className="pt-serif-h" style={{ fontSize: 24 }}>{tier.current} Member</b><small>{fmtNum(currentFloor)} Wings{tier.next_threshold ? ` to ${fmtNum(tier.next_threshold)} Wings` : ''}</small></div>{tier.next_tier && <div style={{ textAlign: 'right' }}><small>Next tier: <b style={{ color: 'var(--pt-navy)', fontFamily: 'Georgia, serif', fontSize: 17 }}>{tier.next_tier}</b></small><small>{fmtNum(Math.max(0, tier.next_threshold - lifetime))} Wings to go</small></div>}</div>
              <div style={{ margin: '12px 0 6px' }}><Progress value={tier.progress_percent || (tier.next_tier ? 0 : 100)} /></div>
              <div className="pt-row between pt-small" style={{ color: 'var(--pt-navy)', fontWeight: 600 }}><span>{fmtNum(lifetime)}</span>{tier.next_threshold && <span>{fmtNum(tier.next_threshold)}</span>}</div>
            </div>
          </div>
        </section>

        <nav className="dw-tabs" role="tablist">{[['overview', 'Overview'], ['earn', 'Earn Wings'], ['rewards', 'Rewards']].map(([v, l]) => <button type="button" role="tab" aria-selected={tab === v} key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}</nav>

        {tab === 'rewards' && (
          <div className="dw-split">
            {activity}
            <section>
              <div className="pt-row between"><div><h2 className="dw-h">Rewards catalogue</h2><p className="pt-sub" style={{ marginTop: 4, fontSize: 15 }}>Redeem your Wings for exceptional travel experiences.</p></div><button type="button" className="dh-more" onClick={() => setAllRewards(!allRewards)}>{allRewards ? 'Show fewer' : 'View all rewards'} <ArrowRight size={14} /></button></div>
              <div className="dw-filters">
                <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</Select>
                <Select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Wings range">{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                <Select value={dest} onChange={(e) => setDest(e.target.value)} aria-label="Destination"><option value="">All destinations</option>{dests.map((d) => <option key={d}>{d}</option>)}</Select>
              </div>
              {catalog.error ? <ErrorState onRetry={catalog.reload} /> : catalog.loading && !catalog.data ? <div className="dw-cards">{[0, 1, 2].map((i) => <Skeleton key={i} h={360} r={16} />)}</div> : visible.length === 0 ? <div className="pt-card"><p className="pt-sub" style={{ padding: 28, textAlign: 'center' }}>{items.length ? 'No rewards match those filters.' : 'New rewards are added regularly. Please check back soon.'}</p></div> : (
                <div className="dw-cards">
                  {visible.map((r) => {
                    const [label, Icon] = eligibility(r.min_tier);
                    const locked = TIER_RANK[tier.current] < TIER_RANK[r.min_tier || 'Silver'];
                    return (
                      <article key={r.id} className="pt-card dw-reward">
                        <div className="dw-reward-photo" style={{ backgroundImage: `url(${rewardImage(r)})` }}>{r.stock === 0 && <span className="pt-badge red" style={{ position: 'absolute', top: 10, right: 10 }}>Out of stock</span>}</div>
                        <div className="dw-reward-body">
                          <span className="dw-cat">{r.category || 'Reward'}</span>
                          <h3>{r.name}</h3>
                          <div className="dw-cost">{fmtNum(r.wings_cost)} <i>Wings</i></div>
                          <p>{r.description || r.reward_value}</p>
                          <div className={`dw-elig ${locked ? 'locked' : ''}`}><Icon size={18} /> {label}</div>
                          <button type="button" className="pt-navy-btn full" onClick={() => navigate(`/rewards/catalog/${r.id}`)}>View reward <ArrowRight size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              <button type="button" className="pt-link" style={{ marginTop: 14, color: 'var(--pt-blue)' }} onClick={() => navigate('/rewards/redemptions')}>My redemptions & vouchers →</button>
            </section>
          </div>
        )}

        {tab === 'overview' && (
          <div className="dw-split">
            {activity}
            <section className="pt-stack lg">
              <div className="pt-card" style={{ padding: 26 }}>
                <h2 className="dw-h" style={{ marginBottom: 18 }}>Your tier journey</h2>
                <div className="pt-tier-rail">
                  {TIERS.map(([name, threshold], i) => {
                    const Ico = TIER_ICON[name];
                    const idx = TIER_RANK[tier.current];
                    return <div key={name} className={`pt-tier-node ${i === idx ? 'current' : i < idx ? 'reached' : ''}`}><span className="pt-tier-dot"><Ico size={20} /></span><span>{name}</span><small>{fmtNum(threshold)} Wings</small></div>;
                  })}
                </div>
                <h3 className="pt-h3" style={{ margin: '24px 0 10px' }}>{tier.current} benefits (illustrative)</h3>
                <ul className="dw-checks">{(TIER_BENEFITS[tier.current] || []).map((b) => <li key={b}><Check size={15} strokeWidth={3} />{b}</li>)}</ul>
                <button type="button" className="pt-link" style={{ marginTop: 14, color: 'var(--pt-blue)' }} onClick={() => navigate('/tier-benefits')}>See all tier benefits →</button>
              </div>
              <div className="pt-notice"><Info size={18} /><div><strong>Your tier never drops</strong>It follows your lifetime Wings, so redeeming rewards doesn’t affect it.</div></div>
            </section>
          </div>
        )}

        {tab === 'earn' && (
          <section style={{ marginTop: 6 }}>
            <h2 className="dw-h">Ways to earn Wings</h2>
            <p className="pt-sub" style={{ marginTop: 4, fontSize: 15 }}>Wings are credited after your trip is completed. Rates are set by Bright Wings and shown live.</p>
            <div className="dw-earn-grid">
              {[['Welcome bonus', config.data?.welcome_bonus, 'When you join', Gift], ['First completed booking', config.data?.first_booking, 'Bonus, once', Plane], ['Refer a friend', config.data?.referral_booking, 'When they complete their first booking', Users]].map(([t, v, sub, Icon]) => (
                <div key={t} className="pt-card dw-earn"><span className="dw-stat-ic"><Icon size={26} strokeWidth={1.4} /></span><div><b>{t}</b><small>{sub}</small></div><strong>{v != null ? `+${fmtNum(v)}` : '—'}</strong></div>
              ))}
            </div>
            <h3 className="pt-h3" style={{ margin: '26px 0 12px' }}>Earn on every service</h3>
            <div className="dw-earn-grid">
              {(config.data?.services || []).map((sv) => (
                <div key={sv.booking_type} className="pt-card dw-earn"><span className="dw-stat-ic"><WingsIcon size={26} color="#c9963e" /></span><div><b>{humanize(sv.booking_type)}</b><small>After completed booking</small></div><strong>+{fmtNum(sv.points)}</strong></div>
              ))}
            </div>
            <div className="pt-row" style={{ gap: 12, marginTop: 26 }}><button type="button" className="pt-gold-btn" onClick={() => navigate('/bookings/new')}>Request new travel <ArrowRight size={18} /></button><button type="button" className="pt-navy-btn ghost" style={{ minHeight: 54 }} onClick={() => navigate('/referrals')}>Refer a friend</button></div>
          </section>
        )}
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------------------ reward detail */

const STEP_LABELS = [['Submitted', 'created_at', null], ['Under review', null, 'Our team is reviewing your request'], ['Approved', 'approved_at', 'You’ll receive your voucher'], ['Voucher delivered', 'issued_at', 'Use on your booking']];

export function DeskRewardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, refreshUser } = useAuth();
  const catalog = useAsync(() => api.get('/redemptions/catalog'), []);
  const mine = useAsync(() => api.get('/redemptions/me').catch(() => []), []);
  const [busy, setBusy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const item = (catalog.data || []).find((i) => i.id === id);
  const latest = (mine.data || []).find((r) => r.reward_item_id === id);
  const balance = Number(userData?.tokens || 0);
  const tier = userData?.membershipTier || 'Silver';

  const frame = (body) => <Shell active="wings"><Page wide>{body}</Page></Shell>;
  if (catalog.loading && !catalog.data) return frame(<div className="pt-stack" style={{ marginTop: 34 }}><Skeleton h={50} w={380} /><Skeleton h={380} r={18} /></div>);
  if (catalog.error) return frame(<div style={{ marginTop: 34 }}><ErrorState onRetry={catalog.reload} /></div>);
  if (!item) return frame(<div className="pt-card" style={{ margin: '34px 0', padding: 40, textAlign: 'center' }}><Gift size={34} /><h2 className="pt-h2" style={{ margin: '10px 0' }}>This reward is no longer available</h2><button type="button" className="pt-navy-btn" onClick={() => navigate('/rewards')}>Browse rewards</button></div>);

  const locked = TIER_RANK[tier] < TIER_RANK[item.min_tier || 'Silver'];
  const out = item.stock === 0;
  const short = balance < item.wings_cost;
  const open = latest && ['requested', 'approved', 'voucher_issued'].includes(latest.status);
  const terms = String(item.terms || 'Subject to availability and partner participation.').split(/\n+/).map((t) => t.trim()).filter(Boolean);
  const reason = locked ? `This reward is for ${item.min_tier} members and above` : out ? 'Currently out of stock' : short ? `You need ${fmtNum(item.wings_cost - balance)} more Wings` : '';

  const confirm = async () => {
    setBusy(true);
    try { await api.post('/redemptions', { reward_item_id: item.id }); await Promise.all([refreshUser(), mine.reload(), catalog.reload()]); toast.success('Redemption requested. We’ll review it shortly.'); } catch (e) { toast.error(e.message || 'We could not submit your request'); } finally { setBusy(false); }
  };

  const status = latest?.status;
  const stepDone = [!!latest, !!latest && status !== 'requested', !!latest?.approved_at, !!latest?.issued_at];

  return frame(
    <>
      <button type="button" className="pt-back" style={{ marginTop: 26 }} onClick={() => navigate('/rewards')}><ArrowLeft size={17} /> Back to all rewards</button>
      <div className="dr-grid">
        <div style={{ minWidth: 0 }}>
          <h1 className="pt-title" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 8 }}>{item.name}</h1>
          <p className="pt-lede">{item.description || `Elevate your next journey with a special reward from Bright Wings.`}</p>
          <div className="dr-photo" style={{ backgroundImage: `url(${rewardImage(item)})` }} />
          <div className="dr-feats">
            {[[Clock, `Valid for ${item.validity_days} days`, 'from the date it is issued'], [ShieldCheck, 'Reviewed by our team', 'before your voucher is issued'], [RotateCcw, 'Refunded if declined', 'your Wings return in full']].map(([Icon, a, b]) => <div key={a}><Icon size={30} strokeWidth={1.3} /><span><b>{a}</b><small>{b}</small></span></div>)}
          </div>
          <h2 className="pt-serif-h" style={{ marginTop: 26 }}>About this reward</h2>
          <p className="pt-sub" style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>{item.reward_value ? `${item.reward_value}. ` : ''}{item.description}</p>
          <section className="pt-card dr-terms">
            <h3>Key details &amp; conditions</h3>
            <ul>{(showTerms ? terms : terms.slice(0, 5)).map((t) => <li key={t}><FileText size={18} />{t}</li>)}<li><Star size={18} />Other terms and partner-specific conditions may apply.</li></ul>
            {terms.length > 5 && <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => setShowTerms(!showTerms)}>{showTerms ? 'Show fewer terms' : 'View full terms and conditions →'}</button>}
          </section>
        </div>

        <aside className="pt-stack lg" style={{ minWidth: 0 }}>
          <section className="pt-card dr-redeem">
            <h2 className="pt-serif-h" style={{ fontSize: 26 }}>Redeem this reward</h2>
            <div className="dr-mini"><div style={{ backgroundImage: `url(${rewardImage(item)})` }} /><span><b>{item.name}</b><small>{item.category}</small></span><strong>{fmtNum(item.wings_cost)}<small>Wings</small></strong></div>
            <div className="dr-rows">
              <div><span>Your current Wings balance</span><b>{fmtNum(balance)} Wings</b></div>
              <div><span>Wings required for this reward</span><b>{fmtNum(item.wings_cost)} Wings</b></div>
              <div className="total"><span>Your remaining balance after redemption</span><b style={{ color: balance - item.wings_cost < 0 ? 'var(--pt-red)' : undefined }}>{fmtNum(balance - item.wings_cost)} Wings</b></div>
            </div>
            {open ? <div className="pt-notice green" style={{ marginTop: 16 }}><Check size={18} /><div><strong>Request {latest.display_code}</strong>You already have an active request for this reward.</div></div> : (
              <>
                <button type="button" className="pt-gold-btn full" style={{ marginTop: 16 }} disabled={busy || !!reason} onClick={confirm}>{busy ? 'Submitting…' : 'Confirm redemption'}</button>
                {reason && <p className="pt-err-text" style={{ marginTop: 10, justifyContent: 'center' }}><Info size={14} /> {reason}</p>}
                <button type="button" className="pt-link" style={{ display: 'block', margin: '14px auto 0', color: 'var(--pt-navy)' }} onClick={() => navigate('/rewards')}>Cancel</button>
              </>
            )}
            <div className="dr-how"><span><Info size={20} /></span><div><b>How it works</b><ul>
              <li>{fmtNum(item.wings_cost)} Wings are reserved (debited) from your wallet when you submit this redemption request.</li>
              <li><b>This is the only debit.</b> Approval does not debit additional Wings.</li>
              <li>If your request is rejected, the {fmtNum(item.wings_cost)} Wings will be automatically refunded to your Wings wallet.</li>
            </ul></div></div>
          </section>

          <section className="pt-card dr-redeem">
            <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 24 }}>Redemption status</h2>{latest ? <Badge tone={{ requested: 'amber', approved: 'blue', voucher_issued: 'green', delivered: 'green', rejected: 'red', cancelled: '' }[status]}><Clock size={13} /> {{ requested: 'Pending staff approval', approved: 'Approved', voucher_issued: 'Voucher issued', delivered: 'Delivered', rejected: 'Rejected · Wings refunded', cancelled: 'Cancelled · Wings refunded' }[status]}</Badge> : <Badge tone="amber"><Clock size={13} /> Not yet requested</Badge>}</div>
            <ol className="dr-steps">
              {STEP_LABELS.map(([label, key, hint], i) => (
                <li key={label} className={stepDone[i] ? 'done' : ''}>
                  <span>{stepDone[i] ? <Check size={16} strokeWidth={3} /> : null}</span>
                  <b>{label}</b>
                  <small>{stepDone[i] ? fmtDateTime(key ? latest?.[key] : latest?.updated_at) : hint || (i === 0 ? 'After you confirm' : '')}</small>
                </li>
              ))}
            </ol>
            <div className="pt-notice plain" style={{ marginTop: 18 }}><Info size={18} /><div>If the request is rejected, your {fmtNum(item.wings_cost)} Wings will be refunded to your Wings wallet. You’ll be notified in your account.</div></div>
            {latest && status === 'voucher_issued' && latest.voucher_code && <button type="button" className="pt-navy-btn full" style={{ marginTop: 14 }} onClick={() => navigate(`/rewards/redemptions/${latest.id}`)}>View voucher <ArrowRight size={16} /></button>}
          </section>
        </aside>
      </div>
    </>,
  );
}

export function DeskCatalogRoute() {
  return <DeskWings initialTab="rewards" showAllRewards />;
}

