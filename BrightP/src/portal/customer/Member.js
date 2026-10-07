import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  Bell, BellRing, Calendar, Check, ChevronDown, ChevronRight, CircleCheck, CircleHelp, Copy, Download, FileText, Gift, Headset, IdCard, Info, LifeBuoy, Lock, LogOut, MessageSquare,
  Plane, Share2, ShieldCheck, Smartphone, Star, UserRound, Users, Camera, ArrowRight, Settings2, Sparkles, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { uploadProfileImage, validateFile } from '../../services/storage';
import {
  AppBar, Avatar, Badge, BellButton, BrightLogo, Card, Check2, Empty, ErrorState, Field, Hero, IMG, Input, Modal, ModalHead, Notice, Page, PinField, Progress, Select, Shell, Skeleton, Switch, TextArea,
  WingsIcon, bg, fmtDate, fmtNum, formatPhone, humanize, maskPhone, memberName, relTime, useAsync, useCopy, useWide, SearchBox, Tabs,
} from '../ui';
import { MemberCardFace, TierIcon, TierRail } from './parts';
import { TermsModal } from './AuthScreens';
import { TIER_BENEFITS, TIERS } from '../booking';

const withBack = (wide, title, onBack, right) => (wide ? null : <div style={{ padding: '0 16px' }}><AppBar title={title} onBack={onBack} right={right} /></div>);

/* ------------------------------------------------------------- notifications */

const NOTE_ICON = { 'fa-gift': Gift, 'fa-coins': Gift, 'fa-user-group': Users, 'fa-file-lines': FileText, 'fa-paper-plane': Plane, 'fa-check-circle': Check, 'fa-flag-checkered': Plane, 'fa-user-tie': UserRound, 'fa-comments': MessageSquare };

