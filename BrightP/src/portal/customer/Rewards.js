import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Clock, Copy, Download, Gift, HelpCircle, Info, Plane, RotateCcw, Star, Users, X, Building2, Armchair, Hourglass, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  AppBar, Badge, BellButton, Card, Check2, Empty, ErrorState, Hero, IMG, Notice, Page, Progress, RupeeCoin, Select, Shell, Skeleton, WingsIcon,
  Chips, fmtDate, fmtDateTime, fmtNum, humanize, memberName, useAsync, useCopy, useWide,
} from '../ui';
import { RewardArt, TierIcon } from './parts';

const REASON_LABEL = {
  welcome_bonus: ['Welcome to Bright Wings', Gift], first_booking: ['First booking bonus', Gift], booking: ['Wings earned on a trip', Plane],
  referral: ['Friend referral', Users], manual: ['Wings added', Star], redemption: ['Reward redemption', Gift],
};

export const REDEMPTION_STATUS = {
  requested: { label: 'Awaiting staff approval', tone: 'amber', icon: Clock },
  approved: { label: 'Approved', tone: 'blue', icon: Check },
  voucher_issued: { label: 'Voucher issued', tone: 'green', icon: Check },
  delivered: { label: 'Delivered', tone: 'green', icon: Check },
  rejected: { label: 'Rejected', tone: 'red', icon: X },
  cancelled: { label: 'Cancelled', tone: '', icon: X },
};

const termLines = (terms) => String(terms || 'Subject to availability and partner participation.').split(/\n+/).map((t) => t.trim()).filter(Boolean);

/* -------------------------------------------------------------------- wallet */

