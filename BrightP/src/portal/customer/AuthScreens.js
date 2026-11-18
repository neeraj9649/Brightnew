import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChartNoAxesColumn, CircleAlert, CircleCheck, Coins, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Check2, Field, Hero, IMG, Input, isValidPhone, Modal, ModalHead, Notice, PhoneField,
  fmtNum, memberName, toStoredPhone, useWide,
} from '../ui';
import { DeskJoin, DeskLogin, OtpEntry } from '../desktop/Auth';

// Support contact details are configured per deployment (REACT_APP_CONTACT_EMAIL / _PHONE).
const CONTACT_EMAIL = (process.env.REACT_APP_CONTACT_EMAIL || '').trim();
const CONTACT_PHONE = (process.env.REACT_APP_CONTACT_PHONE || '').trim();

export function TermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} label="Terms and conditions">
      <ModalHead title="Terms & Conditions" onClose={onClose} sub="Bright Wings membership and Wings program" />
      <div className="pt-stack" style={{ fontSize: 13, color: 'var(--pt-muted)', lineHeight: 1.6 }}>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Membership.</strong> Joining is free. Every new member joins at the Member level and receives the welcome Wings shown at enrolment. Your phone number is your login identity: we text a one-time code to it each time you sign in. Never share that code with anyone.</p>
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

