import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChartNoAxesColumn, CircleAlert, CircleCheck, Coins, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Check2, Field, Hero, IMG, Input, isValidPhone, Modal, ModalHead, Notice, PhoneField,
  fmtNum, memberName, toStoredPhone, useWide,
} from '../ui';
import { DeskJoin, DeskLogin, OTP_LENGTH, OtpEntry, PasscodeCreate, PasscodeInput } from '../desktop/Auth';

const inactiveMessage = 'Your account is inactive. Contact Bright Wings support to reactivate it.';

export function TermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} label="Terms and conditions">
      <ModalHead title="Terms & Conditions" onClose={onClose} sub="Bright Wings membership and Wings program" />
      <div className="pt-stack" style={{ fontSize: 13, color: 'var(--pt-muted)', lineHeight: 1.6 }}>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Membership.</strong> Joining is free. Every new member joins at the Member level and receives the welcome Wings shown at enrolment. You sign in with your phone number and the 4-digit passcode you choose. We text a one-time code to confirm your number when you join or reset your passcode. Never share your passcode or any code with anyone, including Bright Wings staff.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Earning Wings.</strong> Wings are credited after a service is completed, at the rates published in the portal. First-booking bonuses and referral rewards are credited once per eligible member. Cancelled bookings do not earn Wings.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Tiers.</strong> Your tier is based on lifetime Wings earned. Redeeming Wings never reduces your lifetime Wings or lowers your tier.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Redemptions.</strong> Rewards are subject to availability and approval. Wings are reserved when you submit a request and refunded in full if it is rejected or cancelled. Vouchers are valid until the date shown on the voucher.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Quotations.</strong> Prices are confirmed by your travel advisor in a written quotation. A quotation is valid until the date shown and no payment is taken in the portal.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Privacy.</strong> We use your details only to provide travel services, support and the Wings program. The membership verification page shows only your name, member number, tier and validity.</p>
        <p><strong style={{ color: 'var(--pt-navy)' }}>Changes.</strong> Bright Wings may update program rules with notice in the portal. Accounts may be deactivated for misuse.</p>
      </div>
      <button type="button" className="pt-btn full" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
    </Modal>
  );
}

/* ------------------------------------------------------------ main auth page */

const emptyErrors = {};
const PASSCODE_LENGTH = 4;