export function Wallet() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: summary, loading, error, reload } = useAsync(() => api.get('/loyalty/summary'), []);
  const [tab, setTab] = useState('all');

  const tier = summary?.tier;
  const balance = Number(summary?.balance ?? userData?.tokens ?? 0);
  const ledger = (summary?.ledger || []).filter((e) => tab === 'all' || (tab === 'earned' ? e.points > 0 && e.source_type !== 'redemption_refund' : e.points < 0 || e.source_type === 'redemption_refund'));
  const first = memberName(userData).split(' ')[0];
  const remaining = tier?.next_threshold ? Math.max(0, tier.next_threshold - tier.lifetime_wings) : 0;

  const body = (
    <div className="pt-stack lg">
      <Card style={{ marginTop: wide ? 0 : -50, position: 'relative' }}>
        <div className="pt-row between" style={{ marginBottom: 14 }}><h2 className="pt-h2" style={{ fontSize: 17 }}>Your Wings wallet</h2><Info size={17} style={{ color: 'var(--pt-faint)' }} /></div>
        {loading && !summary ? <Skeleton h={60} r={14} /> : error ? <ErrorState onRetry={reload} /> : (
          <>
            <div className="pt-grid2" style={{ alignItems: 'center' }}>
              <div className="pt-row"><RupeeCoin size={44} /><div><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{fmtNum(balance)}</strong><div className="pt-small">Wings available</div></div></div>
              <div className="pt-row" style={{ borderLeft: '1px solid var(--pt-line)', paddingLeft: 16 }}><span className="pt-coin sm" style={{ background: '#f6e7c2', color: '#9b6b21' }}><Star size={15} /></span><div><strong style={{ fontSize: 20, color: 'var(--pt-navy)' }}>{fmtNum(tier?.lifetime_wings)}</strong><div className="pt-small">Lifetime Wings</div></div></div>
            </div>
            <div className="pt-notice gold" style={{ marginTop: 16, display: 'block' }}>
              <div className="pt-row"><TierIcon tier={tier?.current} size={22} /><div><strong style={{ margin: 0 }}>{tier?.current} Member</strong>{tier?.next_tier ? `Earn ${fmtNum(remaining)} more Wings to reach ${tier.next_tier} (${fmtNum(tier.next_threshold)} lifetime Wings)` : 'You’ve reached our highest tier'}</div></div>
              {tier?.next_tier && <div className="pt-row" style={{ gap: 10, marginTop: 10 }}><div style={{ flex: 1 }}><Progress value={tier.progress_percent} /></div><span className="pt-small">{fmtNum(remaining)} to go</span></div>}
            </div>
            <button type="button" className="pt-btn full" style={{ marginTop: 14 }} onClick={() => navigate('/rewards/catalog')}><Gift size={18} /> Redeem rewards <ChevronRight size={18} /></button>
          </>
        )}
      </Card>

      <Card>
        <div className="pt-row between" style={{ marginBottom: 12 }}><h2 className="pt-h2" style={{ fontSize: 17 }}>Wings activity</h2><button type="button" className="pt-link gold" onClick={() => navigate('/rewards/redemptions')}>Redemption history</button></div>
        <div className="pt-seg" style={{ marginBottom: 6 }}>
          {[['all', 'All'], ['earned', 'Earned'], ['redeemed', 'Redeemed']].map(([v, l]) => <button type="button" key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)} style={tab === v ? { background: '#f6e2b5', color: 'var(--pt-navy)', boxShadow: 'none' } : undefined}>{l}</button>)}
        </div>
        {loading && !summary ? <div className="pt-stack" style={{ marginTop: 10 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={44} />)}</div> : ledger.length === 0 ? <Empty icon={WingsIconLg} title="No activity yet">Earn Wings by completing trips and referring friends.</Empty> : ledger.map((e) => {
          const [label, Ico] = e.source_type === 'redemption_refund' ? ['Redemption refund', RotateCcw] : REASON_LABEL[e.reason] || [humanize(e.reason), Star];
          const pos = e.points > 0;
          return (
            <div key={e.id} className="pt-row" style={{ padding: '13px 0', borderTop: '1px solid var(--pt-line)' }}>
              <Ico size={22} style={{ color: 'var(--pt-navy)', flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}><div className="pt-item-title" style={{ fontSize: 14 }}>{e.description && e.reason === 'booking' ? e.description : label}</div><div className="pt-small">{fmtDate(e.created_at)}</div></div>
              <Badge tone={pos ? 'green' : 'red'}>{pos ? 'Earned' : 'Redeemed'}</Badge>
              <strong style={{ width: 64, textAlign: 'right', color: pos ? 'var(--pt-green)' : 'var(--pt-red)' }}>{pos ? '+' : '−'}{fmtNum(Math.abs(e.points))}</strong>
            </div>
          );
        })}
      </Card>
    </div>
  );

  if (wide) return <Shell active="wings"><Page><div style={{ margin: '6px 0 18px' }}><h1 className="pt-h1">Hello, {first}</h1><p className="pt-sub">Journeys make a brighter you</p></div>{body}</Page></Shell>;
  return (
    <Shell active="wings" topbar={false}>
      <Hero image={IMG.palace} right={<BellButton light />} style={{ minHeight: 215, paddingBottom: 70 }}>
        <div><h1 style={{ fontSize: 28 }}>Hello, {first}</h1><p style={{ marginTop: 4 }}>Journeys make a brighter you</p></div>
      </Hero>
      <Page>{body}</Page>
    </Shell>
  );
}

const WingsIconLg = (props) => <WingsIcon size={34} {...props} />;

/* ------------------------------------------------------------------- catalog */

function useCatalog() {
  return useAsync(() => api.get('/redemptions/catalog'), []);
}