export function Notifications() {
  const navigate = useNavigate();
  const wide = useWide();
  const [tab, setTab] = useState('all');
  const { data, loading, error, reload } = useAsync(() => api.get('/notifications/me'), []);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (data && !seen) { setSeen(true); if (data.unread) api.post('/notifications/mark-seen', {}).catch(() => {}); }
  }, [data, seen]);

  const items = data?.items || [];
  const counts = { all: items.length, bookings: items.filter((i) => i.category === 'bookings').length, wings: items.filter((i) => i.category === 'wings').length };
  const shown = items.filter((i) => tab === 'all' || i.category === tab);

  return (
    <Shell active="home" topbar={wide}>
      <Page>
        <h1 className="pt-h1" style={{ margin: wide ? '6px 0 14px' : '22px 0 14px' }}>Notifications</h1>
        <div className="pt-stack lg">
          <div className="pt-seg">{[['all', `All (${counts.all})`], ['bookings', `Bookings (${counts.bookings})`], ['wings', `Wings (${counts.wings})`]].map(([v, l]) => <button type="button" key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}</div>
          {loading && !data ? <div className="pt-stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={92} r={16} />)}</div> : error ? <ErrorState onRetry={reload} /> : shown.length === 0 ? <Card><Empty icon={Bell} title="You’re all caught up">Booking updates, Wings activity and reward news will appear here.</Empty></Card> : (
            <div className="pt-stack">
              {shown.map((n) => {
                const Ico = NOTE_ICON[n.icon] || Bell;
                return (
                  <button key={n.id} type="button" className="pt-item" style={{ alignItems: 'flex-start' }} onClick={() => n.link && navigate(n.link)}>
                    <span className="pt-item-icon round" style={n.kind === 'warning' ? { background: 'var(--pt-red-soft)', color: 'var(--pt-red)' } : n.category === 'bookings' ? { background: 'var(--pt-blue-soft)', color: 'var(--pt-blue)' } : undefined}><Ico size={20} /></span>
                    <div className="pt-item-body">
                      <div className="pt-row between top" style={{ gap: 10 }}><div className="pt-item-title" style={{ fontSize: 14 }}>{n.title}</div><div className="pt-row" style={{ gap: 8, flex: 'none' }}><span className="pt-tiny">{fmtDate(n.created_at)}</span>{!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e3503f' }} />}</div></div>
                      <div className="pt-item-sub">{n.message}</div>
                      {n.amount ? <Badge tone={n.amount > 0 ? 'green' : 'red'} style={{ marginTop: 8 }}>{n.amount > 0 ? '+' : '−'}{fmtNum(Math.abs(n.amount))} Wings</Badge> : null}
                    </div>
                    {n.link && /quote|redemptions/.test(n.link) && <ChevronRight size={18} style={{ color: 'var(--pt-faint)', alignSelf: 'center' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------------------ tier benefits */

export function TierBenefits() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: summary, loading } = useAsync(() => api.get('/loyalty/summary'), []);
  const tier = summary?.tier || { current: userData?.membershipTier || 'Silver', lifetime_wings: userData?.lifetimePointsEarned || 0 };
  const [view, setView] = useState(null);
  const active = view || tier.current;
  const remaining = tier.next_threshold ? Math.max(0, tier.next_threshold - tier.lifetime_wings) : 0;

  return (
    <Shell active="home" topbar={wide}>
      {withBack(wide, 'Tier benefits', () => navigate(-1))}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0 }}>
          <div className="pt-banner" style={{ backgroundImage: bg(IMG.palace), minHeight: 160 }}>
            <h2 style={{ fontSize: 24 }}>Higher journeys<br />bring brighter rewards</h2>
            <p>Explore exclusive benefits at every tier.</p>
          </div>
          <Card><TierRail current={tier.current} /></Card>
          <div className="pt-notice gold" style={{ alignItems: 'center' }}><span className="pt-item-icon round" style={{ background: '#fff' }}><TierIcon tier={tier.current} size={22} /></span><div><strong style={{ fontSize: 15 }}>You’re a {tier.current} member</strong>Enjoy enhanced rewards and travel benefits.</div></div>
          {loading && !summary ? <Skeleton h={90} r={16} /> : tier.next_tier ? (
            <Card>
              <div className="pt-row between"><strong style={{ color: 'var(--pt-navy)' }}>Your progress to {tier.next_tier}</strong><span className="pt-small">{fmtNum(remaining)} Wings to go</span></div>
              <div style={{ margin: '8px 0 10px' }}><strong className="pt-serif" style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{fmtNum(tier.lifetime_wings)}</strong> <span className="pt-small">of {fmtNum(tier.next_threshold)} lifetime Wings</span></div>
              <Progress value={tier.progress_percent} />
            </Card>
          ) : <Notice tone="green" icon={Sparkles}>You’ve reached the highest tier. Thank you for travelling with us.</Notice>}
          <Card>
            <div className="pt-row between" style={{ marginBottom: 12 }}><h2 className="pt-h3">Tier benefits (illustrative)</h2></div>
            <div className="pt-seg" style={{ marginBottom: 12 }}>{TIERS.map(([name]) => <button type="button" key={name} className={active === name ? 'active' : ''} onClick={() => setView(name)} style={active === name ? { background: '#f6e2b5', color: 'var(--pt-navy)', boxShadow: 'none' } : undefined}>{name}</button>)}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
              {(TIER_BENEFITS[active] || []).map((b) => <li key={b} className="pt-row" style={{ gap: 12 }}><span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--pt-gold)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}><Check size={13} strokeWidth={3} /></span><span style={{ fontSize: 14 }}>{b}</span></li>)}
            </ul>
          </Card>
          <Notice icon={Info} title="Tier uses lifetime Wings">Your tier is based on total lifetime Wings earned and never decreases. Redeeming Wings doesn’t affect it. Benefits shown are illustrative; final promotional terms follow the program policy.</Notice>
        </div>
      </Page>
    </Shell>
  );
}

/* ----------------------------------------------------------------- referrals */

export function Referrals() {
  const navigate = useNavigate();
  const wide = useWide();
  const { copied, copy } = useCopy();
  const [how, setHow] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.get('/referrals/activity'), []);
  const code = data?.referral_code || '';
  const link = code ? `${window.location.origin}/auth?ref=${encodeURIComponent(code)}` : '';
  const per = data?.wings_per_friend ?? 50;

  const share = async () => {
    if (!link) return;
    if (navigator.share) { try { await navigator.share({ title: 'Join me on Bright Wings', text: `Join Bright Wings with my code ${code} and start earning Wings.`, url: link }); return; } catch { /* dismissed */ } }
    if (await copy(link, 'link')) toast.success('Link copied. Paste it into any chat.'); else toast.error('Copy is not available in this browser');
  };

  const body = (
    <div className="pt-stack lg">
      <Card style={{ marginTop: wide ? 0 : -48, position: 'relative' }}>
        <div className="pt-row between" style={{ marginBottom: 10 }}><h2 className="pt-h2" style={{ fontSize: 17 }}>Your referral code</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => setHow(true)}>How it works? <Info size={13} style={{ verticalAlign: -2 }} /></button></div>
        {loading && !data ? <Skeleton h={58} r={14} /> : error ? <ErrorState onRetry={reload} /> : (
          <>
            <div className="pt-code" style={{ justifyContent: 'center', position: 'relative' }}><strong>{code || '—'}</strong><button type="button" className="pt-icon-btn" style={{ position: 'absolute', right: 8 }} aria-label="Copy code" onClick={() => copy(code, 'code')}>{copied === 'code' ? <Check size={18} /> : <Copy size={18} />}</button></div>
            <div className="pt-grid2" style={{ marginTop: 12 }}>
              <button type="button" className="pt-btn" onClick={share}><Share2 size={17} /> Share link</button>
              <button type="button" className="pt-btn ghost" onClick={() => copy(link, 'link')} disabled={!link}><Copy size={17} /> {copied === 'link' ? 'Copied' : 'Copy link'}</button>
            </div>
          </>
        )}
      </Card>
      <div className="pt-notice" style={{ alignItems: 'center' }}><Users size={26} /><div><strong style={{ fontSize: 14 }}>Invite friends who love to travel</strong>When they complete their first booking on Bright Wings, you’ll earn {per} Wings. It’s our way of saying thanks for spreading brighter journeys.</div></div>
      <Card>
        <h2 className="pt-h2" style={{ fontSize: 17, marginBottom: 14 }}>Your referral stats</h2>
        <div className="pt-grid3" style={{ textAlign: 'center' }}>
          {[[Users, data?.invited, 'Friends invited'], [CircleCheck, data?.completed, 'Completed first booking'], [WingsIcon, data?.wings_earned, 'Wings earned']].map(([I, v, l], i) => (
            <div key={l} style={{ borderLeft: i ? '1px solid var(--pt-line)' : 0 }}><I size={22} style={{ color: 'var(--pt-gold-dark)' }} /><div><strong style={{ fontSize: 24, color: 'var(--pt-navy)' }}>{loading && !data ? '—' : fmtNum(v)}</strong></div><div className="pt-tiny" style={{ lineHeight: 1.3 }}>{l}</div></div>
          ))}
        </div>
      </Card>
      <button type="button" className="pt-btn ghost full" onClick={() => navigate('/referrals/activity')}>View referral activity <ArrowRight size={17} /></button>
      <HowItWorks open={how} onClose={() => setHow(false)} per={per} />
    </div>
  );

  if (wide) return <Shell active="refer"><Page><h1 className="pt-h1" style={{ margin: '6px 0 4px' }}>Give your friends a brighter start</h1><p className="pt-sub" style={{ marginBottom: 18 }}>Earn {per} Wings after their first completed booking.</p>{body}</Page></Shell>;
  return (
    <Shell active="refer" topbar={false}>
      <Hero image={IMG.lake} right={<BellButton light />} style={{ minHeight: 250, paddingBottom: 70 }}>
        <div><h1 style={{ fontSize: 30 }}>Give your friends<br />a brighter start</h1><p style={{ marginTop: 6, fontSize: 14 }}>Earn {per} Wings after their first completed booking.</p></div>
      </Hero>
      <Page>{body}</Page>
    </Shell>
  );
}

function HowItWorks({ open, onClose, per }) {
  return (
    <Modal open={open} onClose={onClose} label="How referrals work">
      <ModalHead title="How referrals work" onClose={onClose} />
      <ul className="pt-stack" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {[`You earn ${per} Wings after your friend completes their first booking on Bright Wings.`, 'The reward is given exactly once per friend.', 'Cancelled bookings do not qualify.', 'There is no limit to how many friends you can refer.'].map((t, i) => <li key={t} className="pt-row top" style={{ gap: 12 }}><span className="pt-badge gold" style={{ minWidth: 26, justifyContent: 'center' }}>{i + 1}</span><span style={{ fontSize: 14 }}>{t}</span></li>)}
      </ul>
      <button type="button" className="pt-btn full" style={{ marginTop: 20 }} onClick={onClose}>Got it</button>
    </Modal>
  );
}

export function ReferralActivity() {
  const navigate = useNavigate();
  const wide = useWide();
  const { data, loading, error, reload } = useAsync(() => api.get('/referrals/activity'), []);
  const per = data?.wings_per_friend ?? 50;
  return (
    <Shell active="refer" topbar={wide}>
      {withBack(wide, 'Referral activity', () => navigate('/referrals'))}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0 }}>
          <div className="pt-banner" style={{ backgroundImage: bg(IMG.coast), minHeight: 150 }}><h2 style={{ fontSize: 22 }}>Travel is brighter<br />together</h2><p>Every friend’s first completed booking earns you {per} Wings, once per friend.</p></div>
          <h2 className="pt-h2">Referred friends</h2>
          {loading && !data ? <div className="pt-stack">{[0, 1].map((i) => <Skeleton key={i} h={130} r={16} />)}</div> : error ? <ErrorState onRetry={reload} /> : (data?.friends || []).length === 0 ? <Card><Empty icon={Users} title="No referrals yet" action={<button type="button" className="pt-btn sm" onClick={() => navigate('/referrals')}>Share your code</button>}>Friends who join with your code will appear here.</Empty></Card> : (
            <div className="pt-stack">
              {data.friends.map((f) => {
                const credited = f.wings_credited != null;
                return (
                  <Card key={f.id}>
                    <div className="pt-row between top">
                      <div className="pt-row"><span className="pt-avatar" style={{ background: '#e6e9fb', color: '#4a55a8' }}>{f.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span><div><strong style={{ color: 'var(--pt-navy)' }}>{f.name}</strong><div className="pt-small">Joined Bright Wings<br />{fmtDate(f.joined_at)}</div></div></div>
                      <Badge tone={credited ? 'green' : 'amber'}>{credited ? `+${f.wings_credited} Wings credited` : f.first_booking_completed ? 'Crediting soon' : 'First booking pending'}</Badge>
                    </div>
                    <div className="pt-track" style={{ marginTop: 16 }}>
                      {[['Joined', fmtDate(f.joined_at, ''), 'done'], ['First booking', f.first_booking_completed ? fmtDate(f.first_booking_at, '') : 'Pending', f.first_booking_completed ? 'done' : 'now'], [`+${per} Wings`, credited ? 'Credited' : 'Pending', credited ? 'done' : '']].map(([t, s, st]) => (
                        <div key={t} className={`pt-track-node ${st}`}><span className="pt-track-dot">{st === 'done' && <Check size={14} strokeWidth={3} />}</span><span>{t}</span><small>{s}</small></div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <Notice icon={Info} title="How referrals work"><ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'grid', gap: 3 }}><li>You earn {per} Wings after your friend completes their first booking on Bright Wings.</li><li>Reward is given exactly once per friend.</li><li>Cancelled bookings do not qualify.</li><li>There is no limit to how many friends you can refer.</li></ul></Notice>
        </div>
      </Page>
    </Shell>
  );
}

/* -------------------------------------------------------------- membership */

export function MembershipCardPage() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: summary } = useAsync(() => api.get('/loyalty/summary'), []);
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const card = summary?.card;
  const valid = card?.valid_until ? fmtDate(card.valid_until) : '';
  const code = card?.membership_code || userData?.membershipCode;
  const link = `${window.location.origin}/card/${code}`;
  const { copy } = useCopy();

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png'); a.download = `bright-wings-${code}.png`; a.click();
    } catch { toast.error('We could not create the image. Please try again.'); } finally { setBusy(false); }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'My Bright Wings membership', url: link }); return; } catch { /* dismissed */ } }
    if (await copy(link)) toast.success('Verification link copied'); else toast.error('Copy is not available in this browser');
  };

  return (
    <Shell active="account" topbar={wide}>
      {withBack(wide, 'Membership Card', () => navigate('/account'), <BellButton />)}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0, maxWidth: 560, marginInline: 'auto' }}>
          <div><h1 className="pt-h1">Membership Card</h1><p className="pt-sub" style={{ marginTop: 4 }}>Your Bright Wings membership</p></div>
          <div ref={ref}><MemberCardFace name={card?.name || memberName(userData)} code={code} tier={card?.membership_tier || userData?.membershipTier} validUntil={valid} /></div>
          <div className="pt-grid2"><button type="button" className="pt-btn" onClick={download} disabled={busy}><Download size={17} /> {busy ? 'Preparing…' : 'Download card'}</button><button type="button" className="pt-btn soft" onClick={share}><Share2 size={17} /> Share card</button></div>
          <div className="pt-notice gold" style={{ alignItems: 'center' }}><Sparkles size={24} /><div>Show this card or QR code at Bright Wings partner locations to enjoy your member benefits.</div></div>
          <button type="button" className="pt-link" style={{ justifySelf: 'center', color: 'var(--pt-blue)' }} onClick={() => navigate(`/card/${code}`)}>Preview public verification</button>
        </div>
      </Page>
    </Shell>
  );
}

