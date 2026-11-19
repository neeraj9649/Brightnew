import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChartNoAxesColumn, CircleAlert, Eye, EyeOff, Gift, IdCard, Plane, Search, ShieldCheck, Smartphone, Star, Ticket, User, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { BrightLogo, Field, Notice, PhoneField, PinBoxes, fmtNum, formatPhone, useAsync } from '../ui';
import { PHOTO } from '../photos';

/* ------------------------------------------------------- one-time code step */

/** Digits in the SMS code; the server also says so in `code_length`. The passcode stays 4 digits. */
export const OTP_LENGTH = 6;

/**
 * The "enter the code we sent" step of joining and of Forgot passcode, on every screen size.
 * `sent` is the /auth/otp/request response.
 */
export function OtpEntry({ phone, code, setCode, error, sent, cooldown, onResend, onChangeNumber, busy, onComplete }) {
  const length = sent?.code_length || OTP_LENGTH;
  const where = sent?.channel === 'email' ? 'your e-mail address' : formatPhone(phone);
  return (
    <div className="pt-stack" style={{ gap: 14 }}>
      <Notice tone="green" icon={Smartphone}>We sent a {length}-digit code to <strong style={{ display: 'inline' }}>{where}</strong>. It expires in 10 minutes.</Notice>
      {sent?.dev_code && <Notice tone="amber" icon={Smartphone} title="Development mode">Your code is <strong style={{ display: 'inline' }}>{sent.dev_code}</strong>. Shown only when OTP_DEV_ECHO is on.</Notice>}
      <Field label={`Enter the ${length}-digit code`} error={error}>
        <PinBoxes id="otp" value={code} onChange={setCode} onComplete={onComplete} length={length} size={length > 4 ? 'sm' : undefined} show autoFocus autoComplete="one-time-code" label="Verification code" error={!!error} />
      </Field>
      <div className="pt-row between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="pt-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onChangeNumber}><ArrowLeft size={15} /> Change number</button>
        {cooldown > 0
          ? <span className="pt-small">Resend code in {cooldown}s</span>
          : <button type="button" className="pt-link" onClick={onResend} disabled={busy}>Resend code</button>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- passcode */

function ShowToggle({ show, setShow }) {
  return (
    <button type="button" className="pt-link" onClick={() => setShow((v) => !v)} aria-pressed={show}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}{show ? 'Hide' : 'Show'}
    </button>
  );
}

/** Sign-in passcode: 4 boxes with show/hide and the Forgot passcode link. */
export function PasscodeInput({ value, onChange, error, onForgot, onComplete, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <Field label="4-digit passcode" error={error} right={<ShowToggle show={show} setShow={setShow} />}>
      <div className="pt-stack" style={{ gap: 10 }}>
        <PinBoxes id="passcode" value={value} onChange={onChange} onComplete={onComplete} show={show} autoFocus={autoFocus} label="Passcode" error={!!error} />
        {onForgot && <button type="button" className="pt-link" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={onForgot}>Forgot passcode?</button>}
      </div>
    </Field>
  );
}

/** Choose a passcode (joining, or after Forgot passcode): passcode + confirmation. */
export function PasscodeCreate({ passcode, setPasscode, confirm, setConfirm, errors, phone, onBack }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pt-stack" style={{ gap: 16 }}>
      <Notice tone="green" icon={ShieldCheck}>{formatPhone(phone)} is verified. Now choose the 4-digit passcode you will sign in with.</Notice>
      <Field label="Create passcode" error={errors.passcode} right={<ShowToggle show={show} setShow={setShow} />}>
        <PinBoxes id="new-passcode" value={passcode} onChange={setPasscode} show={show} autoFocus label="New passcode" error={!!errors.passcode}
          onComplete={() => document.getElementById('confirm-passcode-0')?.focus()} />
      </Field>
      <Field label="Confirm passcode" error={errors.confirm}>
        <PinBoxes id="confirm-passcode" value={confirm} onChange={setConfirm} show={show} label="Confirm passcode" error={!!errors.confirm} />
      </Field>
      <p className="pt-small" style={{ margin: 0 }}>Avoid easy guesses like 1234 or your birth year. Never share your passcode, not even with Bright Wings staff.</p>
      {onBack && <button type="button" className="pt-link" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onBack}><ArrowLeft size={15} /> Back</button>}
    </div>
  );
}