export function Catalog() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: items, loading, error, reload } = useCatalog();
  const [category, setCategory] = useState('All');
  const balance = Number(userData?.tokens || 0);
  const categories = useMemo(() => ['All', ...new Set((items || []).map((i) => i.category).filter(Boolean))], [items]);
  const shown = (items || []).filter((i) => category === 'All' || i.category === category);

  return (
    <Shell active="wings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Rewards" onBack={() => navigate('/rewards')} right={<BellButton />} /></div>}
      <Page>
        <div style={{ margin: '4px 0 14px' }}><h1 className="pt-h1">Rewards catalog</h1><p className="pt-sub" style={{ marginTop: 5 }}>Turn your Wings into meaningful travel moments.</p></div>
        <div className="pt-stack lg">
          <button type="button" className="pt-item" onClick={() => navigate('/rewards')} style={{ background: 'var(--pt-gold-soft)', borderColor: '#e8cd93' }}>
            <RupeeCoin size={42} />
            <div className="pt-item-body"><div className="pt-small">Available Wings</div><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{fmtNum(balance)}</strong></div>
            <ChevronRight size={20} style={{ color: 'var(--pt-muted)' }} />
          </button>
          {categories.length > 2 && <Chips scroll options={categories} value={category} onChange={setCategory} />}
          {loading && !items ? <div className="pt-stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={100} r={16} />)}</div> : error ? <ErrorState onRetry={reload} /> : shown.length === 0 ? <Card><Empty icon={Gift} title="No rewards here yet">New rewards are added regularly. Please check back soon.</Empty></Card> : (
            <div className="pt-stack" style={wide ? { gridTemplateColumns: 'repeat(2, minmax(0,1fr))' } : undefined}>
              {shown.map((item) => {
                const short = balance < item.wings_cost;
                const out = item.stock === 0;
                return (
                  <button type="button" key={item.id} className="pt-item" style={{ padding: 10 }} onClick={() => navigate(`/rewards/catalog/${item.id}`)}>
                    <RewardArt item={item} height={84} style={{ width: 104, borderRadius: 12, flex: 'none' }} />
                    <div className="pt-item-body">
                      <Badge tone="amber" style={{ fontSize: 10, padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.category || 'Reward'}</Badge>
                      <div className="pt-item-title" style={{ marginTop: 6 }}>{item.name}</div>
                      <div className="pt-item-sub" style={{ marginTop: 2 }}>{item.reward_value || item.description}</div>
                      <div className="pt-row" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}><span className="pt-row" style={{ gap: 6 }}><RupeeCoin size={22} /><strong style={{ color: 'var(--pt-navy)', fontSize: 15 }}>{fmtNum(item.wings_cost)} Wings</strong></span>{out ? <Badge tone="red" style={{ fontSize: 10 }}>Out of stock</Badge> : short && <Badge tone="red" style={{ fontSize: 10 }}>Not enough Wings</Badge>}</div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--pt-faint)' }} />
                  </button>
                );
              })}
            </div>
          )}
          <Notice icon={Info}>Rewards are subject to availability and approval. Blackout dates and additional terms may apply.</Notice>
        </div>
      </Page>
    </Shell>
  );
}

function useReward(id) {
  return useAsync(async () => {
    const list = await api.get('/redemptions/catalog');
    return (list || []).find((i) => i.id === id) || null;
  }, [id]);
}

const REWARD_ICON = { Stay: Building2, 'Hotel Stays': Building2, Travel: Plane, 'Airport Services': Armchair };