export function PublicCard() {
  const { code } = useParams();
  const { data, loading, error } = useAsync(() => api.get(`/cards/${encodeURIComponent(code)}`), [code]);
  return (
    <div className="pt-app" style={{ background: 'var(--pt-paper)' }}>
      <div style={{ minHeight: '100vh', position: 'relative', backgroundImage: IMG.palace, backgroundSize: 'cover', backgroundPosition: 'center top' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,24,40,.25), rgba(246,242,233,.0) 40%, var(--pt-paper) 92%)' }} />
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', padding: '26px 18px 40px' }}>
          <div className="pt-row" style={{ justifyContent: 'center', gap: 10, color: '#fff', marginBottom: 90 }}><img src={BrightLogo} alt="" style={{ width: 34 }} /><span className="pt-brand-name" style={{ fontSize: 22 }}>Bright Wings</span></div>
          <div className="pt-card pad" style={{ padding: '28px 24px', textAlign: 'center' }}>
            {loading ? <Skeleton h={200} r={14} /> : error || !data ? (
              <div className="pt-stack lg">
                <div className="pt-success-mark" style={{ background: 'var(--pt-red-soft)', color: 'var(--pt-red)', boxShadow: 'none', width: 74, height: 74 }}><ShieldAlert size={34} /></div>
                <div><h1 className="pt-h1" style={{ fontSize: 24 }}>We couldn’t verify this card</h1><p className="pt-sub" style={{ marginTop: 8 }}>This membership code isn’t recognised. Please check the card and scan again, or ask the member for their latest card.</p></div>
              </div>
            ) : (
              <div className="pt-stack lg">
                <div className="pt-success-mark" style={{ width: 74, height: 74, boxShadow: 'none' }}><Check size={36} strokeWidth={2.4} /></div>
                <div><h1 className="pt-h1" style={{ fontSize: 26 }}>Membership verified</h1><p className="pt-sub" style={{ marginTop: 6 }}>This is a valid Bright Wings member.</p></div>
                <div style={{ textAlign: 'left' }}>
                  {[['Name', data.name], ['Member No.', data.membership_code], ['Membership Tier', <span key="t" className="pt-row" style={{ justifyContent: 'flex-end', gap: 6, color: 'var(--pt-gold-dark)' }}><TierIcon tier={data.membership_tier} size={16} /> {data.membership_tier}</span>], ['Valid until', fmtDate(data.valid_until)]].map(([k, v]) => <div key={k} className="pt-kv"><span>{k}</span><strong>{v}</strong></div>)}
                </div>
                <div className="pt-notice gold" style={{ textAlign: 'left', alignItems: 'center' }}><ShieldCheck size={24} /><div>This membership card is valid and recognised by Bright Wings partner locations.</div></div>
              </div>
            )}
          </div>
          <p className="pt-small" style={{ textAlign: 'center', marginTop: 40, letterSpacing: '0.2em', fontSize: 10, fontWeight: 700 }}>TRAVEL FURTHER TOGETHER</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- account */

export function Account() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData, logout, isStaff } = useAuth();
  const [terms, setTerms] = useState(false);
  const { data: summary } = useAsync(() => api.get('/loyalty/summary'), []);
  const tier = summary?.tier?.current || userData?.membershipTier;
  const rows = [
    [[UserRound, 'Profile details', 'View and update your information', '/profile'], [IdCard, 'Membership card', 'View, download or share your card', '/membership'], [Bell, 'Notifications', 'Manage your preferences', '/notification-preferences'], [Lock, 'Security & PIN', 'Change your 4-digit PIN', '/security']],
    [[CircleHelp, 'Help & support', 'Get help or contact us', '/support'], [FileText, 'Terms & policies', 'Read our terms and privacy policy', 'terms']],
  ];
  return (
    <Shell active="account" topbar={wide}>
      <Page>
        <div className="pt-row between" style={{ margin: wide ? '6px 0 16px' : '22px 0 16px' }}><div><h1 className="pt-h1">Account</h1><p className="pt-sub" style={{ marginTop: 4 }}>Manage your profile and preferences</p></div><span className="pt-only-mobile"><BellButton /></span></div>
        <div className="pt-stack lg" style={{ maxWidth: 640 }}>
          <button type="button" className="pt-item" style={{ padding: 16 }} onClick={() => navigate('/profile')}>
            <Avatar user={userData} size="lg" />
            <div className="pt-item-body"><div className="pt-item-title" style={{ fontSize: 18 }}>{memberName(userData)}</div><div className="pt-item-sub"><span style={{ color: 'var(--pt-gold-dark)', fontWeight: 700 }}>{tier} Member</span> &nbsp;•&nbsp; {userData?.membershipCode}</div></div>
            <ChevronRight size={20} style={{ color: 'var(--pt-faint)' }} />
          </button>
          {rows.map((group, gi) => (
            <div key={gi} className="pt-menu-list">
              {group.map(([I, title, sub, path]) => (
                <button type="button" key={title} onClick={() => (path === 'terms' ? setTerms(true) : navigate(path))}>
                  <I size={22} style={{ color: 'var(--pt-navy)', flex: 'none' }} />
                  <span><span className="pt-item-title" style={{ display: 'block' }}>{title}</span><span className="pt-item-sub" style={{ display: 'block' }}>{sub}</span></span>
                  <ChevronRight size={18} className="chev" />
                </button>
              ))}
            </div>
          ))}
          <div className="pt-menu-list">
            {isStaff && <button type="button" onClick={() => navigate('/admin')}><Settings2 size={22} style={{ color: 'var(--pt-navy)' }} /><span className="pt-item-title">Staff workspace</span><ChevronRight size={18} className="chev" /></button>}
            <button type="button" onClick={async () => { await logout().catch(() => {}); navigate('/auth', { replace: true }); }}><LogOut size={22} style={{ color: 'var(--pt-red)' }} /><span className="pt-item-title" style={{ color: 'var(--pt-red)' }}>Sign out</span><ChevronRight size={18} className="chev" /></button>
          </div>
        </div>
      </Page>
      <TermsModal open={terms} onClose={() => setTerms(false)} />
    </Shell>
  );
}

