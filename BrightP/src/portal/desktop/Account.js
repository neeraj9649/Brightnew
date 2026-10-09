import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { CircleCheck, Clock, Download, KeyRound, LogOut, Share2, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Check2, Field, Input, Modal, ModalHead, Notice, Page, PinField, Shell, Skeleton, WingsIcon, fmtDate, fmtDateTime, formatPhone, useAsync, useCopy } from '../ui';

const splitName = (full = '') => { const [first, ...rest] = full.trim().split(/\s+/); return [first || '', rest.join(' ')]; };

export default function DeskAccount() {
  const navigate = useNavigate();
  const { userData, refreshUser, changePassword, logout } = useAuth();
  const prefs = useAsync(() => api.get('/preferences/me'), []);
  const card = useAsync(() => api.get('/loyalty/summary').then((s) => s.card), []);
  const { copy } = useCopy();
  const [first0, last0] = splitName(userData?.displayName);
  const [form, setForm] = useState({ first: first0, last: last0, email: userData?.email || '' });
  const [pref, setPref] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => { if (prefs.data && !pref) setPref(prefs.data); }, [prefs.data, pref]);
  const code = card.data?.membership_code || userData?.membershipCode;
  useEffect(() => { if (code) QRCode.toDataURL(`${window.location.origin}/card/${code}`, { margin: 1, width: 260 }).then(setQr).catch(() => {}); }, [code]);

  const p = pref || { travel_offers: false, trip_updates: true, partner_offers: false };
  const dirty = form.first !== first0 || form.last !== last0 || form.email !== (userData?.email || '') || (pref && prefs.data && JSON.stringify(pref) !== JSON.stringify(prefs.data));

  const save = async () => {
    const e = {};
    if (form.first.trim().length < 1) e.first = 'Enter your first name';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid e-mail address';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.patch('/users/me', { first_name: form.first.trim(), last_name: form.last.trim() || null });
      if (form.email.trim() !== (userData?.email || '')) await api.put('/portal/account/email', { email: form.email.trim() || null });
      if (pref) await api.put('/preferences/me', pref);
      await Promise.all([refreshUser(), prefs.reload()]);
      toast.success('Your account has been updated');
    } catch (err) {
      if (err.status === 409) setErrors({ email: err.message }); else toast.error(err.message || 'We could not save your changes');
    } finally { setBusy(false); }
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png'); a.download = `bright-wings-${code}.png`; a.click();
    } catch { toast.error('We could not create the image. Please try again.'); } finally { setDownloading(false); }
  };
  const share = async () => {
    const link = `${window.location.origin}/card/${code}`;
    if (navigator.share) { try { await navigator.share({ title: 'My Bright Wings membership', url: link }); return; } catch { /* dismissed */ } }
    if (await copy(link)) toast.success('Verification link copied'); else toast.error('Copy is not available in this browser');
  };
  const signOutOthers = async () => {
    if (!window.confirm('Sign out of all other devices? You will stay signed in here.')) return;
    setSessionBusy(true);
    try { await api.post('/sessions/revoke-others'); toast.success('Other sessions have been signed out'); } catch (err) { toast.error(err.message || 'We could not sign out other sessions'); } finally { setSessionBusy(false); }
  };

  const tier = card.data?.membership_tier || userData?.membershipTier || 'Silver';
  const spaced = (v = '') => v.replace(/(.{4})(?=.)/g, '$1 ').trim();

  return (
    <Shell active="account">
      <Page wide>
        <header style={{ paddingTop: 40 }}><h1 className="pt-title">Your account</h1><p className="pt-lede">Manage your details, preferences and membership.</p></header>
        <div className="da-grid">
          <div className="pt-stack lg" style={{ minWidth: 0 }}>
            <section className="pt-card da-panel">
              <h2 className="pt-serif-h">Personal details</h2>
              <p className="pt-sub" style={{ marginTop: 4 }}>Keep your information up to date.</p>
              <div className="pt-stack lg" style={{ marginTop: 20 }}>
                <div className="dp-grid2">
                  <Field label="First name" error={errors.first}><Input value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} error={errors.first} autoComplete="given-name" /></Field>
                  <Field label="Last name"><Input value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} autoComplete="family-name" /></Field>
                </div>
                <Field label="Email address" optional error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" placeholder="you@example.com" /></Field>
                <Field label="Phone number" right={<span className="da-verified"><CircleCheck size={16} /> Verified</span>} hint="Your phone is your verified sign-in. To change it, contact support.">
                  <div className="da-phone"><span>+91</span><input value={formatPhone(userData?.phone).replace(/^\+91\s?/, '')} readOnly aria-label="Phone number" /></div>
                </Field>
              </div>
              <hr className="pt-divider" style={{ margin: '26px 0' }} />
              <h2 className="pt-serif-h" style={{ fontSize: 22 }}>Notification preferences</h2>
              <p className="pt-sub" style={{ marginTop: 4 }}>Choose what you’d like to hear about.</p>
              {prefs.loading && !pref ? <Skeleton h={150} r={12} style={{ marginTop: 16 }} /> : (
                <div className="da-checks">
                  <Check2 checked={!!p.travel_offers} onChange={(v) => setPref({ ...p, travel_offers: v })}><b>Flight deals and member offers</b><small>Be the first to know about exclusive fares and promotions.</small></Check2>
                  <Check2 checked disabled onChange={() => {}}><b>Account updates</b><small>Important information about your bookings and membership. Always on.</small></Check2>
                  <Check2 checked={!!p.partner_offers} onChange={(v) => setPref({ ...p, partner_offers: v })}><b>Partner offers</b><small>Special offers from our travel and lifestyle partners.</small></Check2>
                </div>
              )}
              <hr className="pt-divider" style={{ margin: '26px 0' }} />
              <h2 className="pt-serif-h" style={{ fontSize: 22 }}>Security PIN</h2>
              <p className="pt-sub" style={{ marginTop: 4 }}>Used to sign in and to confirm changes to your account.</p>
              <div className="da-pin"><div>{[0, 1, 2, 3].map((i) => <span key={i}><i /></span>)}</div><button type="button" className="pt-navy-btn ghost" onClick={() => setPinOpen(true)}>Change PIN</button></div>
              <button type="button" className="pt-gold-btn full" style={{ marginTop: 26 }} disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
            </section>
          </div>

          <div className="pt-stack lg" style={{ minWidth: 0 }}>
            <section className="pt-card da-panel">
              <div className="pt-row between top"><div><h2 className="pt-serif-h">Your Bright Wings membership card</h2><p className="pt-sub" style={{ marginTop: 4 }}>Your digital card gives you easy access to member benefits worldwide.</p></div><span className="da-active"><i /> Active member</span></div>
              <div className="da-card-row">
                <div ref={cardRef} className="da-card">
                  <div className="da-card-brand"><WingsIcon size={42} color="#e0b25a" strokeWidth={1.5} /><span><b>BRIGHT WINGS</b><small>TRAVEL MORE. EARN HIGHER.</small></span></div>
                  <WingsIcon size={230} color="#c9963e" strokeWidth={0.8} />
                  <div className="da-card-name">{userData?.displayName}</div>
                  <div className="da-card-meta">
                    <div><small>MEMBERSHIP CODE</small><b>{spaced(code || '')}</b></div>
                    <div className="grid"><div><small>TIER</small><b className="gold">{tier}</b></div><div><small>VALID UNTIL</small><b>{card.data?.valid_until ? fmtDate(card.data.valid_until) : '—'}</b></div></div>
                  </div>
                </div>
                <div className="da-qr"><b>Scan to verify membership</b><div>{qr ? <img src={qr} alt="Membership QR code" /> : <Skeleton h={150} w={150} />}</div></div>
              </div>
              <div className="da-card-actions"><button type="button" className="pt-navy-btn" disabled={downloading} onClick={download}><Download size={17} /> {downloading ? 'Preparing…' : 'Download card'}</button><button type="button" className="pt-navy-btn ghost" onClick={share}><Share2 size={17} /> Share card</button></div>
              <div className="da-private"><span><ShieldCheck size={26} /></span><div><b>Private and secure verification</b><p>When your QR code is scanned in public, it will show only your name, membership code, tier and validity date. Your Wings balance and personal contact details are never displayed.</p></div></div>
            </section>

            <section className="pt-card da-panel">
              <h2 className="pt-serif-h">Account security</h2>
              <p className="pt-sub" style={{ marginTop: 4 }}>Help keep your account safe.</p>
              <ul className="da-sec">
                <li><span><KeyRound size={24} /></span><div><b>Security PIN</b><small>Your 4-digit PIN protects sign-in and redemptions.</small></div><button type="button" className="pt-navy-btn ghost" onClick={() => setPinOpen(true)}>Change PIN</button></li>
                <li><span><Smartphone size={24} /></span><div><b>Other devices</b><small>Sign out of every other browser and phone.</small></div><button type="button" className="pt-navy-btn ghost" disabled={sessionBusy} onClick={signOutOthers}>{sessionBusy ? 'Working…' : 'Sign out others'}</button></li>
                <li><span><Clock size={24} /></span><div><b>Recent account activity</b><small>Review your latest sign-ins.</small></div><button type="button" className="pt-navy-btn ghost" onClick={() => setActivityOpen(true)}>View activity</button></li>
              </ul>
              <button type="button" className="pt-link" style={{ marginTop: 18, color: 'var(--pt-red)', display: 'inline-flex', gap: 8, alignItems: 'center', textDecoration: 'none' }} onClick={async () => { await logout().catch(() => {}); navigate('/auth', { replace: true }); }}><LogOut size={16} /> Sign out of this device</button>
            </section>
          </div>
        </div>
      </Page>
      <ChangePin open={pinOpen} onClose={() => setPinOpen(false)} change={changePassword} />
      <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} />
    </Shell>
  );
}