export function RewardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: item, loading, error, reload } = useReward(id);
  const balance = Number(userData?.tokens || 0);
  const frame = (content) => (
    <Shell active="wings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Reward details" onBack={() => navigate('/rewards/catalog')} /></div>}
      <Page>{content}</Page>
    </Shell>
  );
  if (loading && !item) return frame(<div className="pt-stack"><Skeleton h={190} r={18} /><Skeleton h={140} r={16} /></div>);
  if (error) return frame(<ErrorState onRetry={reload} />);
  if (!item) return frame(<Card><Empty icon={Gift} title="This reward is no longer available" action={<button type="button" className="pt-btn sm" onClick={() => navigate('/rewards/catalog')}>Browse rewards</button>}>It may have been retired or hidden by the Bright Wings team.</Empty></Card>);
  const short = balance < item.wings_cost;
  const out = item.stock === 0;
  const Ico = REWARD_ICON[item.category] || Gift;
  return frame(
    <div className="pt-stack lg">
      <RewardArt item={item} height={wide ? 280 : 200} style={{ borderRadius: 20 }} />
      <div>
        <Badge tone="amber" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>{item.category || 'Reward'}</Badge>
        <h1 className="pt-h1" style={{ marginTop: 8 }}>{item.name}</h1>
        <div className="pt-row" style={{ marginTop: 8 }}><RupeeCoin size={26} /><strong style={{ fontSize: 22, color: 'var(--pt-gold-dark)' }}>{fmtNum(item.wings_cost)} Wings</strong></div>
        <p className="pt-sub" style={{ marginTop: 10 }}>{item.description}</p>
      </div>
      <Card pad={false}>
        <div style={{ padding: '4px 18px' }}>
          {[[Ico, 'Reward value', item.reward_value || item.name], [Clock, 'Validity', `${item.validity_days} days from approval`], [Users, 'Eligibility', 'For Bright Wings members only'], [Hourglass, 'Approval required', 'Your request will be reviewed before the reward is issued.']].map(([I, k, v], i) => (
            <div key={k} className="pt-row top" style={{ padding: '14px 0', borderTop: i ? '1px solid var(--pt-line)' : 0 }}><I size={20} style={{ color: 'var(--pt-navy)', flex: 'none', marginTop: 2 }} /><div className="pt-row between top" style={{ flex: 1, gap: 20 }}><strong style={{ fontSize: 13, color: 'var(--pt-navy)', minWidth: 110 }}>{k}</strong><span className="pt-small" style={{ textAlign: 'right' }}>{v}</span></div></div>
          ))}
        </div>
      </Card>
      <div><h3 className="pt-h3" style={{ marginBottom: 8 }}>Terms &amp; conditions</h3><ul className="pt-sub" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 5 }}>{termLines(item.terms).map((t) => <li key={t}>{t}</li>)}</ul></div>
      <div className="pt-sticky-cta">
        <button type="button" className="pt-btn full" disabled={short || out} onClick={() => navigate(`/rewards/catalog/${item.id}/confirm`)}>{out ? 'Currently out of stock' : short ? `You need ${fmtNum(item.wings_cost - balance)} more Wings` : `Redeem for ${fmtNum(item.wings_cost)} Wings`}</button>
      </div>
    </div>,
  );
}