/* -------------------------------------------------------------- edit profile */

const STYLES = ['Comfort', 'Budget', 'Luxury', 'Adventure', 'Cultural', 'Relaxation'];
const COMPANIONS = ['Solo', 'Couple', 'Family', 'Friends', 'Business'];

export function EditProfile() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData, updateUserProfile, refreshUser } = useAuth();
  const { data: prefs, loading } = useAsync(() => api.get('/preferences/me'), []);
  const [name, setName] = useState(memberName(userData));
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { if (prefs && !form) setForm({ departure_city: prefs.departure_city || '', travel_style: prefs.travel_style || '', travelling_with: prefs.travelling_with || '', trip_updates: true }); }, [prefs, form]);
  const f = form || { departure_city: '', travel_style: '', travelling_with: '' };

  const save = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) { toast.error('Please enter your full name'); return; }
    setBusy(true);
    try {
      await updateUserProfile({ displayName: name.trim() });
      await api.put('/preferences/me', { departure_city: f.departure_city, travel_style: f.travel_style, travelling_with: f.travelling_with });
      toast.success('Profile saved');
      navigate('/account');
    } catch (error) { toast.error(error.message || 'We could not save your changes'); } finally { setBusy(false); }
  };

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      validateFile(file, 3 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/jpg']);
      const { file_id: fileId } = await uploadProfileImage(file);
      await api.patch('/users/me', { profile_image_file_id: fileId });
      await refreshUser();
      toast.success('Photo updated');
    } catch (error) { toast.error(error.message || 'We could not upload that photo'); } finally { setPhotoBusy(false); event.target.value = ''; }
  };

  return (
    <Shell active="account" topbar={wide}>
      {withBack(wide, 'Profile', () => navigate('/account'))}
      <Page>
        <form onSubmit={save} className="pt-stack lg" style={{ maxWidth: 640, marginTop: wide ? 16 : 0 }}>
          <div className="pt-row" style={{ gap: 16 }}>
            <Avatar user={userData} size="lg" />
            <div><button type="button" className="pt-btn soft sm" onClick={() => fileRef.current?.click()} disabled={photoBusy}><Camera size={15} /> {photoBusy ? 'Uploading…' : 'Change photo'}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onPhoto} /></div>
          </div>
          <Card>
            <h2 className="pt-h3" style={{ marginBottom: 12 }}>Personal details</h2>
            <div className="pt-stack">
              <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
              <Field label="Phone number" right={<Badge tone="green"><CircleCheck size={12} /> Verified</Badge>}><Input value={formatPhone(userData?.phone)} disabled /></Field>
              <Notice tone="amber" icon={Info}>To change your phone number, please contact our support team for verification.</Notice>
            </div>
          </Card>
          <Card>
            <h2 className="pt-h3" style={{ marginBottom: 12 }}>Travel preferences</h2>
            {loading && !form ? <Skeleton h={150} r={14} /> : (
              <div className="pt-stack">
                <Field label="Preferred departure city"><Input icon={Plane} value={f.departure_city} onChange={(e) => setForm({ ...f, departure_city: e.target.value })} placeholder="Delhi (DEL)" list="bw-dep" /><datalist id="bw-dep">{['Delhi (DEL)', 'Mumbai (BOM)', 'Bengaluru (BLR)', 'Chennai (MAA)', 'Kolkata (CCU)', 'Hyderabad (HYD)', 'Jaipur (JAI)'].map((c) => <option key={c} value={c} />)}</datalist></Field>
                <Field label="Preferred travel style"><Select value={f.travel_style} onChange={(e) => setForm({ ...f, travel_style: e.target.value })}><option value="">Not set</option>{STYLES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label="Travelling with"><Select value={f.travelling_with} onChange={(e) => setForm({ ...f, travelling_with: e.target.value })}><option value="">Not set</option>{COMPANIONS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="pt-h3" style={{ marginBottom: 10 }}>Communication preferences</h2>
            <div className="pt-row between"><div><strong style={{ color: 'var(--pt-navy)', fontSize: 14 }}>Trip updates</strong><div className="pt-small">Get important updates about your bookings</div></div><Switch on label="Trip updates" disabled onChange={() => {}} /></div>
            <button type="button" className="pt-link" style={{ marginTop: 12, color: 'var(--pt-blue)' }} onClick={() => navigate('/notification-preferences')}>Manage all notification preferences</button>
          </Card>
          <div className="pt-sticky-cta"><button type="submit" className="pt-btn full" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      </Page>
    </Shell>
  );
}

/* -------------------------------------------------------------------- support */

const TOPICS = [
  { key: 'Booking assistance', icon: Calendar, sub: 'Changes, cancellations, refunds and travel documents', faqs: [
    ['How do I request a trip?', 'Open Bookings, choose Start booking and pick a service. Fill in the trip details, add traveller information and submit. Your advisor replies with a quotation — no payment is taken in the portal.'],
    ['How do I cancel a booking request?', 'Open the booking from My bookings, then choose Cancel request. Completed bookings cannot be cancelled in the portal; contact support for those.'],
    ['Where are my tickets and vouchers?', 'Documents your advisor shares appear under Download documents on the booking details page.'],
    ['What does “Quote ready” mean?', 'Your advisor has sent a quotation. Review it, then accept it or request a change. Quotations are valid until the date shown on them.'],
  ] },
  { key: 'Wings & rewards', icon: Gift, sub: 'Earning, redemptions, tier benefits and offers', faqs: [
    ['When do I receive Wings?', 'Wings are credited after a service is completed, at the rates shown when you start a booking. Your welcome bonus and first-booking bonus are credited once.'],
    ['How do redemptions work?', 'Choose a reward and confirm. Wings are reserved while staff review the request and refunded in full if it is rejected or cancelled. Approved rewards arrive as a voucher in the portal.'],
    ['Do I lose my tier if I redeem Wings?', 'No. Your tier is based on lifetime Wings earned and never decreases.'],
    ['How do referrals work?', 'When a friend you referred completes their first booking, you earn the referral Wings once for that friend.'],
  ] },
  { key: 'Membership & PIN', icon: ShieldCheck, sub: 'Account access, PIN reset and security', faqs: [
    ['I forgot my PIN', 'Choose Forgot PIN? on the sign-in screen. We send a 6-digit code to your registered mobile number, then you can set a new PIN.'],
    ['How do I change my PIN?', 'Go to Account → Security & PIN and enter your current PIN followed by a new one.'],
    ['How do I change my phone number?', 'Your phone number is your verified login. Raise a support request and our team will verify and update it for you.'],
    ['How do I verify my membership card?', 'Show the QR code on your membership card. Anyone scanning it sees only your name, member number, tier and validity.'],
  ] },
];

export function Support() {
  const navigate = useNavigate();
  const wide = useWide();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(!!params.get('booking'));
  const [tab, setTab] = useState('help');
  const { data: tickets, reload, loading } = useAsync(() => api.get('/support/tickets/me').catch(() => []), []);

  const query = q.trim().toLowerCase();
  const topics = useMemo(() => TOPICS.map((t) => ({ ...t, faqs: query ? t.faqs.filter(([a, b]) => `${a} ${b} ${t.key}`.toLowerCase().includes(query)) : t.faqs })).filter((t) => !query || t.faqs.length), [query]);

  return (
    <Shell active="account" topbar={wide}>
      {withBack(wide, 'Help & support', () => navigate('/account'))}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0, maxWidth: 760 }}>
          <div className="pt-banner" style={{ backgroundImage: bg(IMG.palace), minHeight: 150 }}><h2 style={{ fontSize: 24 }}>How can we help you today?</h2></div>
          <SearchBox value={q} onChange={setQ} placeholder="Search for help (e.g. cancel booking)" />
          <Tabs tabs={[['help', 'Help topics'], ['requests', `My requests${tickets?.length ? ` (${tickets.length})` : ''}`]]} value={tab} onChange={setTab} />
          {tab === 'help' ? (
            <>
              <h2 className="pt-h3">Popular help topics</h2>
              <div className="pt-menu-list">
                {topics.map((t, ti) => (
                  <div key={t.key} style={{ borderTop: ti ? '1px solid var(--pt-line)' : 0 }}>
                    <button type="button" style={{ display: 'flex', width: '100%' }} onClick={() => setOpen(open === t.key || query ? null : t.key)}>
                      <span className="pt-item-icon"><t.icon size={21} /></span>
                      <span><span className="pt-item-title" style={{ display: 'block' }}>{t.key}</span><span className="pt-item-sub" style={{ display: 'block' }}>{t.sub}</span></span>
                      <ChevronDown size={18} className="chev" style={{ transform: open === t.key || query ? 'rotate(180deg)' : undefined }} />
                    </button>
                    {(open === t.key || query) && <div style={{ padding: '4px 18px 16px 72px', display: 'grid', gap: 12, background: '#fcfaf5' }}>{t.faqs.map(([a, b]) => <div key={a}><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>{a}</strong><p className="pt-sub" style={{ marginTop: 3 }}>{b}</p></div>)}</div>}
                  </div>
                ))}
                {!topics.length && <div style={{ padding: 18 }}><Empty icon={CircleHelp} title="No matching articles">Try different words, or send us a request below.</Empty></div>}
                <button type="button" onClick={() => setForm('Travel advisor')}><span className="pt-item-icon green"><Headset size={21} /></span><span><span className="pt-item-title" style={{ display: 'block' }}>Contact travel advisor</span><span className="pt-item-sub" style={{ display: 'block' }}>Get personalised help for your trip</span></span><ChevronRight size={18} className="chev" /></button>
                <button type="button" onClick={() => setForm(true)}><span className="pt-item-icon"><LifeBuoy size={21} /></span><span><span className="pt-item-title" style={{ display: 'block' }}>Raise a support request</span><span className="pt-item-sub" style={{ display: 'block' }}>Send us a request and we’ll get back to you soon</span></span><ChevronRight size={18} className="chev" /></button>
              </div>
            </>
          ) : loading && !tickets ? <div className="pt-stack"><Skeleton h={70} r={14} /><Skeleton h={70} r={14} /></div> : (tickets || []).length === 0 ? <Card><Empty icon={MessageSquare} title="No requests yet" action={<button type="button" className="pt-btn sm" onClick={() => setForm(true)}>Raise a request</button>}>Requests you send to our team will be tracked here.</Empty></Card> : (
            <div className="pt-stack">{tickets.map((t) => <div key={t.id} className="pt-item static" style={{ alignItems: 'flex-start' }}><span className="pt-item-icon blue"><MessageSquare size={19} /></span><div className="pt-item-body"><div className="pt-row between" style={{ gap: 8 }}><div className="pt-item-title">{t.subject}</div><Badge tone={t.status === 'resolved' || t.status === 'closed' ? 'green' : t.status === 'in_progress' ? 'blue' : 'amber'}>{humanize(t.status)}</Badge></div><div className="pt-item-sub">{t.category} · {relTime(t.created_at)}</div><p className="pt-sub" style={{ marginTop: 6 }}>{t.message}</p></div></div>)}</div>
          )}
        </div>
      </Page>
      <SupportForm open={!!form} category={typeof form === 'string' ? form : params.get('booking') ? 'Booking assistance' : ''} bookingId={params.get('booking')} onClose={() => setForm(false)} onSent={() => { setForm(false); setTab('requests'); reload(); }} />
    </Shell>
  );
}

