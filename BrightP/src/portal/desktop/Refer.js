import React, { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Check, ChevronRight, Clock, Copy, Gift, Mail, Send, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Avatar, ErrorState, Field, Input, Modal, ModalHead, Page, Shell, Skeleton, fmtDate, fmtNum, useAsync, useCopy } from '../ui';
import { PHOTO } from '../photos';

const WhatsApp = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M12.04 2a9.93 9.93 0 0 0-8.5 15.07L2 22l5.06-1.5A9.94 9.94 0 1 0 12.04 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .88.9-2.93-.2-.31A8.22 8.22 0 1 1 12.04 20.2Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.24 3.75.59.25 1.06.4 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" /></svg>
);

export default function DeskRefer() {
  const { data, loading, error, reload } = useAsync(() => api.get('/referrals/activity'), []);
  const { copied, copy } = useCopy();
  const [mailOpen, setMailOpen] = useState(false);
  const code = data?.referral_code || '';
  const per = data?.wings_per_friend ?? 50;
  const link = code ? `${window.location.origin}/auth?ref=${encodeURIComponent(code)}` : '';
  const message = `Join me on Bright Wings and start earning Wings on every trip. Sign up with my code ${code}: ${link}`;

  const friends = (data?.friends || []).map((f) => ({
    key: f.id, initials: f.name.split(' ').map((p) => p[0]).slice(0, 2).join(''), title: f.name,
    tone: f.wings_credited != null ? 'green' : 'amber', chip: f.wings_credited != null ? 'Booking completed' : 'First booking pending',
    right: f.wings_credited != null ? `${fmtNum(f.wings_credited)} Wings awarded` : '—', sub: f.wings_credited != null ? fmtDate(f.credited_at) : 'Waiting for first booking',
  }));
  const invites = (data?.invites || []).filter((i) => !i.joined).map((i) => ({ key: i.id, initials: i.email.slice(0, 2).toUpperCase(), title: i.email, tone: 'blue', chip: 'Invite sent', right: '—', sub: `Invited on ${fmtDate(i.created_at)}` }));
  const invited = [...friends, ...invites];
  const history = (data?.friends || []).map((f) => ({ key: f.id, name: f.name, credited: f.wings_credited != null, at: f.wings_credited != null ? f.credited_at : f.joined_at, wings: f.wings_credited }));
  const rewards = history.filter((h) => h.credited).length;

  const steps = [[Send, '1. Invite sent', 'Share your code with a friend'], [UserPlus, '2. Friend joins', 'They create a Bright Wings account'], [BriefcaseBusiness, '3. First booking completed', 'They complete their first booking'], [Gift, `4. ${fmtNum(per)} Wings awarded`, `You earn ${fmtNum(per)} Wings`]];

  return (
    <Shell active="refer">
      <Page wide>
        <section className="dr2-hero">
          <div className="dr2-copy">
            <div className="dp-eyebrow" style={{ paddingTop: 30 }}>REFER A FRIEND</div>
            <h1 className="pt-title" style={{ marginTop: 6 }}>Travel is better together</h1>
            <p className="pt-lede" style={{ maxWidth: 560 }}>Share Bright Wings with friends. When they complete their first booking, you earn {fmtNum(per)} Wings.</p>
            <div className="pt-card dr2-code">
              <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 21 }}>Your referral code</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)', textDecoration: 'none' }} onClick={() => document.getElementById('how-referrals')?.scrollIntoView({ behavior: 'smooth' })}>How it works? ⓘ</button></div>
              {loading && !data ? <Skeleton h={70} r={12} style={{ marginTop: 14 }} /> : error ? <ErrorState onRetry={reload} /> : (
                <>
                  <div className="dr2-codebox"><strong>{code || '—'}</strong><button type="button" aria-label="Copy code" onClick={() => copy(code, 'code')}>{copied === 'code' ? <Check size={22} /> : <Copy size={22} />}</button></div>
                  <div className="dr2-share">
                    <button type="button" className="gold" onClick={() => copy(link, 'link').then((ok) => ok ? toast.success('Link copied') : toast.error('Copy is not available in this browser'))}><Copy size={18} /> {copied === 'link' ? 'Copied' : 'Copy link'}</button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="wa"><WhatsApp /> WhatsApp</a>
                    <button type="button" onClick={() => setMailOpen(true)}><Mail size={18} /> Email</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="dr2-photo" style={{ backgroundImage: `url(${PHOTO.santorini})` }}><em>Same Horizons<br />Brighter Stories</em></div>
        </section>

        <section className="pt-card dr2-flow" id="how-referrals">
          <div className="dr2-earn"><span><Gift size={34} /></span><p>Earn <b>{fmtNum(per)} Wings</b> once your friend completes their first booking.</p></div>
          <ol>{steps.map(([Icon, t, s], i) => <li key={t} className={i === 3 ? 'last' : ''}><span><Icon size={26} strokeWidth={1.5} /></span><div><b>{t}</b><small>{s}</small></div>{i < 3 && <ArrowRight size={20} className="arr" />}</li>)}</ol>
        </section>

        <div className="dr2-lists">
          <section className="pt-card dr2-panel">
            <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 23 }}>Your invited friends</h2><span className="pt-small" style={{ fontSize: 14 }}>{invited.length} invite{invited.length === 1 ? '' : 's'}</span></div>
            {loading && !data ? <Skeleton h={150} r={12} style={{ marginTop: 14 }} /> : invited.length === 0 ? <p className="pt-sub" style={{ padding: '26px 0 10px' }}>No invites yet. Share your code or <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => setMailOpen(true)}>invite a friend by email</button>.</p> : (
              <ul>{invited.map((f) => (
                <li key={f.key}><span className="av">{f.initials}</span><div><b>{f.title}</b></div><span className={`pt-badge ${f.tone}`}>{f.tone === 'green' ? <Check size={13} /> : f.tone === 'amber' ? <Clock size={13} /> : <Send size={13} />} {f.chip}</span><div className="r"><b>{f.right}</b><small>{f.sub}</small></div><ChevronRight size={16} className="chev" /></li>
              ))}</ul>
            )}
          </section>
          <section className="pt-card dr2-panel">
            <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 23 }}>Referral history</h2><span className="pt-small" style={{ fontSize: 14 }}>{rewards} reward{rewards === 1 ? '' : 's'}</span></div>
            {history.length === 0 ? <p className="pt-sub" style={{ padding: '26px 0 10px' }}>Friends who join with your code will appear here.</p> : (
              <ul>{history.map((h) => (
                <li key={h.key}><Avatar user={{ displayName: h.name }} /><div><b>{h.name}</b><small>{h.credited ? 'First booking completed' : 'First booking pending'}</small></div><div className="r"><small>{fmtDate(h.at)}</small>{h.credited ? <b className="pos"><Check size={15} strokeWidth={3} /> + {fmtNum(h.wings)} Wings</b> : <b className="pend"><Clock size={15} /> Pending</b>}</div></li>
              ))}</ul>
            )}
          </section>
        </div>
      </Page>
      <InviteModal open={mailOpen} onClose={() => setMailOpen(false)} onDone={() => { setMailOpen(false); reload(); }} />
    </Shell>
  );
}

function InviteModal({ open, onClose, onDone }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Enter a valid e-mail address'); return; }
    setBusy(true);
    try {
      const r = await api.post('/referral-invites', { email: email.trim() });
      toast.success(r.sent ? 'Invitation e-mailed' : 'Invite saved. E-mail delivery isn’t set up yet, so share your link directly.');
      setEmail(''); setErr(''); onDone();
    } catch (error) { setErr(error.message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} label="Invite by e-mail">
      <ModalHead title="Invite a friend by e-mail" sub="We’ll send them your link. You’ll see their progress here." onClose={onClose} />
      <form onSubmit={submit} className="pt-stack lg"><Field label="Friend’s e-mail" error={err}><Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} placeholder="friend@example.com" error={err} autoFocus /></Field><button type="submit" className="pt-gold-btn full" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send invitation'}</button></form>
    </Modal>
  );
}
