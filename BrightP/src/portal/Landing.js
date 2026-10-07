import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, CalendarCheck, ChevronDown, ClipboardCheck, Gift, HeartHandshake, Menu, MessageSquareText, ShieldCheck, Sparkles, UserRoundCheck, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { BrightLogo, IMG, WingsIcon, bg, fmtNum, useAsync } from './ui';
import { SERVICES, SERVICE_ORDER, TIERS, TIER_BENEFITS } from './booking';
import { TermsModal } from './customer/AuthScreens';
import { TierIcon } from './customer/parts';
import './landing.css';

const CONTACT_EMAIL = (process.env.REACT_APP_CONTACT_EMAIL || '').trim();
const CONTACT_PHONE = (process.env.REACT_APP_CONTACT_PHONE || '').trim();

const FlightIcon = SERVICES.flight.Icon;

const NAV = [['how', 'How it works'], ['services', 'Services'], ['wings', 'Wings'], ['destinations', 'Destinations'], ['faq', 'FAQ']];

const STEPS = [
  [ClipboardCheck, 'Tell us about your trip', 'Pick a service, share your dates and travellers. It takes about two minutes.'],
  [MessageSquareText, 'Get a written quotation', 'Your travel advisor replies with a clear quote. Accept it or ask for a change — no payment is taken in the portal.'],
  [WingsIcon, 'Travel and earn Wings', 'Wings are credited when your trip is completed. Spend them on stays, travel and experiences.'],
];

const WHY = [
  [UserRoundCheck, 'A real advisor behind every request', 'A named travel advisor handles your trip from request to completion.'],
  [BadgeCheck, 'Transparent quotations', 'Fares, taxes, inclusions and exclusions in one place, valid until a date you can see.'],
  [CalendarCheck, 'Everything tracked in one place', 'Status, documents, vouchers and Wings activity — on your phone, any time.'],
  [ShieldCheck, 'Simple, private sign-in', 'Phone number and a 4-digit PIN. Public card checks reveal only your name, tier and validity.'],
];

const DESTINATIONS = [
  ['Rajasthan', 'Royal stays and timeless heritage', IMG.palace],
  ['Kerala', 'Backwaters and serene escapes', IMG.backwaters],
  ['Himalayas', 'Mountains, monasteries and more', IMG.mountains],
  ['Goa', 'Beaches, culture and laid-back days', bg(IMG.coast)],
  ['Dubai', 'Skylines, deserts and shopping', IMG.skyline],
  ['Udaipur', 'Lakes, palaces and sunsets', IMG.lake],
];

const FAQ = [
  ['Does it cost anything to join?', 'No. Membership is free. You start on the Silver tier and your welcome Wings are added as soon as you sign up.'],
  ['Do I pay inside the portal?', 'No. You request a quote, your advisor sends a written quotation and you accept it or ask for a change. Payment is arranged with your advisor.'],
  ['When do I receive Wings?', 'After a service is completed. A first-booking bonus and referral rewards are credited once, as shown in the portal. Cancelled requests do not earn Wings.'],
  ['What can I spend Wings on?', 'Rewards such as hotel credits, airport services and experiences. Redemptions are reviewed by our team and Wings are refunded in full if a request is declined.'],
  ['Does spending Wings lower my tier?', 'Never. Your tier follows your lifetime Wings earned, so redeeming rewards does not affect it.'],
  ['I forgot my PIN. What now?', 'Choose “Forgot PIN?” on the sign-in screen. We send a verification code to your registered mobile number and you set a new PIN.'],
];