function SupportForm({ open, onClose, onSent, category, bookingId }) {
  const [state, setState] = useState({ category: 'Booking assistance', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setState((s) => ({ ...s, category: category || s.category })); }, [open, category]);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/support/tickets', { ...state, booking_id: bookingId || undefined });
      toast.success('Request sent. Our team will get back to you soon.');
      setState({ category: 'Booking assistance', subject: '', message: '' });
      onSent();
    } catch (error) { toast.error(error.message || 'We could not send your request'); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} label="Raise a support request">
      <ModalHead title="Raise a support request" sub="Tell us what’s happening and we’ll get back to you." onClose={onClose} />
      <form onSubmit={submit} className="pt-stack">
        <Field label="Category"><Select value={state.category} onChange={(e) => setState({ ...state, category: e.target.value })}>{['Booking assistance', 'Wings & rewards', 'Membership & PIN', 'Travel advisor', 'General question'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Subject"><Input required maxLength={180} value={state.subject} onChange={(e) => setState({ ...state, subject: e.target.value })} placeholder="How can we help?" /></Field>
        <Field label="Message"><TextArea required max={2000} value={state.message} onChange={(e) => setState({ ...state, message: e.target.value })} placeholder="Share any booking or redemption reference and what you need." /></Field>
        {bookingId && <Notice icon={FileText}>This request will be linked to your booking.</Notice>}
        <button type="submit" className="pt-btn full" disabled={busy || !state.subject.trim() || !state.message.trim()}>{busy ? 'Sending…' : 'Send request'}</button>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ security */

export function Security() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData, changePassword, logout } = useAuth();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const mismatch = again.length === 4 && next !== again;

  const save = async (event) => {
    event.preventDefault();
    if (next === cur) { toast.error('Your new PIN must be different from the current one'); return; }
    setBusy(true);
    try { await changePassword(cur, next); setCur(''); setNext(''); setAgain(''); } catch { /* AuthContext shows the reason */ } finally { setBusy(false); }
  };
  const signOutOthers = async () => {
    if (!window.confirm('Sign out of all other devices? You will stay signed in here.')) return;
    setSessionBusy(true);
    try { await api.post('/sessions/revoke-others'); toast.success('Other sessions have been signed out'); } catch (error) { toast.error(error.message || 'We could not sign out other sessions'); } finally { setSessionBusy(false); }
  };

  return (
    <Shell active="account" topbar={wide}>
      {withBack(wide, 'Security & PIN', () => navigate('/account'))}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0, maxWidth: 640 }}>
          <div><h1 className="pt-h1">Account security</h1><p className="pt-sub" style={{ marginTop: 4 }}>Keep your account safe and in your control.</p></div>
          <Card><div className="pt-row"><Smartphone size={24} style={{ color: 'var(--pt-navy)' }} /><div style={{ flex: 1 }}><div className="pt-row between"><strong style={{ color: 'var(--pt-navy)' }}>Verified phone number</strong><Badge tone="green"><CircleCheck size={12} /> Verified</Badge></div><div style={{ fontSize: 17, marginTop: 4 }}>{maskPhone(userData?.phone)}</div><div className="pt-small">Used for login, PIN and important notifications.</div></div></div></Card>
          <Card>
            <form onSubmit={save} className="pt-stack lg">
              <div className="pt-row"><Lock size={22} style={{ color: 'var(--pt-navy)' }} /><div><h2 className="pt-h3">Change your 4-digit PIN</h2><p className="pt-small">Use a strong PIN to keep your account secure.</p></div></div>
              <PinField label="Current PIN" value={cur} onChange={setCur} show={show} />
              <PinField label="New PIN" value={next} onChange={setNext} show={show} />
              <PinField label="Confirm new PIN" value={again} onChange={setAgain} show={show} error={mismatch ? 'PINs do not match' : ''} />
              <Check2 checked={show} onChange={setShow}>Show PIN</Check2>
              <button type="submit" className="pt-btn full" disabled={busy || cur.length !== 4 || next.length !== 4 || again.length !== 4 || mismatch}>{busy ? 'Saving…' : 'Save PIN'}</button>
            </form>
          </Card>
          <Card>
            <div className="pt-row top"><Smartphone size={22} style={{ color: 'var(--pt-navy)' }} /><div><h2 className="pt-h3">Secure session</h2><p className="pt-small">Noticed a new device? You can sign out from other sessions for added security.</p></div></div>
            <button type="button" className="pt-btn danger full" style={{ marginTop: 14 }} disabled={sessionBusy} onClick={signOutOthers}><LogOut size={16} /> {sessionBusy ? 'Signing out…' : 'Sign out other sessions'}</button>
            <p className="pt-tiny" style={{ marginTop: 8 }}>This will sign you out from all other devices. You’ll remain signed in on this device.</p>
            <button type="button" className="pt-link muted" style={{ marginTop: 12 }} onClick={async () => { await logout().catch(() => {}); navigate('/auth', { replace: true }); }}>Sign out of this device</button>
          </Card>
        </div>
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------- notification preferences */