/**
 * Sign in:          phone + 4-digit passcode.
 * Join:             details -> 6-digit code by SMS -> choose passcode.
 * Forgot passcode:  phone -> 6-digit code by SMS -> choose a new passcode (signs in).
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { requestOtp, signIn, signUp, resetPasscode } = useAuth();
  const wide = useWide();
  const initialRef = params.get('ref') || '';
  const requestedMode = params.get('mode');
  const initialMode = requestedMode === 'login' || requestedMode === 'forgot' ? requestedMode : initialRef || requestedMode === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode); // login | register | forgot

  const [step, setStep] = useState('phone'); // register/forgot: phone -> code -> passcode
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
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

  const clearSecrets = () => { setCode(''); setPasscode(''); setConfirm(''); };
  const backToPhone = () => { setStep('phone'); setSent(null); clearSecrets(); setErrors(emptyErrors); };

  // The phone number is kept when switching, so "Forgot passcode?" needs no retyping.
  const go = (next) => {
    setMode(next);
    backToPhone();
    const nextParams = new URLSearchParams(params);
    if (next === 'login' && !nextParams.has('ref')) nextParams.delete('mode');
    else nextParams.set('mode', next);
    setParams(nextParams, { replace: true, state: location.state });
  };

  const goHome = (user) => navigate(location.state?.from || (user?.role === 'customer' ? '/dashboard' : '/admin'), { replace: true });

  const sendCode = async () => {
    const purpose = mode === 'register' ? 'register' : 'reset';
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
      if (error.status === 403) setErrors({ form: inactiveMessage });
      else if (purpose === 'register' && message.toLowerCase().includes('referral')) setErrors({ referral: 'That code is not valid — check it and try again' });
      else if (purpose === 'register' && error.status === 409) setErrors({ form: 'This phone number is already registered. Sign in instead, or use Forgot passcode.' });
      else if (error.status === 404) setErrors({ phone: message });
      else setErrors({ form: message });
    } finally {
      setBusy(false);
    }
  };

  // Code step -> passcode step. The code itself is checked by the server together with the new
  // passcode; a wrong code brings the member back here.
  const continueWithCode = (value = code) => {
    const length = sent?.code_length || OTP_LENGTH;
    if (value.length !== length) { setErrors({ code: `Enter the ${length}-digit code` }); return; }
    setErrors(emptyErrors);
    setStep('passcode');
  };

  const passcodeErrors = () => {
    const next = {};
    if (passcode.length !== PASSCODE_LENGTH) next.passcode = 'Enter all 4 digits';
    else if (/^(\d)\1{3}$/.test(passcode) || passcode === '1234' || passcode === '4321') next.passcode = 'Too easy to guess. Choose a different passcode';
    if (!next.passcode && confirm !== passcode) next.confirm = confirm.length < PASSCODE_LENGTH ? 'Enter the passcode again to confirm' : 'The passcodes don’t match';
    return next;
  };

  // A rejected code (400/429) goes back to the code step; the chosen passcode is kept.
  const finishError = (error) => {
    if (error.status === 403) { setErrors({ form: inactiveMessage }); return; }
    if (error.status === 400 && /passcode/i.test(error.message || '')) { setErrors({ passcode: error.message }); return; }
    if (error.status === 400 || error.status === 429) {
      setStep('code');
      setCode('');
      setErrors({ code: error.message || 'That code is incorrect or has expired' });
      return;
    }
    setErrors({ form: error.message || 'Something went wrong. Please try again.' });
  };

  // `pin` is passed in when the 4th box is filled, before the passcode state has updated.
  const login = async (pin = passcode) => {
    if (busy) return;
    const next = {};
    if (!isValidPhone(phone)) next.phone = 'Enter a valid mobile number';
    if (pin.length !== PASSCODE_LENGTH) next.passcode = 'Enter your 4-digit passcode';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      goHome(await signIn(toStoredPhone(phone), pin));
    } catch (error) {
      if (error.status === 403) setErrors({ form: inactiveMessage });
      else if (error.status === 404) setErrors({ phone: error.message });
      else if (error.status === 401 || error.status === 400) { setErrors({ passcode: error.message || 'That passcode is incorrect' }); setPasscode(''); document.getElementById('passcode-0')?.focus(); }
      else setErrors({ form: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };
  const submitLogin = (event) => { event.preventDefault(); login(); };

  const submitRegister = async (event) => {
    event?.preventDefault();
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
    if (step === 'code') { continueWithCode(); return; }
    const next = passcodeErrors();
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      sessionStorage.setItem('bw_welcome', '1');
      await signUp(toStoredPhone(phone), code, passcode, { name: name.trim(), referredByCode: referral.trim() || undefined });
      navigate('/welcome', { replace: true });
    } catch (error) {
      sessionStorage.removeItem('bw_welcome');
      if (error.status === 409) { backToPhone(); setErrors({ form: 'This phone number is already registered. Sign in instead, or use Forgot passcode.' }); }
      else if (error.message?.toLowerCase().includes('referral')) { backToPhone(); setErrors({ referral: 'That code is not valid — check it and try again' }); }
      else finishError(error);
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event) => {
    event?.preventDefault();
    if (step === 'phone') {
      if (!isValidPhone(phone)) { setErrors({ phone: 'Enter a valid mobile number' }); return; }
      await sendCode();
      return;
    }
    if (step === 'code') { continueWithCode(); return; }
    const next = passcodeErrors();
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const user = await resetPasscode(toStoredPhone(phone), code, passcode);
      toast.success('Your new passcode is set');
      goHome(user);
    } catch (error) {
      if (error.status === 404) { backToPhone(); setErrors({ phone: error.message }); }
      else finishError(error);
    } finally {
      setBusy(false);
    }
  };

  /* ----- shared pieces */
  const codeStep = (
    <OtpEntry phone={phone} code={code} setCode={setCode} error={errors.code} sent={sent} cooldown={cooldown}
      onResend={sendCode} onChangeNumber={backToPhone} busy={busy} onComplete={(value) => continueWithCode(value)} />
  );
  const passcodeStep = (
    <PasscodeCreate passcode={passcode} setPasscode={setPasscode} confirm={confirm} setConfirm={setConfirm}
      errors={errors} phone={phone} onBack={() => { setStep('code'); setErrors(emptyErrors); }} />
  );
  const flowStep = step === 'code' ? codeStep : passcodeStep;
  const Arrow = wide ? <ArrowRight size={19} /> : <ArrowRight size={18} />;
  const flowSubmit = (finalLabel, finalBusy) => (
    step === 'phone' ? (busy ? 'Sending code…' : <>Send code {Arrow}</>)
      : step === 'code' ? <>Continue {Arrow}</>
        : (busy ? finalBusy : <>{finalLabel} {Arrow}</>)
  );
  const phoneHint = mode === 'register' ? 'We’ll text you a 6-digit code to confirm it.' : 'We’ll text you a 6-digit code to reset your passcode.';

  const loginFields = (
    <>
      <Field label={wide ? 'Mobile number' : 'Phone number'} error={errors.phone}>
        <PhoneField value={phone} onChange={setPhone} error={errors.phone} placeholder={wide ? '98765 43210' : undefined} />
      </Field>
      <PasscodeInput value={passcode} onChange={setPasscode} error={errors.passcode} onForgot={() => go('forgot')}
        onComplete={(pin) => { if (isValidPhone(phone)) login(pin); }} />
    </>
  );
  const loginSubmit = busy ? 'Signing in…' : <>Sign in {Arrow}</>;

  /* ----- join */
  if (mode === 'register' && wide) {
    return (
      <>
        <DeskJoin name={name} setName={setName} phone={phone} setPhone={setPhone} step={step}
          referral={referral} setReferral={setReferral} agree={agree} setAgree={setAgree}
          errors={errors} busy={busy} onSubmit={submitRegister} onSignIn={() => go('login')} onTerms={() => setTerms(true)}
          submit={flowSubmit('Create membership', 'Creating membership…')}>
          {flowStep}
        </DeskJoin>
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
                  <Field label="Phone number" error={errors.phone} hint={phoneHint}>
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
              ) : flowStep}
              <button type="submit" className="pt-btn full" disabled={busy}>{flowSubmit('Create membership', 'Creating membership…')}</button>
              <p className="pt-small" style={{ textAlign: 'center' }}>Already a member? <button type="button" className="pt-link" onClick={() => go('login')}>Sign in</button></p>
            </form>
            <TermsModal open={terms} onClose={() => setTerms(false)} />
          </div>
        </div>
      </div>
    );
  }

  /* ----- forgot passcode */
  if (mode === 'forgot') {
    const body = step === 'phone'
      ? <Field label={wide ? 'Mobile number' : 'Phone number'} error={errors.phone} hint={phoneHint}><PhoneField value={phone} onChange={setPhone} error={errors.phone} /></Field>
      : flowStep;
    const submit = flowSubmit('Save passcode & sign in', 'Saving…');
    const back = <button type="button" className="pt-link" style={{ alignSelf: 'center' }} onClick={() => go('login')}>Back to sign in</button>;
    if (wide) {
      return (
        <DeskLogin title="Reset passcode" lede="We’ll text a 6-digit code to your registered number. Then choose a new passcode and you’re signed in."
          errors={errors} busy={busy} onSubmit={submitForgot} onJoin={() => go('register')} submit={submit}>
          {body}
          {back}
        </DeskLogin>
      );
    }
    return (
      <div className="pt-app">
        <div className="pt-auth">
          <Hero image={IMG.beach} className="pt-auth-art" tall style={{ minHeight: 260 }}
            title={<>Reset your<br />passcode.</>} subtitle="A code by SMS, then a new passcode." />
          <div className="pt-auth-panel">
            <form onSubmit={submitForgot} noValidate className="pt-stack lg">
              {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
              {body}
              <button type="submit" className="pt-btn full" disabled={busy}>{submit}</button>
              {back}
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ----- sign in */
  if (wide) {
    return (
      <DeskLogin errors={errors} busy={busy} onSubmit={submitLogin} onJoin={() => go('register')}
        submit={loginSubmit}>
        {loginFields}
      </DeskLogin>
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
            {loginFields}
            <button type="submit" className="pt-btn full" disabled={busy}>{loginSubmit}</button>
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