function ChangePin({ open, onClose, change }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = again.length === 4 && next !== again;
  const close = () => { setCur(''); setNext(''); setAgain(''); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (next === cur) { toast.error('Your new PIN must be different from the current one'); return; }
    setBusy(true);
    try { await change(cur, next); close(); } catch { /* AuthContext explains */ } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={close} label="Change PIN">
      <ModalHead title="Change your PIN" sub="Choose a PIN that’s hard to guess and don’t share it." onClose={close} />
      <form onSubmit={submit} className="pt-stack lg">
        <PinField label="Current PIN" value={cur} onChange={setCur} autoFocus />
        <PinField label="New PIN" value={next} onChange={setNext} />
        <PinField label="Confirm new PIN" value={again} onChange={setAgain} error={mismatch ? 'PINs do not match' : ''} />
        <button type="submit" className="pt-gold-btn full" disabled={busy || cur.length !== 4 || next.length !== 4 || again.length !== 4 || mismatch}>{busy ? 'Saving…' : 'Save new PIN'}</button>
      </form>
    </Modal>
  );
}

function ActivityModal({ open, onClose }) {
  const { data, loading, error } = useAsync(() => (open ? api.get('/portal/account/activity') : Promise.resolve(null)), [open]);
  return (
    <Modal open={open} onClose={onClose} label="Recent activity">
      <ModalHead title="Recent account activity" sub="Your latest sign-ins to Bright Wings." onClose={onClose} />
      {loading && !data ? <Skeleton h={120} /> : error ? <Notice tone="red">We couldn’t load your activity right now.</Notice> : !(data?.sign_ins || []).length ? <p className="pt-sub">No sign-ins recorded yet.</p> : (
        <ul className="da-act">{data.sign_ins.map((s, i) => <li key={i}><Smartphone size={18} /><span><b>{i === 0 ? 'Latest sign-in' : 'Signed in'}</b><small>{fmtDateTime(s.at)}</small></span>{s.signed_out && <span className="pt-badge">Signed out</span>}</li>)}</ul>
      )}
      <button type="button" className="pt-navy-btn full" style={{ marginTop: 18 }} onClick={onClose}>Close</button>
    </Modal>
  );
}