export function ConfirmRedemption() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wide = useWide();
  const { userData, refreshUser } = useAuth();
  const { data: item, loading, error, reload } = useReward(id);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const balance = Number(userData?.tokens || 0);
  const frame = (content) => (
    <Shell active="wings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Confirm redemption" onBack={() => navigate(`/rewards/catalog/${id}`)} /></div>}
      <Page>{content}</Page>
    </Shell>
  );
  if (loading && !item) return frame(<Skeleton h={300} r={18} />);
  if (error) return frame(<ErrorState onRetry={reload} />);
  if (!item) return frame(<Card><Empty icon={Gift} title="This reward is no longer available" /></Card>);

  const after = balance - item.wings_cost;
  const submit = async () => {
    setBusy(true);
    try {
      const created = await api.post('/redemptions', { reward_item_id: item.id });
      await refreshUser();
      navigate(`/rewards/redemptions/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'We could not submit your request');
    } finally { setBusy(false); }
  };
  const steps = [['Request submitted', `${fmtNum(item.wings_cost)} Wings will be reserved from your wallet.`, Clock], ['Under review', 'We’ll review your request (usually within 24 hours).', Hourglass], ['Approved', 'You’ll receive a confirmation and the reward will be issued.', Check], ['If not approved', `Your ${fmtNum(item.wings_cost)} Wings will be fully refunded to your wallet.`, X]];
  return frame(
    <div className="pt-stack lg">
      <Card><div className="pt-row"><RewardArt item={item} height={70} style={{ width: 82, borderRadius: 12, flex: 'none' }} /><div><Badge tone="amber" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.category}</Badge><div className="pt-item-title" style={{ marginTop: 5 }}>{item.name}</div><div className="pt-small">{item.reward_value || item.description}</div><div className="pt-row" style={{ marginTop: 6, gap: 6 }}><RupeeCoin size={20} /><strong style={{ color: 'var(--pt-navy)' }}>{fmtNum(item.wings_cost)} Wings</strong></div></div></div></Card>
      <div className="pt-card pad" style={{ background: '#f4f1ea', boxShadow: 'none' }}>
        <h3 className="pt-h3" style={{ marginBottom: 8 }}>Order summary</h3>
        <div className="pt-kv"><span>Available Wings</span><strong>{fmtNum(balance)}</strong></div>
        <div className="pt-kv"><span>Reward cost</span><strong>− {fmtNum(item.wings_cost)}</strong></div>
        <div className="pt-kv" style={{ borderTopColor: 'var(--pt-line-strong)' }}><span style={{ color: 'var(--pt-navy)', fontWeight: 700 }}>Balance after request</span><strong style={{ fontSize: 18, color: after < 0 ? 'var(--pt-red)' : undefined }}>{fmtNum(after)}</strong></div>
      </div>
      <Notice icon={Clock}>Wings are reserved while your request is reviewed; refunded if rejected.</Notice>
      <div>
        <h3 className="pt-h3" style={{ marginBottom: 10 }}>What happens next?</h3>
        <div className="pt-vtl">{steps.map(([t, s, I], i) => <div key={t} className={`pt-vtl-row ${i === 0 ? 'now' : ''}`}><span className="pt-vtl-dot" style={i === 3 ? { background: '#d8d4cb', borderColor: '#d8d4cb' } : i > 0 ? { background: '#d8d4cb', borderColor: '#d8d4cb' } : undefined}><I size={12} strokeWidth={3} /></span><div className="pt-vtl-body"><strong>{t}</strong><span>{s}</span></div></div>)}</div>
      </div>
      <Check2 checked={agree} onChange={setAgree}>I agree to the <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); navigate(`/rewards/catalog/${item.id}`); }}>terms and conditions</button> for this reward, including eligibility, validity and usage terms.</Check2>
      <div className="pt-sticky-cta"><button type="button" className="pt-btn full" disabled={!agree || busy || after < 0} onClick={submit}>{busy ? 'Submitting…' : 'Confirm request'}</button></div>
    </div>,
  );
}

/* -------------------------------------------------- redemption status / voucher */

function downloadVoucher(r) {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 480;
  const c = canvas.getContext('2d');
  c.fillStyle = '#10283f'; c.fillRect(0, 0, 900, 480);
  c.fillStyle = '#c9963e'; c.fillRect(0, 0, 900, 10);
  c.fillStyle = '#fff'; c.font = '700 34px Georgia, serif'; c.fillText('Bright Wings', 48, 82);
  c.font = '600 22px sans-serif'; c.fillStyle = '#f0c76e'; c.fillText('REWARD VOUCHER', 48, 120);
  c.fillStyle = '#fff'; c.font = '700 40px Georgia, serif'; c.fillText(r.item_name, 48, 205, 800);
  c.font = '500 20px sans-serif'; c.fillStyle = '#c8d3df'; c.fillText(r.reward_value || '', 48, 240);
  c.fillStyle = '#fff'; c.fillRect(48, 275, 804, 96);
  c.fillStyle = '#10283f'; c.font = '700 44px Georgia, serif'; c.fillText(r.voucher_code || '', 74, 340);
  c.fillStyle = '#c8d3df'; c.font = '500 20px sans-serif';
  c.fillText(`Valid till ${fmtDate(r.valid_till)}   ·   Redemption ${r.display_code}`, 48, 418);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png'); a.download = `${r.display_code}-voucher.png`; a.click();
}

export function RedemptionStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { copied, copy } = useCopy();
  const [terms, setTerms] = useState(false);
  const { data: all, loading, error, reload } = useAsync(() => api.get('/redemptions/me'), []);
  const r = (all || []).find((x) => x.id === id);
  const frame = (content, title = 'Redemption') => (
    <Shell active="wings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title={title} onBack={() => navigate('/rewards/redemptions')} /></div>}
      <Page>{content}</Page>
    </Shell>
  );
  if (loading && !all) return frame(<Skeleton h={300} r={18} />);
  if (error) return frame(<ErrorState onRetry={reload} />);
  if (!r) return frame(<Card><Empty icon={Gift} title="We couldn’t find that redemption" action={<button type="button" className="pt-btn sm" onClick={() => navigate('/rewards/redemptions')}>View history</button>} /></Card>);

  const meta = REDEMPTION_STATUS[r.status] || REDEMPTION_STATUS.requested;
  const issued = ['voucher_issued', 'delivered'].includes(r.status);
  const first = memberName(userData).split(' ')[0];

  if (issued || r.status === 'approved') {
    const rows = [
      ['Approved', r.approved_at, 'Your redemption request has been approved.'],
      ['Issued', r.issued_at, 'Your voucher has been issued.'],
      ['Delivered', r.delivered_at || (issued ? r.issued_at : null), 'Your voucher is ready to use.'],
    ];
    return frame(
      <div className="pt-stack lg">
        <RewardArt item={r} height={wide ? 240 : 170} style={{ borderRadius: 20 }} />
        <div><h1 className="pt-h1" style={{ fontSize: 26 }}>{r.item_name}</h1><p className="pt-sub" style={{ marginTop: 6 }}>{r.status === 'approved' ? 'Approved — your voucher is being prepared.' : `Use this voucher on eligible ${/hotel/i.test(r.category || '') ? 'hotel bookings' : 'services'} with Bright Wings.`}</p></div>
        <div className="pt-vtl">{rows.map(([t, at, s]) => { const done = !!at && (r.status !== 'approved' || t === 'Approved'); return <div key={t} className={`pt-vtl-row ${done ? 'done' : ''}`}><span className="pt-vtl-dot">{done && <Check size={12} strokeWidth={3} />}</span><div className="pt-vtl-body"><strong>{t}</strong>{done ? <><span style={{ fontSize: 11 }}>{fmtDateTime(at)}</span><span>{s}</span></> : <span>Pending</span>}</div></div>; })}</div>
        {issued && r.voucher_code && (
          <>
            <div className="pt-code"><div><div className="pt-small">Voucher code</div><strong>{r.voucher_code}</strong></div><button type="button" className="pt-btn ghost sm" onClick={() => copy(r.voucher_code, 'code')}>{copied === 'code' ? <Check size={15} /> : <Copy size={15} />} {copied === 'code' ? 'Copied' : 'Copy code'}</button></div>
            <div className="pt-grid3" style={{ textAlign: 'center' }}>
              <div><Gift size={22} style={{ color: 'var(--pt-navy)' }} /><div className="pt-tiny">Reward value</div><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>{r.reward_value || r.item_name}</strong></div>
              <div><Clock size={22} style={{ color: 'var(--pt-navy)' }} /><div className="pt-tiny">Valid till</div><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>{fmtDate(r.valid_till)}</strong></div>
              <div><Building2 size={22} style={{ color: 'var(--pt-navy)' }} /><div className="pt-tiny">Applicable on</div><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>{r.category || 'Bright Wings services'}</strong></div>
            </div>
          </>
        )}
        <button type="button" className="pt-menu-list" style={{ textAlign: 'left', cursor: 'pointer', width: '100%', display: 'block' }} onClick={() => setTerms(!terms)}>
          <div className="pt-row between" style={{ padding: '14px 16px', background: '#eaf3fb' }}><span className="pt-row"><FileText size={18} /> <strong style={{ fontSize: 13 }}>Terms &amp; conditions</strong></span><ChevronDown size={18} style={{ transform: terms ? 'rotate(180deg)' : undefined }} /></div>
          {terms && <ul className="pt-sub" style={{ margin: 0, padding: '12px 16px 14px 36px', display: 'grid', gap: 5, background: '#fff' }}>{termLines(r.terms).map((t) => <li key={t}>{t}</li>)}</ul>}
        </button>
        {issued && r.voucher_code && <button type="button" className="pt-btn full" onClick={() => downloadVoucher(r)}><Download size={18} /> Download voucher</button>}
      </div>,
      'Reward voucher',
    );
  }

  return frame(
    <div className="pt-stack lg">
      <div><h1 className="pt-h1" style={{ fontSize: 24 }}>Hi {first},</h1><p className="pt-sub" style={{ marginTop: 6 }}>{r.status === 'requested' ? 'Your redemption request has been submitted.' : r.status === 'rejected' ? 'Your redemption request was not approved.' : 'This redemption request was cancelled.'}</p></div>
      <Card>
        <div className="pt-row top" style={{ gap: 14 }}>
          <span className="pt-item-icon round" style={{ width: 62, height: 62, background: meta.tone === 'amber' ? 'var(--pt-amber-soft)' : meta.tone === 'red' ? 'var(--pt-red-soft)' : '#eef1f4', color: meta.tone === 'amber' ? 'var(--pt-amber)' : meta.tone === 'red' ? 'var(--pt-red)' : 'var(--pt-muted)' }}><meta.icon size={28} /></span>
          <div><Badge tone={meta.tone}>{meta.label}</Badge><h2 className="pt-h2" style={{ marginTop: 8 }}>{r.status === 'requested' ? 'Redemption submitted' : humanize(r.status)}</h2><p className="pt-small" style={{ marginTop: 3 }}>{r.status === 'requested' ? 'We’ve received your request and our team will review it shortly.' : r.admin_note || 'Your Wings have been refunded to your wallet.'}</p></div>
        </div>
        <hr className="pt-divider" />
        <div className="pt-kv"><span>Redemption ID</span><strong>{r.display_code}</strong></div>
        <div className="pt-kv"><span>Reward</span><strong>{r.item_name}</strong></div>
        <div className="pt-kv"><span>Wings {r.status === 'requested' ? 'deducted' : 'refunded'}</span><strong>{fmtNum(r.wings_cost)} Wings</strong></div>
        <div className="pt-kv"><span>Date &amp; time</span><strong>{fmtDateTime(r.created_at)}</strong></div>
      </Card>
      {r.status === 'requested' && <Notice icon={Info}>You’ll be notified once it’s approved. After approval, we’ll issue your voucher, and you’ll receive it here.</Notice>}
      <button type="button" className="pt-btn full" onClick={() => navigate('/rewards/redemptions')}>View status</button>
      {r.status === 'requested' && <button type="button" className="pt-btn danger full" onClick={async () => { if (!window.confirm('Cancel this request? Your Wings will be refunded.')) return; try { await api.post(`/redemptions/${r.id}/cancel`); toast.success('Request cancelled. Wings refunded.'); await reload(); } catch (e) { toast.error(e.message); } }}>Cancel request</button>}
      <Card>
        <div className="pt-grid2">
          <div className="pt-row"><RupeeCoin size={34} /><div><strong style={{ fontSize: 17, color: 'var(--pt-navy)' }}>{fmtNum(userData?.tokens)} Wings</strong><div className="pt-tiny">Your Wings balance{r.status === 'requested' ? ' after this redemption' : ''}</div></div></div>
          <div className="pt-row" style={{ borderLeft: '1px solid var(--pt-line)', paddingLeft: 14 }}><Star size={22} style={{ color: 'var(--pt-gold)' }} /><div><strong style={{ fontSize: 17, color: 'var(--pt-navy)' }}>{fmtNum(userData?.lifetimePointsEarned)} Wings</strong><div className="pt-tiny">Lifetime Wings · {userData?.membershipTier}</div></div></div>
        </div>
      </Card>
    </div>,
    r.status === 'requested' ? 'Redemption' : 'Redemption',
  );
}

export function RedemptionHistory() {
  const navigate = useNavigate();
  const wide = useWide();
  const { data, loading, error, reload } = useAsync(() => api.get('/redemptions/me'), []);
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('6');
  const list = (data || []).filter((r) => (status === 'all' || r.status === status || (status === 'delivered' && r.status === 'voucher_issued')) && (range === 'all' || new Date(r.created_at) > new Date(Date.now() - Number(range) * 30 * 864e5)));
  return (
    <Shell active="wings" topbar={wide}>
      {!wide && <div style={{ padding: '0 16px' }}><AppBar title="Redemption history" onBack={() => navigate('/rewards')} right={<BellButton />} /></div>}
      <Page>
        <div style={{ margin: '4px 0 14px' }}><h1 className="pt-h1" style={{ fontSize: 24 }}>Redemption history</h1><p className="pt-sub" style={{ marginTop: 5 }}>View all your reward redemptions and their status.</p></div>
        <div className="pt-stack lg">
          <div className="pt-grid2"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All status</option>{Object.entries(REDEMPTION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select><Select value={range} onChange={(e) => setRange(e.target.value)}><option value="1">Last month</option><option value="6">Last 6 months</option><option value="12">Last 12 months</option><option value="all">All time</option></Select></div>
          {loading && !data ? <div className="pt-stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={110} r={16} />)}</div> : error ? <ErrorState onRetry={reload} /> : list.length === 0 ? <Card><Empty icon={Gift} title="No redemptions found" action={<button type="button" className="pt-btn sm" onClick={() => navigate('/rewards/catalog')}>Browse rewards</button>}>Your reward requests will appear here.</Empty></Card> : (
            <div className="pt-stack">
              {list.map((r) => { const m = REDEMPTION_STATUS[r.status] || REDEMPTION_STATUS.requested; return (
                <button type="button" key={r.id} className="pt-item" style={{ display: 'block', padding: 12 }} onClick={() => navigate(`/rewards/redemptions/${r.id}`)}>
                  <div className="pt-row" style={{ gap: 12 }}>
                    <RewardArt item={r} height={70} style={{ width: 78, borderRadius: 12, flex: 'none' }} />
                    <div className="pt-item-body"><Badge tone={m.tone}><m.icon size={12} /> {m.label}</Badge><div className="pt-item-title" style={{ marginTop: 6, fontSize: 15 }}>{r.item_name}</div><div className="pt-tiny">{r.display_code} · {fmtDate(r.created_at)}</div></div>
                    <strong style={{ color: 'var(--pt-navy)', textAlign: 'right', fontSize: 14 }}>{fmtNum(r.wings_cost)}<br />Wings</strong>
                  </div>
                  {['rejected', 'cancelled'].includes(r.status) && <div className="pt-notice red" style={{ marginTop: 10, padding: '9px 12px' }}><RotateCcw size={16} /><div><strong style={{ margin: 0 }}>{fmtNum(r.wings_cost)} Wings refunded</strong>Refunded on {fmtDateTime(r.rejected_at || r.updated_at)}</div></div>}
                </button>
              ); })}
            </div>
          )}
          <button type="button" className="pt-item" onClick={() => navigate('/support')}><HelpCircle size={22} style={{ color: 'var(--pt-navy)' }} /><div className="pt-item-body"><div className="pt-item-title">Need help?</div><div className="pt-item-sub">If you have any questions about your redemption, please contact our support team.</div></div><ChevronRight size={18} /></button>
        </div>
      </Page>
    </Shell>
  );
}