export function NotificationPreferences() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get('/preferences/me'), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);
  const f = form || {};
  const set = (k, v) => setForm({ ...f, [k]: v });
  const save = async () => {
    if (!f.channel_sms && !f.channel_in_app) { toast.error('Choose at least one channel'); return; }
    setBusy(true);
    try { await api.put('/preferences/me', f); toast.success('Preferences saved'); navigate('/account'); } catch (e) { toast.error(e.message || 'We could not save your preferences'); } finally { setBusy(false); }
  };
  const rows = [
    ['Booking updates', 'Flight, hotel, activity and insurance updates related to your trips.', 'trip_updates', true, Plane],
    ['Security notices', 'Login alerts, PIN changes and important account updates.', null, true, ShieldCheck],
    ['Wings activity', 'Earnings, redemptions and new offers for your Wings.', 'wings_activity', false, WingsIcon],
    ['Reward status', 'Tier updates, milestone progress and exclusive benefits.', 'reward_status', false, Star],
    ['Travel offers (optional)', 'Curated deals, destination ideas and partner offers.', 'travel_offers', false, Gift],
  ];
  return (
    <Shell active="account" topbar={wide}>
      {withBack(wide, 'Notification preferences', () => navigate('/account'))}
      <Page>
        <div className="pt-stack lg" style={{ marginTop: wide ? 16 : 0, maxWidth: 640 }}>
          <div><h1 className="pt-h1">Notification preferences</h1><p className="pt-sub" style={{ marginTop: 4 }}>Choose how you’d like to hear from us.</p></div>
          <Notice icon={Info}>Booking updates and security notices are required to keep your account and travels on track.</Notice>
          {loading && !form ? <Skeleton h={300} r={16} /> : error ? <ErrorState onRetry={reload} /> : (
            <>
              <div className="pt-menu-list">
                {rows.map(([title, sub, key, locked, I]) => (
                  <div key={title} className="pt-row" style={{ padding: '14px 16px', borderTop: '1px solid var(--pt-line)', gap: 14 }}>
                    <I size={22} style={{ color: 'var(--pt-navy)', flex: 'none' }} />
                    <div style={{ flex: 1 }}><div className="pt-item-title">{title}</div><div className="pt-item-sub">{sub}</div></div>
                    {locked ? <span className="pt-row" style={{ gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}><Switch on disabled label={title} onChange={() => {}} /><span className="pt-tiny"><Lock size={10} /> Required</span></span> : <Switch on={!!f[key]} label={title} onChange={(v) => set(key, v)} />}
                  </div>
                ))}
              </div>
              <div>
                <h2 className="pt-h3">Preferred channels</h2><p className="pt-small" style={{ margin: '3px 0 10px' }}>Choose where you’d like to receive notifications.</p>
                <div className="pt-menu-list">
                  <div style={{ padding: '14px 16px' }}><Check2 checked={!!f.channel_sms} onChange={(v) => set('channel_sms', v)}><span className="pt-row" style={{ gap: 8 }}><Smartphone size={18} /> SMS (to {maskPhone(userData?.phone)})</span></Check2></div>
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--pt-line)' }}><Check2 checked={!!f.channel_in_app} onChange={(v) => set('channel_in_app', v)}><span className="pt-row" style={{ gap: 8 }}><BellRing size={18} /> In-app notifications</span></Check2></div>
                </div>
              </div>
              <div className="pt-sticky-cta"><button type="button" className="pt-btn full" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save preferences'}</button></div>
            </>
          )}
        </div>
      </Page>
    </Shell>
  );
}

