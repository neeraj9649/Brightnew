import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChartNoAxesColumn, CircleAlert, CircleCheck, Coins, Gift, HelpCircle, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Check2, Field, Hero, IMG, Input, isValidIndianMobile, Modal, ModalHead, Notice, PhoneField, PinBoxes, PinField,
  fmtNum, formatPhone, memberName, nationalNumber,
} from '../ui';

// Support contact details are configured per deployment (REACT_APP_CONTACT_EMAIL / _PHONE).
const CONTACT_EMAIL = (process.env.REACT_APP_CONTACT_EMAIL || '').trim();
const CONTACT_PHONE = (process.env.REACT_APP_CONTACT_PHONE || '').trim();

export function TermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} label="Terms and conditions">
      <ModalHead title="Terms & Conditions" onClose={onClose} sub="Bright Wings membership and Wings program" />
      <div className="pt-stack" style={{ fontSize: 13, color: 'var(--pt-muted)', lineHeight: 1.6 }}>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Membership.</strong> Joining is free. Every new member starts on the Silver tier and receives the welcome Wings shown at enrolment. Your phone number is your login identity and your 4-digit PIN must be kept private.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Earning Wings.</strong> Wings are credited after a service is completed, at the rates published in the portal. First-booking bonuses and referral rewards are credited once per eligible member. Cancelled bookings do not earn Wings.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Tiers.</strong> Your tier is based on lifetime Wings earned. Redeeming Wings never reduces your lifetime Wings or lowers your tier.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Redemptions.</strong> Rewards are subject to availability and approval. Wings are reserved when you submit a request and refunded in full if it is rejected or cancelled. Vouchers are valid until the date shown on the voucher.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Quotations.</strong> Prices are confirmed by your travel advisor in a written quotation. A quotation is valid until the date shown and no payment is taken in the portal.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Privacy.</strong> We use your details only to provide travel services, support and the Wings program. Public membership verification shows only your name, member number, tier and validity.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Changes.</strong> Bright Wings may update program rules with notice in the portal. Accounts may be deactivated for misuse.</p>
      </div>
      <button type="button" className="pt-btn full" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
    </Modal>
  );
}

/* ------------------------------------------------------------ main auth page */

const emptyErrors = {};

