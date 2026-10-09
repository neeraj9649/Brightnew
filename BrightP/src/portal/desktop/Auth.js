import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChartNoAxesColumn, CircleAlert, Eye, EyeOff, Gift, IdCard, Lock, Plane, Search, Star, Ticket, User, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { BrightLogo, Field, Notice, PhoneField, PinBoxes, fmtNum, useAsync } from '../ui';
import { PHOTO } from '../photos';

/* ---------------------------------------------------------------- sign in */

export function DeskLogin({ phone, setPhone, pin, setPin, showPin, setShowPin, errors, busy, onSubmit, onForgot, onJoin }) {
  const navigate = useNavigate();
  return (
    <div className="pt-app da2-login">
      <section className="da2-left">
        <button type="button" className="da2-logo" onClick={() => navigate('/')} aria-label="Bright Wings home"><img src={BrightLogo} alt="" /><span><b>Bright Wings</b><small>Travel further together</small></span></button>
        <form onSubmit={onSubmit} noValidate className="da2-form">
          <div className="dp-eyebrow" style={{ padding: 0, color: '#b8832a', fontSize: 12 }}>BRIGHT WINGS LOYALTY PORTAL</div>
          <h1 className="pt-title" style={{ marginTop: 14, fontSize: 'clamp(46px, 4.6vw, 62px)' }}>Welcome back</h1>
          <p className="pt-lede" style={{ marginTop: 14, fontSize: 18 }}>Sign in to manage your bookings, view and redeem your Wings, and unlock a more rewarding tomorrow — all in one place.</p>
          <div className="pt-stack lg" style={{ marginTop: 30 }}>
            {errors.form && <Notice tone="red" icon={CircleAlert}>{errors.form}</Notice>}
            <Field label="Mobile number" error={errors.phone}><PhoneField value={phone} onChange={setPhone} error={errors.phone} placeholder="98765 43210" /></Field>
            <Field label="Enter your 4-digit PIN" error={errors.pin}>
              <div className="da2-pinrow"><PinBoxes value={pin} onChange={setPin} show={showPin} error={!!errors.pin} label="4-digit PIN" /><button type="button" className="da2-eye" onClick={() => setShowPin(!showPin)} aria-pressed={showPin}>{showPin ? <EyeOff size={22} /> : <Eye size={22} />} {showPin ? 'Hide PIN' : 'Show PIN'}</button></div>
            </Field>
            <button type="submit" className="pt-navy-btn da2-submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={20} /></>}</button>
            <button type="button" className="pt-link" style={{ justifySelf: 'start', color: 'var(--pt-navy)' }} onClick={onForgot}>Forgot PIN?</button>
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

const PwdBox = ({ value, onChange, placeholder, show, label, error }) => (
  <div className={`da2-pwd ${error ? 'err' : ''}`}>
    <Lock size={20} />
    <input type={show ? 'text' : 'password'} inputMode="numeric" autoComplete="off" maxLength={4} value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))} />
  </div>
);

export function DeskJoin({ name, setName, phone, setPhone, pin, setPin, pin2, setPin2, referral, setReferral, agree, setAgree, showPin, setShowPin, errors, busy, onSubmit, onSignIn, onTerms }) {
  const navigate = useNavigate();
  const { data: program } = useAsync(() => api.get('/public/program').catch(() => null), []);
  const welcome = program?.welcome_bonus;
  const benefits = [
    [Ticket, 'Get your member code instantly', 'Your unique Bright Wings member code is created as soon as you join.'],
    [IdCard, 'Receive your digital membership card', 'A beautiful digital card, ready to use immediately.'],
    [Wallet, 'Your personal Wings wallet', 'Track and use your Wings for flights, holidays and more.'],
    [ChartNoAxesColumn, welcome ? <>Start at Silver tier with <em>{fmtNum(welcome)} welcome Wings</em></> : 'Start at Silver tier with welcome Wings', welcome ? `You’ll be a Silver member from day one with ${fmtNum(welcome)} welcome Wings in your wallet.` : 'You’ll be a Silver member from day one.'],
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
            <Field label="Full name" error={errors.name}><div className={`da2-pwd ${errors.name ? 'err' : ''}`}><User size={20} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" aria-label="Full name" /></div></Field>
            <Field label="Phone number" error={errors.phone}><PhoneField value={phone} onChange={setPhone} error={errors.phone} placeholder="Enter your phone number" /></Field>
            <div className="dp-grid2" style={{ gap: 16 }}>
              <Field label="4-digit PIN" error={errors.pin}><PwdBox value={pin} onChange={setPin} placeholder="Enter 4-digit PIN" show={showPin} label="4-digit PIN" error={errors.pin} /></Field>
              <Field label="Confirm PIN" error={errors.pin2}><PwdBox value={pin2} onChange={setPin2} placeholder="Re-enter 4-digit PIN" show={showPin} label="Confirm PIN" error={errors.pin2} /></Field>
            </div>
            <label className="pt-check" style={{ marginTop: -6 }}><input type="checkbox" checked={showPin} onChange={(e) => setShowPin(e.target.checked)} /><span className="box">{showPin ? '✓' : ''}</span><span>Show PIN</span></label>
            <Field label="Referral code" optional error={errors.referral}><div className={`da2-pwd ${errors.referral ? 'err' : ''}`}><Gift size={20} /><input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="Enter a friend’s code" aria-label="Referral code" /></div></Field>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="pt-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span className="box">{agree ? '✓' : ''}</span><span>I agree to the Bright Wings <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); onTerms(); }}>Terms &amp; Conditions</button> and acknowledge the <button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={(e) => { e.preventDefault(); onTerms(); }}>Privacy Policy</button>.</span></label>
              {errors.agree && <span className="pt-err-text"><CircleAlert size={13} /> {errors.agree}</span>}
            </div>
            <button type="submit" className="pt-gold-btn full" disabled={busy}>{busy ? 'Creating membership…' : <>Create membership <ArrowRight size={19} /></>}</button>
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