/**
 * Sign in and join both work in two steps: phone number (plus join details) -> 4-digit code by SMS.
 * There is no PIN.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { requestOtp, signIn, signUp } = useAuth();
  const wide = useWide();
  const initialRef = params.get('ref') || '';
  // Old "?mode=forgot" links (Forgot PIN) now simply open sign in.
  const [mode, setMode] = useState(initialRef || params.get('mode') === 'register' ? 'register' : 'login');

  const [step, setStep] = useState('phone'); // phone -> code
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  // join only
  const [name, setName] = useState('');
  const [referral, setReferral] = useState(initialRef.toUpperCase());
  const [agree, setAgree] = useState(false);
  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState(emptyErrors);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const backToPhone = () => { setStep('phone'); setCode(''); setSent(null); setErrors(emptyErrors); };

  const go = (next) => {
    setMode(next);
    backToPhone();
    const nextParams = new URLSearchParams(params);
    nextParams.delete('mode');
    setParams(nextParams, { replace: true });
  };

  const purpose = mode === 'register' ? 'register' : 'login';

  const sendCode = async () => {
    setBusy(true);
    setErrors(emptyErrors);
    try {
      const data = await requestOtp(toStoredPhone(phone), purpose, purpose === 'register' ? referral.trim() : undefined);
      setSent(data);
      setCode('');
      setStep('code');
      setCooldown(data?.resend_after_seconds || 60);
    } catch (error) {
      const message = error.message || 'We could not send your code. Please try again.';
      if (error.status === 403) navigate('/inactive', { replace: true });
      else if (purpose === 'register' && message.toLowerCase().includes('referral')) setErrors({ referral: 'That code is not valid — check it and try again' });
      else if (purpose === 'register' && error.status === 409) setErrors({ form: 'This phone number is already registered. Try signing in instead.' });
      else setErrors({ form: message });
    } finally {
      setBusy(false);
    }
  };

  const codeError = (error) => {
    if (error.status === 403) { navigate('/inactive', { replace: true }); return; }
    setErrors(error.status === 400 || error.status === 401 ? { code: error.message || 'That code is incorrect or has expired' } : { form: error.message || 'Something went wrong. Please try again.' });
    setCode('');
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    if (step === 'phone') {
      if (!isValidPhone(phone)) { setErrors({ phone: 'Enter a valid mobile number' }); return; }
      await sendCode();
      return;
    }
    if (code.length !== (sent?.code_length || 4)) { setErrors({ code: 'Enter the 4-digit code' }); return; }
    setBusy(true);
    setErrors(emptyErrors);
    try {
      const user = await signIn(toStoredPhone(phone), code);
      navigate(user?.role === 'customer' ? '/dashboard' : '/admin', { replace: true });
    } catch (error) {
      codeError(error);
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    if (step === 'phone') {
      const next = {};
      if (name.trim().length < 2) next.name = 'Please enter your full name';
      if (!isValidPhone(phone)) next.phone = 'Enter a valid mobile number';
      if (!agree) next.agree = 'Please accept the Terms & Conditions to continue';
      setErrors(next);
      if (Object.keys(next).length) return;
      await sendCode();
      return;
    }
    if (code.length !== (sent?.code_length || 4)) { setErrors({ code: 'Enter the 4-digit code' }); return; }
    setBusy(true);
    setErrors(emptyErrors);
    try {
      sessionStorage.setItem('bw_welcome', '1');
      await signUp(toStoredPhone(phone), code, { name: name.trim(), referredByCode: referral.trim() || undefined });
      navigate('/welcome', { replace: true });
    } catch (error) {
      sessionStorage.removeItem('bw_welcome');
      if (error.status === 409) { backToPhone(); setErrors({ form: 'This phone number is already registered. Try signing in instead.' }); }
      else if (error.message?.toLowerCase().includes('referral')) { backToPhone(); setErrors({ referral: 'That code is not valid — check it and try again' }); }
      else codeError(error);
    } finally {
      setBusy(false);
    }
  };

  const otp = { code, setCode, sent, cooldown, onResend: sendCode, onChangeNumber: backToPhone };
  const codeStep = <OtpEntry phone={phone} error={errors.code} busy={busy} {...otp} />;

  if (mode === 'register' && wide) {
    return (
      <>
        <DeskJoin name={name} setName={setName} phone={phone} setPhone={setPhone} step={step} otp={otp}
          referral={referral} setReferral={setReferral} agree={agree} setAgree={setAgree}
          errors={errors} busy={busy} onSubmit={submitRegister} onSignIn={() => go('login')} onTerms={() => setTerms(true)} />
        <TermsModal open={terms} onClose={() => setTerms(false)} />
      </>
    );
  }

  if (mode === 'register') {
    return (
      <div className="pt-app">
        <div className="pt-auth">
          <Hero image={IMG.palace} className="pt-auth-art" tall style={{ minHeight: 300 }}
            title={<>Join Bright Wings.<br />Get 200 welcome Wings.</>}
            subtitle="Start your journey to exclusive travel rewards." />
          <div className="pt-auth-panel">
            <form onSubmit={submitRegister} noValidate className="pt-stack lg">
              {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
              {step === 'phone' ? (
                <>
                  <Field label="Full name" error={errors.name}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aanya Sharma" autoComplete="name" error={errors.name} />
                  </Field>
                  <Field label="Phone number" error={errors.phone} hint="We’ll text you a 4-digit code to confirm it.">
                    <PhoneField value={phone} onChange={setPhone} error={errors.phone} />
                  </Field>
                  <Field label="Referral or staff code" optional hint="From a friend or your travel advisor." error={errors.referral}>
                    <Input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="Enter code" error={errors.referral} />
                  </Field>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <Check2 checked={agree} onChange={setAgree}>I agree to the <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); setTerms(true); }}>Terms &amp; Conditions</button></Check2>
                    {errors.agree && <span className="pt-err-text"><CircleAlert size={13} /> {errors.agree}</span>}
                  </div>
                </>
              ) : codeStep}
              <button type="submit" className="pt-btn full" disabled={busy}>
                {step === 'phone'
                  ? (busy ? 'Sending code…' : <>Send code <ArrowRight size={18} /></>)
                  : (busy ? 'Creating membership…' : <>Create membership <ArrowRight size={18} /></>)}
              </button>
              <p className="pt-small" style={{ textAlign: 'center' }}>Already a member? <button type="button" className="pt-link" onClick={() => go('login')}>Sign in</button></p>
            </form>
            <TermsModal open={terms} onClose={() => setTerms(false)} />
          </div>
        </div>
      </div>
    );
  }

  if (wide) {
    return (
      <DeskLogin phone={phone} setPhone={setPhone} step={step} otp={otp} errors={errors} busy={busy}
        onSubmit={submitLogin} onJoin={() => go('register')} />
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
            {step === 'phone'
              ? <Field label="Phone number" error={errors.phone} hint="We’ll text you a 4-digit code to sign in."><PhoneField value={phone} onChange={setPhone} error={errors.phone} /></Field>
              : codeStep}
            <button type="submit" className="pt-btn full" disabled={busy}>
              {step === 'phone'
                ? (busy ? 'Sending code…' : <>Send code <ArrowRight size={18} /></>)
                : (busy ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>)}
            </button>
            <div className="pt-row" style={{ gap: 14 }}><hr className="pt-divider" style={{ flex: 1, margin: 0 }} /><span className="pt-small">New to Bright Wings?</span><hr className="pt-divider" style={{ flex: 1, margin: 0 }} /></div>
            <button type="button" className="pt-btn ghost full" onClick={() => go('register')}>Join Bright Wings</button>
          </form>
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
  const tier = summary?.tier?.current || userData?.membershipTier || 'Member';
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
                  <span style={{ font: '800 9px sans-serif', letterSpacing: '0.2em', color: 'var(--pt-navy)', textAlign: 'right', lineHeight: 1.5 }}>{tier === 'Member' ? 'BRIGHT WINGS' : tier.toUpperCase()}<br />MEMBER</span>
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