export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const initialRef = params.get('ref') || '';
  const [mode, setMode] = useState(params.get('mode') === 'forgot' ? 'forgot' : initialRef || params.get('mode') === 'register' ? 'register' : 'login');

  // sign in
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  // sign up
  const [name, setName] = useState('');
  const [pin2, setPin2] = useState('');
  const [referral, setReferral] = useState(initialRef.toUpperCase());
  const [agree, setAgree] = useState(false);
  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState(emptyErrors);
  const [busy, setBusy] = useState(false);

  const go = (next) => {
    setMode(next);
    setErrors(emptyErrors);
    setPin('');
    setPin2('');
    const nextParams = new URLSearchParams(params);
    nextParams.delete('mode');
    setParams(nextParams, { replace: true });
  };

  if (mode === 'forgot' || mode === 'otp' || mode === 'reset') {
    return <PinRecovery initialPhone={phone} onBack={(p) => { if (p) setPhone(p); go('login'); }} />;
  }

  const submitLogin = async (event) => {
    event.preventDefault();
    const next = {};
    if (!isValidIndianMobile(phone)) next.phone = 'Enter your 10-digit mobile number';
    if (pin.length !== 4) next.pin = 'Enter your 4-digit PIN';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const user = await signIn(nationalNumber(phone), pin);
      navigate(user?.role === 'customer' ? '/dashboard' : '/admin', { replace: true });
    } catch (error) {
      if (error.status === 403) {
        navigate('/inactive', { replace: true });
      } else {
        setErrors({ form: error.status === 401 ? 'That phone number and PIN do not match. Please try again.' : error.message || 'We could not sign you in. Please try again.' });
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    const next = {};
    if (name.trim().length < 2) next.name = 'Please enter your full name';
    if (!isValidIndianMobile(phone)) next.phone = 'Enter your 10-digit mobile number';
    if (pin.length !== 4) next.pin = 'Choose a 4-digit PIN';
    if (pin2.length !== 4 || pin2 !== pin) next.pin2 = 'PINs do not match';
    if (!agree) next.agree = 'Please accept the Terms & Conditions to continue';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      sessionStorage.setItem('bw_welcome', '1');
      await signUp(nationalNumber(phone), pin, { name: name.trim(), referredByCode: referral.trim() || undefined });
      navigate('/welcome', { replace: true });
    } catch (error) {
      sessionStorage.removeItem('bw_welcome');
      const message = error.status === 409 ? 'This phone number is already registered. Try signing in instead.' : error.message || 'We could not create your membership. Please try again.';
      setErrors(error.message?.toLowerCase().includes('referral') ? { referral: 'That referral code is not valid' } : { form: message });
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'register') {
    return (
      <div className="pt-app">
        <div className="pt-auth">
          <Hero image={IMG.palace} className="pt-auth-art" tall style={{ minHeight: 300 }}
            title={<>Join Silver.<br />Get 200 welcome Wings.</>}
            subtitle="Start your journey to exclusive travel rewards." />
          <div className="pt-auth-panel">
            <form onSubmit={submitRegister} noValidate className="pt-stack lg">
              {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
              <Field label="Full name" error={errors.name}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aanya Sharma" autoComplete="name" error={errors.name} />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <PhoneField value={phone} onChange={setPhone} error={errors.phone} />
              </Field>
              <div className="pt-grid2" style={{ alignItems: 'start' }}>
                <PinField label="4-digit PIN" value={pin} onChange={setPin} error={errors.pin} show={showPin} size="sm" />
                <PinField label="Confirm PIN" value={pin2} onChange={setPin2} error={errors.pin2} show={showPin} size="sm" />
              </div>
              <Check2 checked={showPin} onChange={setShowPin}>Show PIN</Check2>
              <Field label="Referral code" optional error={errors.referral}>
                <Input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="BW2024" error={errors.referral} />
              </Field>
              <div style={{ display: 'grid', gap: 6 }}>
                <Check2 checked={agree} onChange={setAgree}>I agree to the <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); setTerms(true); }}>Terms &amp; Conditions</button></Check2>
                {errors.agree && <span className="pt-err-text"><CircleAlert size={13} /> {errors.agree}</span>}
              </div>
              <button type="submit" className="pt-btn full" disabled={busy}>{busy ? 'Creating membership…' : <>Create membership <ArrowRight size={18} /></>}</button>
              <p className="pt-small" style={{ textAlign: 'center' }}>Already a member? <button type="button" className="pt-link" onClick={() => go('login')}>Sign in</button></p>
            </form>
            <TermsModal open={terms} onClose={() => setTerms(false)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-app">
      <div className="pt-auth">
        <Hero image={IMG.beach} className="pt-auth-art" tall style={{ minHeight: 300 }}
          title={<>Your next<br />journey starts<br />here.</>}
          subtitle="More journeys. Greater rewards." />
        <div className="pt-auth-panel">
          <form onSubmit={submitLogin} noValidate className="pt-stack lg">
            {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
            <Field label="Phone number" error={errors.phone}>
              <PhoneField value={phone} onChange={setPhone} error={errors.phone} />
            </Field>
            <div className="pt-stack" style={{ gap: 12 }}>
              <PinField label="4-digit PIN" value={pin} onChange={setPin} error={errors.pin} show={showPin} />
              <Check2 checked={showPin} onChange={setShowPin}>Show PIN</Check2>
            </div>
            <button type="submit" className="pt-btn full" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}</button>
            <div style={{ textAlign: 'center' }}><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => go('forgot')}>Forgot PIN?</button></div>
            <div className="pt-row" style={{ gap: 14 }}><hr className="pt-divider" style={{ flex: 1, margin: 0 }} /><span className="pt-small">New to Bright Wings?</span><hr className="pt-divider" style={{ flex: 1, margin: 0 }} /></div>
            <button type="button" className="pt-btn ghost full" onClick={() => go('register')}>Join Bright Wings</button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- PIN recovery */

function PinRecovery({ initialPhone, onBack }) {
  const [step, setStep] = useState('phone'); // phone -> code -> reset -> done
  const [phone, setPhone] = useState(initialPhone || '');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (event) => {
    event?.preventDefault();
    if (!isValidIndianMobile(phone)) { setError('Enter your 10-digit mobile number'); return; }
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/pin-reset/request', { phone: nationalNumber(phone) });
      setDevCode(data?.dev_code || '');
      setStep('code');
      setCooldown(60);
      setCode('');
    } catch (err) {
      setError(err.message || 'We could not send a code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/pin-reset/verify', { phone: nationalNumber(phone), code });
      setToken(data.reset_token);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'That code is incorrect or has expired');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (pin.length !== 4) { setError('Choose a 4-digit PIN'); return; }
    if (pin !== pin2) { setError('PINs do not match'); return; }
    setBusy(true);
    setError('');
    try {
      await api.post('/pin-reset/confirm', { phone: nationalNumber(phone), reset_token: token, new_pin: pin });
      toast.success('PIN updated. Please sign in with your new PIN.');
      onBack(nationalNumber(phone));
    } catch (err) {
      setError(err.message || 'We could not update your PIN. Please start again.');
    } finally {
      setBusy(false);
    }
  };

  const back = step === 'phone' ? () => onBack() : step === 'code' ? () => { setStep('phone'); setError(''); } : () => onBack();

  return (
    <div className="pt-app">
      <div className="pt-auth">
        <Hero image={IMG.lake} className="pt-auth-art" back="Back to sign in" onBack={back} tall style={{ minHeight: 280 }} />
        <div className="pt-auth-panel">
          <div>
            {step === 'phone' && (
              <form onSubmit={sendCode} className="pt-stack lg" noValidate>
                <div><h1 className="pt-h1">Forgot your PIN?</h1><p className="pt-sub" style={{ marginTop: 8 }}>No worries. We’ll send a verification code to your registered mobile number to help you reset your PIN.</p></div>
                {error && <Notice tone="red" icon={CircleAlert}>{error}</Notice>}
                <Field label="Mobile number"><PhoneField value={phone} onChange={setPhone} autoFocus error={!!error && !isValidIndianMobile(phone)} /></Field>
                <button type="submit" className="pt-btn full" disabled={busy}>{busy ? 'Sending…' : <>Send verification code <ArrowRight size={18} /></>}</button>
                <Notice plain tone="plain" icon={ShieldCheck}>We’ll send a 6-digit verification code to your registered mobile number.</Notice>
                <hr className="pt-divider" />
                <div className="pt-row top" style={{ gap: 12 }}>
                  <HelpCircle size={22} style={{ color: 'var(--pt-navy)', flex: 'none' }} />
                  <div><strong style={{ fontSize: 13, color: 'var(--pt-navy)' }}>Need help?</strong><p className="pt-small" style={{ marginTop: 3 }}>If you no longer have access to this number, please contact our support team{CONTACT_PHONE ? <> on <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a></> : ''}{CONTACT_EMAIL ? <>{CONTACT_PHONE ? ' or at ' : ' at '}<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : ''}.</p></div>
                </div>
                <button type="button" className="pt-back" onClick={() => onBack()}><ArrowLeft size={17} /> Back to sign in</button>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={verify} className="pt-stack lg" noValidate>
                <div><h1 className="pt-h1">Enter your code</h1><p className="pt-sub" style={{ marginTop: 8 }}>We sent a 6-digit code to <strong style={{ color: 'var(--pt-navy)' }}>{formatPhone(phone)}</strong>. It expires in 10 minutes.</p></div>
                {error && <Notice tone="red" icon={CircleAlert}>{error}</Notice>}
                {devCode && <Notice tone="amber" icon={Smartphone} title="Development mode">Your code is <strong style={{ display: 'inline' }}>{devCode}</strong>. This is only shown when OTP_DEV_ECHO is enabled on the server.</Notice>}
                <Field label="Verification code"><PinBoxes value={code} onChange={setCode} length={6} show autoFocus label="Verification code" size="sm" error={!!error} /></Field>
                <button type="submit" className="pt-btn full" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : <>Verify code <ArrowRight size={18} /></>}</button>
                <div style={{ textAlign: 'center' }}>
                  {cooldown > 0
                    ? <span className="pt-small">Resend code in {cooldown}s</span>
                    : <button type="button" className="pt-link" onClick={sendCode} disabled={busy}>Resend code</button>}
                </div>
                <button type="button" className="pt-back" onClick={back}><ArrowLeft size={17} /> Change number</button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={save} className="pt-stack lg" noValidate>
                <div><h1 className="pt-h1">Reset your PIN</h1><p className="pt-sub" style={{ marginTop: 8 }}>Create a new 4-digit PIN to secure your Bright Wings account.</p></div>
                <Notice tone="green" icon={CircleCheck}><strong>Verified mobile number</strong>{formatPhone(phone)}</Notice>
                {error && <Notice tone="red" icon={CircleAlert}>{error}</Notice>}
                <PinField label="New 4-digit PIN" value={pin} onChange={setPin} autoFocus />
                <PinField label="Confirm new PIN" value={pin2} onChange={setPin2} />
                <button type="submit" className="pt-btn full" disabled={busy || pin.length !== 4 || pin2.length !== 4}>{busy ? 'Saving…' : <>Save PIN <ArrowRight size={18} /></>}</button>
                <Notice plain tone="plain" icon={Lock} title="Your security matters">Your PIN keeps your account and rewards safe. Never share your PIN with anyone.</Notice>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ welcome */

export function WelcomePage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    sessionStorage.removeItem('bw_welcome');
    api.get('/loyalty/summary').then(setSummary).catch(() => {});
  }, []);
  const first = memberName(userData).split(' ')[0];
  const balance = summary?.balance ?? userData?.tokens ?? 0;
  const lifetime = summary?.tier?.lifetime_wings ?? userData?.lifetimePointsEarned ?? balance;
  const tier = summary?.tier?.current || userData?.membershipTier || 'Silver';
  const code = summary?.member?.membership_code || userData?.membershipCode;

  return (
    <div className="pt-app">
      <div className="pt-auth">
        <Hero image={IMG.palace} className="pt-auth-art" tall style={{ minHeight: 320 }} right={<span style={{ font: '700 9px sans-serif', letterSpacing: '0.2em', textAlign: 'right', color: 'rgba(255,255,255,.85)', lineHeight: 1.6 }}>TRAVEL<br />MORE<br />BELONG MORE</span>} />
        <div className="pt-auth-panel" style={{ paddingTop: 0 }}>
          <div className="pt-stack lg" style={{ textAlign: 'center' }}>
            <div style={{ marginTop: -46 }}><div className="pt-success-mark" style={{ width: 76, height: 76, background: '#1b9a78', color: '#fff', boxShadow: '0 0 0 8px #fff' }}><CircleCheck size={40} strokeWidth={2} /></div></div>
            <div><h1 className="pt-h1">Welcome to<br />Bright Wings, {first}!</h1><p className="pt-sub" style={{ marginTop: 8 }}>Your membership has been created successfully.</p></div>
            <div className="pt-notice green" style={{ textAlign: 'left', alignItems: 'center' }}>
              <span className="pt-item-icon green round" style={{ background: '#fff' }}><Gift size={20} /></span>
              <div><strong style={{ fontSize: 14 }}>{fmtNum(balance)} welcome Wings added</strong><span style={{ color: 'var(--pt-muted)' }}>Your journey with more rewards starts now.</span></div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="pt-card flat" style={{ overflow: 'hidden', background: `linear-gradient(135deg, #e9e6df, #f6f4ef)`, padding: '18px 18px 16px', position: 'relative' }}>
                <div className="pt-row between top">
                  <span className="pt-brand"><span className="pt-brand-name" style={{ fontSize: 17 }}>Bright Wings</span></span>
                  <span style={{ font: '800 9px sans-serif', letterSpacing: '0.2em', color: 'var(--pt-navy)', textAlign: 'right', lineHeight: 1.5 }}>{tier.toUpperCase()}<br />MEMBER</span>
                </div>
                <h3 className="pt-serif" style={{ fontSize: 22, color: 'var(--pt-navy)', marginTop: 20 }}>{memberName(userData)}</h3>
                <p className="pt-small" style={{ marginTop: 3 }}>{code}</p>
              </div>
              <div className="pt-grid2" style={{ marginTop: 14 }}>
                <div className="pt-row"><Coins size={22} style={{ color: 'var(--pt-gold)' }} /><div><strong style={{ fontSize: 18, color: 'var(--pt-navy)' }}>{fmtNum(balance)}</strong><div className="pt-small">Available Wings</div></div></div>
                <div className="pt-row" style={{ borderLeft: '1px solid var(--pt-line)', paddingLeft: 14 }}><ChartNoAxesColumn size={22} style={{ color: 'var(--pt-gold)' }} /><div><strong style={{ fontSize: 18, color: 'var(--pt-navy)' }}>{fmtNum(lifetime)}</strong><div className="pt-small">Lifetime Wings</div></div></div>
              </div>
            </div>
            <button type="button" className="pt-btn full" onClick={() => navigate('/dashboard', { replace: true })}>Explore my account <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- inactive account */

export function InactivePage() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  return (
    <div className="pt-app">
      <div className="pt-auth">
        <Hero image={IMG.palace} className="pt-auth-art" tall style={{ minHeight: 320 }} />
        <div className="pt-auth-panel" style={{ paddingTop: 0 }}>
          <div className="pt-stack lg" style={{ textAlign: 'center' }}>
            <div style={{ marginTop: -44 }}><div className="pt-success-mark" style={{ width: 76, height: 76, background: '#fbe4e1', color: '#c0443a', boxShadow: '0 0 0 8px #fff' }}><CircleAlert size={38} /></div></div>
            <div><h1 className="pt-h1">Your account is inactive</h1></div>
            <p className="pt-sub">For your security, this account is currently inactive. This may happen due to prolonged inactivity or a security review.</p>
            <p className="pt-sub">To reactivate your account, please contact our support team. We’ll be happy to help you get back to exploring with Bright Wings.</p>
            {CONTACT_EMAIL ? <a className="pt-btn full" href={`mailto:${CONTACT_EMAIL}?subject=Reactivate%20my%20Bright%20Wings%20account`}>Contact support</a> : CONTACT_PHONE ? <a className="pt-btn full" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>Call support</a> : null}
            <button type="button" className="pt-btn ghost full" onClick={async () => { if (currentUser) await logout().catch(() => {}); navigate('/auth', { replace: true }); }}>Return to sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