function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [offset]);
  return scrolled;
}

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, isStaff } = useAuth();
  const scrolled = useScrolled();
  const [menu, setMenu] = useState(false);
  const [terms, setTerms] = useState(false);
  const { data: program } = useAsync(() => api.get('/public/program').catch(() => null), []);

  const portalPath = isStaff ? '/admin' : '/dashboard';
  const join = () => navigate('/auth?mode=register');
  const welcome = program?.welcome_bonus;
  const earn = (type) => (program?.services || []).find((s) => s.type === type)?.points;

  useEffect(() => {
    document.title = 'Bright Wings — Travel, Rewards & Journeys';
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  const go = (id) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pt-app lp">
      {/* ------------------------------------------------------------- nav */}
      <header className={`lp-nav ${scrolled || menu ? 'solid' : ''}`}>
        <div className="lp-wrap lp-nav-row">
          <button type="button" className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Bright Wings home">
            <img src={BrightLogo} alt="" />
            <span><b>Bright Wings</b><small>TRAVEL &amp; TOURISM</small></span>
          </button>
          <nav className="lp-links" aria-label="Sections">{NAV.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)}>{label}</button>)}</nav>
          <div className="lp-nav-cta">
            {currentUser ? (
              <button type="button" className="lp-btn gold sm" onClick={() => navigate(portalPath)}>Open my portal <ArrowRight size={16} /></button>
            ) : (
              <>
                <button type="button" className="lp-btn line sm lp-hide-sm" onClick={() => navigate('/auth')}>Sign in</button>
                <button type="button" className="lp-btn gold sm" onClick={join}>Join free</button>
              </>
            )}
            <button type="button" className="lp-burger" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {menu && (
          <div className="lp-sheet" role="dialog" aria-label="Menu">
            {NAV.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)}>{label}</button>)}
            {!currentUser && <button type="button" className="lp-sheet-signin" onClick={() => navigate('/auth')}>Sign in</button>}
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="lp-hero" style={{ backgroundImage: bg(IMG.coast) }}>
        <div className="lp-hero-shade" />
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow"><Sparkles size={14} /> Bright Wings loyalty portal</span>
            <h1>Your next journey<br />starts here.</h1>
            <p>Request trips from a dedicated travel advisor, earn Wings on every journey and turn them into stays, flights and experiences.</p>
            <div className="lp-cta-row">
              {currentUser ? (
                <button type="button" className="lp-btn gold" onClick={() => navigate(portalPath)}>Open my portal <ArrowRight size={18} /></button>
              ) : (
                <>
                  <button type="button" className="lp-btn gold" onClick={join}>Join Bright Wings <ArrowRight size={18} /></button>
                  <button type="button" className="lp-btn glass" onClick={() => navigate('/auth')}>Sign in</button>
                </>
              )}
            </div>
            <ul className="lp-trust">
              <li><BadgeCheck size={16} /> Free to join</li>
              <li><ShieldCheck size={16} /> No payment in the portal</li>
              <li><HeartHandshake size={16} /> Advisor-led quotations</li>
            </ul>
          </div>

          <div className="lp-preview" aria-hidden="true">
            <div className="lp-phone">
              <div className="pt-wallet" style={{ borderRadius: 18 }}>
                <div className="pt-row between top"><div><div className="label">Your Wings</div><div className="big" style={{ fontSize: 34 }}>1,250 <span style={{ fontSize: 18 }}>Wings</span></div></div><span className="pt-tier-pill" style={{ cursor: 'default' }}><TierIcon tier="Gold" size={15} /> Gold</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', margin: '14px 0 6px' }} className="pt-row between"><span>Lifetime Wings</span><span>3,150 to Platinum</span></div>
                <div className="pt-progress on-dark"><span style={{ width: '37%' }} /></div>
              </div>
              <div className="lp-mini">
                <span className="lp-mini-ic"><FlightIcon size={18} /></span>
                <div><strong>Jaipur → Goa</strong><small>10 Nov · 2 travellers</small></div>
                <span className="pt-badge amber dot">Quote ready</span>
              </div>
              <div className="lp-mini">
                <span className="lp-mini-ic gold"><Gift size={18} /></span>
                <div><strong>Hotel credit ready</strong><small>Voucher issued</small></div>
                <span className="pt-badge green">+300 Wings</span>
              </div>
            </div>
            <span className="lp-preview-tag">Illustrative preview</span>
          </div>
        </div>
        <a className="lp-scroll" href="#how" onClick={(e) => { e.preventDefault(); go('how'); }} aria-label="Scroll to how it works"><ChevronDown size={22} /></a>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section id="how" className="lp-section">
        <div className="lp-wrap">
          <header className="lp-head"><span className="lp-kicker">How it works</span><h2>Three steps from idea to itinerary</h2><p>No forms to print, no payment links to chase. Just a clear path from your first message to your trip.</p></header>
          <ol className="lp-steps">
            {STEPS.map(([Icon, title, copy], i) => (
              <li key={title} className="lp-step">
                <span className="lp-step-no">{i + 1}</span>
                <span className="lp-step-ic"><Icon size={26} strokeWidth={1.6} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- services */}
      <section id="services" className="lp-section lp-tint">
        <div className="lp-wrap">
          <header className="lp-head"><span className="lp-kicker">Services</span><h2>Everything for the trip, from one request</h2><p>Ten services, one advisor, one place to track it all.</p></header>
          <div className="lp-services">
            {SERVICE_ORDER.map((type) => {
              const s = SERVICES[type];
              const pts = earn(type);
              return (
                <button type="button" key={type} className="lp-service" onClick={join}>
                  <span className="lp-service-ic" style={{ background: `linear-gradient(135deg, ${s.tone[0]}, ${s.tone[1]})` }}><s.Icon size={24} strokeWidth={1.7} /></span>
                  <strong>{s.label}</strong>
                  {pts != null ? <span className="lp-earn"><WingsIcon size={14} /> Earn {fmtNum(pts)} Wings</span> : <span className="lp-earn muted">Earns Wings</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- wings */}
      <section id="wings" className="lp-section lp-dark">
        <div className="lp-wrap lp-wings">
          <div>
            <span className="lp-kicker gold">The Wings program</span>
            <h2>Wings that take you further</h2>
            <p className="lp-lead">Earn Wings on every completed trip, climb the tiers and redeem for what you will actually use.</p>
            <ul className="lp-checks">
              <li><i><WingsIcon size={14} /></i> {welcome ? <><b>{fmtNum(welcome)} welcome Wings</b> the moment you join</> : <><b>Welcome Wings</b> the moment you join</>}</li>
              <li><i><WingsIcon size={14} /></i> {program?.first_booking ? <><b>{fmtNum(program.first_booking)} bonus Wings</b> on your first completed trip</> : <><b>A bonus</b> on your first completed trip</>}</li>
              <li><i><WingsIcon size={14} /></i> {program?.referral_booking ? <><b>{fmtNum(program.referral_booking)} Wings</b> for every friend you refer who travels</> : <><b>Wings</b> for every friend you refer who travels</>}</li>
              <li><i><WingsIcon size={14} /></i> Your tier never drops when you redeem</li>
            </ul>
            <div className="lp-cta-row"><button type="button" className="lp-btn gold" onClick={join}>Start earning <ArrowRight size={18} /></button></div>
          </div>
          <div className="lp-tiers">
            {TIERS.map(([name, threshold]) => (
              <div key={name} className="lp-tier">
                <span className="lp-tier-ic"><TierIcon tier={name} size={22} /></span>
                <div><strong>{name}</strong><small>{threshold ? `${fmtNum(threshold)} lifetime Wings` : 'On joining'}</small></div>
                <span className="lp-tier-benefit">{(TIER_BENEFITS[name] || [])[1] || (TIER_BENEFITS[name] || [])[0]}</span>
              </div>
            ))}
            <p className="lp-fine">Tier benefits are illustrative; final terms follow the program policy.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- destinations */}
      <section id="destinations" className="lp-section">
        <div className="lp-wrap">
          <header className="lp-head"><span className="lp-kicker">Inspiration</span><h2>Where to next?</h2><p>A few ideas to start the conversation. Tell your advisor what you have in mind and they will shape the rest.</p></header>
          <div className="lp-dests">
            {DESTINATIONS.map(([name, copy, art]) => (
              <button type="button" key={name} className="lp-dest" style={{ backgroundImage: art }} onClick={join}>
                <span><strong>{name}</strong><small>{copy}</small></span>
                <i><ArrowRight size={16} /></i>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ why */}
      <section className="lp-section lp-tint">
        <div className="lp-wrap">
          <header className="lp-head"><span className="lp-kicker">Why members stay</span><h2>Travel planning, without the guesswork</h2></header>
          <div className="lp-why">
            {WHY.map(([Icon, title, copy]) => (
              <article key={title}><span className="lp-step-ic"><Icon size={24} strokeWidth={1.6} /></span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ faq */}
      <section id="faq" className="lp-section">
        <div className="lp-wrap lp-narrow">
          <header className="lp-head"><span className="lp-kicker">Questions</span><h2>Good to know</h2></header>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ cta */}
      <section className="lp-final" style={{ backgroundImage: IMG.palace }}>
        <div className="lp-final-shade" />
        <div className="lp-wrap lp-final-in">
          <h2>More journeys. Greater rewards.</h2>
          <p>{welcome ? `Join free and start with ${fmtNum(welcome)} welcome Wings.` : 'Join free and start with welcome Wings.'}</p>
          <div className="lp-cta-row" style={{ justifyContent: 'center' }}>
            {currentUser ? <button type="button" className="lp-btn gold" onClick={() => navigate(portalPath)}>Open my portal <ArrowRight size={18} /></button> : (
              <>
                <button type="button" className="lp-btn gold" onClick={join}>Join Bright Wings <ArrowRight size={18} /></button>
                <button type="button" className="lp-btn glass" onClick={() => navigate('/auth')}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- footer */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-foot-grid">
          <div>
            <div className="lp-brand static"><img src={BrightLogo} alt="" /><span><b>Bright Wings</b><small>TRAVEL &amp; TOURISM</small></span></div>
            <p>Advisor-led travel with a rewards program that rewards you for travelling.</p>
          </div>
          <div>
            <h4>Explore</h4>
            {NAV.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)}>{label}</button>)}
          </div>
          <div>
            <h4>Members</h4>
            <Link to="/auth">Sign in</Link>
            <Link to="/auth?mode=register">Join free</Link>
            <Link to="/auth?mode=forgot">Forgot PIN</Link>
          </div>
          <div>
            <h4>Help</h4>
            <button type="button" onClick={() => setTerms(true)}>Terms &amp; conditions</button>
            {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
            {CONTACT_PHONE && <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a>}
            {!CONTACT_EMAIL && !CONTACT_PHONE && <span>Ask your travel advisor, or use Help &amp; support after signing in.</span>}
          </div>
        </div>
        <div className="lp-wrap lp-copy">© {new Date().getFullYear()} Bright Wings Travel &amp; Tourism. All rights reserved.</div>
      </footer>
      <TermsModal open={terms} onClose={() => setTerms(false)} />
    </div>
  );
}