/* ---------------------------------------------------------------- sign in */

/** Sign in and Forgot passcode share this layout; the screen passes the form body. */
export function DeskLogin({ title = 'Welcome back', lede, errors, busy, onSubmit, onJoin, submit, children }) {
  const navigate = useNavigate();
  return (
    <div className="pt-app da2-login">
      <section className="da2-left">
        <button type="button" className="da2-logo" onClick={() => navigate('/')} aria-label="Bright Wings home"><img src={BrightLogo} alt="" /><span><b>Bright Wings</b><small>Travel further together</small></span></button>
        <form onSubmit={onSubmit} noValidate className="da2-form">
          <div className="dp-eyebrow" style={{ padding: 0, color: '#b8832a', fontSize: 12 }}>BRIGHT WINGS LOYALTY PORTAL</div>
          <h1 className="pt-title" style={{ marginTop: 14, fontSize: 'clamp(46px, 4.6vw, 62px)' }}>{title}</h1>
          <p className="pt-lede" style={{ marginTop: 14, fontSize: 18 }}>{lede || 'Sign in to manage your bookings, view and redeem your Wings, and unlock a more rewarding tomorrow — all in one place.'}</p>
          <div className="pt-stack lg" style={{ marginTop: 30 }}>
            {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
            {children}
            <button type="submit" className="pt-navy-btn da2-submit" disabled={busy}>{submit}</button>
            <hr className="pt-divider" />
            <div><b style={{ fontSize: 17, color: 'var(--pt-navy)' }}>New to Bright Wings?</b><div><button type="button" className="pt-link" style={{ color: 'var(--pt-navy)', fontSize: 17, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onJoin}>Create your membership <ArrowRight size={16} style={{ verticalAlign: -3 }} /></button></div></div>
          </div>
          <ul className="da2-feats">{[[Gift, 'Earn and redeem Wings'], [Plane, 'Manage bookings easily'], [Star, 'Exclusive offers and experiences']].map(([Icon, t]) => <li key={t}><Icon size={30} strokeWidth={1.3} />{t}</li>)}</ul>
        </form>
      </section>
      <section className="da2-right" style={{ backgroundImage: `url(${PHOTO.domes})` }}>
        <nav aria-label="Bright Wings"><Link to="/#services">Fly</Link><Link to="/#wings">Earn</Link><Link to="/rewards">Redeem</Link><Link to="/#destinations">Offers</Link><Link to="/#faq">Help</Link></nav>
        <div className="da2-tag"><h2>More places.<br />Brighter tomorrows.</h2><span /><small>TRAVEL FURTHER TOGETHER</small></div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------- join */

export function DeskJoin({ name, setName, phone, setPhone, step, referral, setReferral, agree, setAgree, errors, busy, onSubmit, onSignIn, onTerms, submit, children }) {
  const navigate = useNavigate();
  const { data: program } = useAsync(() => api.get('/public/program').catch(() => null), []);
  const welcome = program?.welcome_bonus;
  const benefits = [
    [Ticket, 'Get your member code instantly', 'Your unique Bright Wings member code is created as soon as you join.'],
    [IdCard, 'Receive your digital membership card', 'A beautiful digital card, ready to use immediately.'],
    [Wallet, 'Your personal Wings wallet', 'Track and use your Wings for flights, holidays and more.'],
    [ChartNoAxesColumn, welcome ? <>Start earning with <em>{fmtNum(welcome)} welcome Wings</em></> : 'Start earning with welcome Wings', welcome ? `Join as a Member with ${fmtNum(welcome)} welcome Wings in your wallet and move up to Silver at 10,000 points.` : 'Join as a Member and move up to Silver at 10,000 points.'],
  ];
  return (
    <div className="pt-app da2-join" style={{ backgroundImage: `url(${PHOTO.santorini})` }}>
      <header className="da2-nav">
        <button type="button" className="da2-logo" onClick={() => navigate('/')}><img src={BrightLogo} alt="" /><span><b>BRIGHT WINGS</b><small>FLY MORE · LIVE BRIGHTER</small></span></button>
        <nav aria-label="Sections"><Link to="/#services">Flights</Link><Link to="/#destinations">Holidays</Link><Link to="/#wings" className="on">Bright Wings</Link><Link to="/#destinations">Offers</Link><Link to="/#faq">Help</Link></nav>
        <div className="pt-row" style={{ gap: 18 }}><Search size={20} /><i /><button type="button" onClick={onSignIn}>Sign in</button></div>
      </header>
      <div className="da2-join-grid">
        <form className="da2-card" onSubmit={onSubmit} noValidate>
          <div className="dp-eyebrow" style={{ padding: 0, fontSize: 12, color: '#b8832a' }}>BRIGHT WINGS LOYALTY PROGRAM</div>
          <h1 className="pt-title" style={{ marginTop: 10, fontSize: 46 }}>Join Bright Wings</h1>
          <p className="pt-lede" style={{ marginTop: 6, fontSize: 17 }}>A more rewarding way to travel. Quick sign up, instant benefits.</p>
          <div className="pt-stack lg" style={{ marginTop: 22 }}>
            {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
            {step === 'phone' ? (
              <>
                <Field label="Full name" error={errors.name}><div className={`da2-pwd ${errors.name ? 'err' : ''}`}><User size={20} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" aria-label="Full name" /></div></Field>
                <Field label="Phone number" error={errors.phone} hint="We’ll text you a 6-digit code to confirm it."><PhoneField value={phone} onChange={setPhone} error={errors.phone} placeholder="Enter your phone number" /></Field>
                <Field label="Referral or staff code" optional error={errors.referral}><div className={`da2-pwd ${errors.referral ? 'err' : ''}`}><Gift size={20} /><input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="Friend’s or advisor’s code" aria-label="Referral or staff code" /></div></Field>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="pt-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span className="box">{agree ? '✓' : ''}</span><span>I agree to the Bright Wings <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); onTerms(); }}>Terms &amp; Conditions</button> and acknowledge the <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); onTerms(); }}>Privacy Policy</button>.</span></label>
                  {errors.agree && <span className="pt-err-text"><CircleAlert size={13} /> {errors.agree}</span>}
                </div>
              </>
            ) : children}
            <button type="submit" className="pt-gold-btn full" disabled={busy}>{submit}</button>
            <hr className="pt-divider" style={{ margin: 0 }} />
            <p style={{ textAlign: 'center', margin: 0, color: '#55657a' }}>Already a member? <button type="button" className="pt-link" style={{ color: 'var(--pt-navy)' }} onClick={onSignIn}>Sign in</button></p>
          </div>
        </form>
        <aside className="da2-benefits">
          <div className="dp-eyebrow" style={{ padding: 0, fontSize: 12, color: '#55657a', letterSpacing: '0.24em' }}>ENROLL TODAY</div>
          <h2>Travel further<br />with brighter rewards</h2>
          <ul>{benefits.map(([Icon, title, body], i) => <li key={i}><span><Icon size={30} strokeWidth={1.4} /></span><div><b>{title}</b><p>{body}</p></div></li>)}</ul>
          <em>More Journeys<br />Brighter Tomorrows</em>
        </aside>
      </div>
    </div>
  );
}
