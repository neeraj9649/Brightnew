import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, Check, ChevronDown, CircleHelp, Headset, Info, Lock, Pencil, Plus, ShieldCheck, User, X, Armchair, Luggage, Utensils, Star, Gift, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import { Check2, ErrorState, Field, Input, Page, PhoneField, Select, Shell, TextArea, WingsIcon, fmtDate, fmtNum, isValidIndianMobile, memberName, nationalNumber, useAsync } from '../ui';
import { SERVICE_PHOTO, photoFor } from '../photos';
import { SERVICE_ORDER, SERVICES } from '../booking';
import { FieldView, initialForm, validateTrip } from '../customer/BookingNew';
import { RecoverableError, clearDraft, saveDraft } from '../customer/Bookings';
import { Crumbs, fmtRange, nightsBetween } from './common';

const today = () => new Date().toISOString().slice(0, 10);

/* ----------------------------------------------------------- service picker */

export function DeskServiceSelect() {
  const navigate = useNavigate();
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);
  const [pick, setPick] = useState('flight');
  const earn = (t) => (config?.services || []).find((s) => s.booking_type === t)?.points;
  const order = [...SERVICE_ORDER.filter((t) => t !== 'custom'), 'custom'];

  const Card = ({ type, wide }) => {
    const s = SERVICES[type];
    const on = pick === type;
    return (
      <button type="button" className={`dp-service ${wide ? 'wide' : ''} ${on ? 'on' : ''}`} onClick={() => setPick(type)} onDoubleClick={() => navigate(`/bookings/new/${type}`)} aria-pressed={on}>
        <span className="dp-service-photo" style={{ backgroundImage: `url(${SERVICE_PHOTO[type]})` }} />
        <span className="dp-service-body">
          <span className="dp-service-title"><s.Icon size={24} strokeWidth={1.6} /> {s.label}</span>
          <span className="dp-service-desc">{s.desc}</span>
          <span className="dp-service-earn"><WingsIcon size={22} color="#c9963e" /> <span>Earn <b>{earn(type) != null ? fmtNum(earn(type)) : '—'} Wings</b> after completed booking</span></span>
        </span>
        {on ? <span className="dp-tick"><Check size={16} strokeWidth={3} /></span> : <ArrowRight size={18} className="dp-chev" />}
      </button>
    );
  };

  return (
    <Shell active="bookings">
      <Page wide>
        <div className="dp-pick-head">
          <div className="dp-eyebrow">NEW TRAVEL REQUEST</div>
          <h1 className="pt-title">What would you like to book?</h1>
          <p className="pt-lede" style={{ maxWidth: 'none' }}>Tell us what you need, and a Bright Wings travel advisor will provide the best options and a quote for you.</p>
        </div>
        <div className="dp-services">
          {order.filter((t) => t !== 'custom').map((t) => <Card key={t} type={t} />)}
          <Card type="custom" wide />
        </div>
        <div className="dp-pick-foot">
          <span className="pt-row" style={{ gap: 10, color: 'var(--pt-muted)', fontSize: 14 }}><Info size={17} /> Wings will be credited after completed booking.</span>
          <button type="button" className="pt-gold-btn" onClick={() => navigate(`/bookings/new/${pick}`)}>Continue <ArrowRight size={18} /></button>
        </div>
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------------------------ stepper */

const STEPS = [['Service', null], ['Trip details', 'Tell us your travel plans'], ['Travellers', 'Add traveller details'], ['Review', 'Check and submit']];

function Stepper({ step, serviceLabel }) {
  return (
    <ol className="dp-stepper" aria-label="Progress">
      {STEPS.map(([label, sub], i) => {
        const n = i + 1;
        const done = n < step;
        const now = n === step;
        return (
          <li key={label} className={`${done ? 'done' : ''} ${now ? 'now' : ''}`}>
            <span className="dp-step-dot">{done ? <Check size={18} strokeWidth={3} /> : n}</span>
            <b>{label}</b>
            <small>{i === 0 ? serviceLabel : sub}</small>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------- wizard */

const SEATS = ['Aisle (if available)', 'Window (if available)', 'No preference'];
const BAGGAGE = ['Standard checked baggage', 'Cabin baggage only', 'Extra baggage'];
const MEALS = ['No preference', 'Vegetarian meal', 'Non-vegetarian meal', 'Jain meal'];
const emptyTraveller = () => ({ name: '', dob: '', gender: '', phone: '', email: '', passport: '', nationality: 'Indian', expiry: '' });

export function DeskWizard() {
  const { service } = useParams();
  const svc = SERVICES[service];
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const { userData } = useAuth();
  const { submitBooking } = useBooking();
  const { data: prefs } = useAsync(() => api.get('/preferences/me').catch(() => null), []);
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);

  const [step, setStep] = useState(2);
  const [form, setForm] = useState(() => (svc ? initialForm(svc, query, null) : {}));
  const [errors, setErrors] = useState({});
  const [trav, setTrav] = useState(() => [{ ...emptyTraveller(), name: memberName(userData), phone: userData?.phone || '', email: userData?.email || '' }]);
  const [travErr, setTravErr] = useState({});
  const [notes, setNotes] = useState('');
  const [tp, setTp] = useState({ seat: SEATS[0], baggage: BAGGAGE[0], meal: MEALS[0] });
  const [agree, setAgree] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const sized = useRef(false);

  useEffect(() => { if (prefs?.departure_city && svc?.fields.some((f) => f.type === 'route')) setForm((f) => (f.from ? f : { ...f, from: prefs.departure_city })); }, [prefs, svc]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const people = svc ? Math.min(Math.max(Number(svc.people_of(form)) || 1, 1), 9) : 1;
  // Make the traveller blocks match the party size chosen on the trip step (once, on arrival).
  useEffect(() => {
    if (step !== 3 || sized.current) return;
    sized.current = true;
    setTrav((cur) => (cur.length >= people ? cur : [...cur, ...Array.from({ length: people - cur.length }, emptyTraveller)]));
  }, [step, people]);

  if (!svc) return <Shell active="bookings"><Page wide><ErrorState title="We couldn’t find that service" onRetry={() => navigate('/bookings/new')} /></Page></Shell>;

  const hasNotes = svc.fields.flat().some((f) => f.key === 'specialRequests' || f.key === 'preferences');
  const earnPoints = (config?.services || []).find((s) => s.booking_type === service)?.points;
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, route: key === 'from' || key === 'to' ? undefined : e.route })); };
  const setT = (i, patch) => { setTrav((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x))); setTravErr({}); };
  const isFlight = service === 'flight';
  const needsPassport = service === 'visa';
  const start = svc.date_of(form);
  const end = form.returnDate || form.checkOut || form.endDate || form.dropoffAt;
  const stayNights = nightsBetween(form.departureDate || form.checkIn || form.startDate, form.returnDate || form.checkOut || form.endDate);
  const photo = photoFor(service, form.to, form.destination, form.destinations, form.region, form.country);

  const next = () => {
    if (step === 2) {
      const e = validateTrip(svc, form);
      setErrors(e);
      if (Object.keys(e).some((k) => e[k])) { toast.error('Please complete the highlighted details'); return; }
      setStep(3);
    } else if (step === 3) {
      const e = {};
      trav.forEach((t, i) => {
        const key = (k) => `${i}.${k}`;
        if (t.name.trim().length < 2) e[key('name')] = 'Enter the name exactly as on the passport or ID';
        if (i === 0 && (!t.dob || (needsPassport && !t.dob))) e[key('dob')] = 'Date of birth is required';
        if (t.dob && t.dob > today()) e[key('dob')] = 'Date of birth cannot be in the future';
        if (i === 0 && !isValidIndianMobile(t.phone)) e[key('phone')] = 'Enter a valid 10-digit mobile number';
        if (t.email && !/^\S+@\S+\.\S+$/.test(t.email.trim())) e[key('email')] = 'Enter a valid e-mail address';
        if (needsPassport && !t.passport.trim()) e[key('passport')] = 'Passport number is required for visa requests';
        if (t.expiry && t.expiry < today()) e[key('expiry')] = 'This passport has expired';
      });
      setTravErr(e);
      if (Object.keys(e).length) { toast.error('Please complete the highlighted details'); return; }
      setStep(4);
    }
  };

  const payload = () => ({
    type: service,
    specialRequests: (hasNotes ? form.specialRequests || form.preferences : notes) || undefined,
    ...form,
    ...(isFlight ? { travelPrefs: tp } : {}),
    travelerDetails: {
      lead: { name: trav[0].name.trim(), dob: trav[0].dob || null, phone: nationalNumber(trav[0].phone), email: trav[0].email.trim() || null, gender: trav[0].gender || null, passport: trav[0].passport.trim() || null, nationality: trav[0].nationality || null, passportExpiry: trav[0].expiry || null },
      additional: trav.slice(1).map((t) => ({ name: t.name.trim(), dob: t.dob || null, gender: t.gender || null, passport: t.passport.trim() || null, nationality: t.nationality || null, passportExpiry: t.expiry || null })).filter((t) => t.name),
    },
    ...(notes && hasNotes ? { travelNotes: notes } : {}),
  });

  const submit = async () => {
    setBusy(true);
    try {
      const created = await submitBooking(payload());
      clearDraft();
      navigate(`/bookings/${created.docId}/received`, { replace: true });
    } catch {
      const ref = `BW${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      saveDraft({ ref, service, summary: svc.title_of(form), form });
      setFailed({ ref, summary: `${svc.title_of(form)}${start ? ` · ${fmtDate(start)}` : ''}` });
    } finally { setBusy(false); }
  };

  if (failed) {
    return (
      <Shell active="bookings"><Page wide><div style={{ maxWidth: 560, margin: '40px auto' }}><RecoverableError title="We couldn’t submit your request" body="We’re having a temporary issue connecting to our systems. Your details are saved on this device." draft={failed} busy={busy} onRetry={() => { setFailed(null); submit(); }} onSupport={() => navigate('/support')} /></div></Page></Shell>
    );
  }

  const heading = step === 4 ? 'Review your travel request' : step === 3 ? 'Plan your trip' : 'Plan your trip';
  const lede = step === 4 ? 'Please review your details before submitting. This will be sent to our travel advisors for a personalised quotation.'
    : step === 3 ? 'Add traveller details for your booking'
      : 'Tell us about your travel plans and our expert advisors will get back with the best options and a personalised quotation.';

  const earnRow = (
    <div className="dp-earn-row">
      <span className="pt-row" style={{ gap: 12 }}><WingsIcon size={28} color="#c9963e" /><span>Earn <b>{earnPoints != null ? fmtNum(earnPoints) : '—'} Wings</b> after your booking is completed. <Info size={15} style={{ verticalAlign: -3, color: 'var(--pt-faint)' }} /></span></span>
    </div>
  );

  return (
    <Shell active="bookings">
      <Page wide>
        {step === 4 ? <button type="button" className="pt-back" style={{ marginTop: 26 }} onClick={() => navigate('/bookings')}><ArrowLeft size={17} /> Back to Bookings</button> : <Crumbs trail={[['Bookings', '/bookings'], ['Plan your trip']]} />}
        <h1 className="pt-title" style={{ marginTop: step === 4 ? 14 : 6 }}>{heading}</h1>
        <p className="pt-lede">{lede}</p>
        <Stepper step={step} serviceLabel={svc.label} />

        {step === 2 && (
          <div className="pt-card dp-panel">
            <div className="dp-panel-head">
              <span className="dp-svc-ic"><svc.Icon size={30} strokeWidth={1.6} /></span>
              <div><h2>{svc.label}</h2><p>{svc.desc}</p></div>
              <div className="dp-change">
                <button type="button" onClick={() => setMenu(!menu)} aria-expanded={menu}>Change service <ChevronDown size={16} /></button>
                {menu && <div className="dp-change-menu">{SERVICE_ORDER.map((t) => <button type="button" key={t} className={t === service ? 'on' : ''} onClick={() => { setMenu(false); if (t !== service) navigate(`/bookings/new/${t}`); }}>{React.createElement(SERVICES[t].Icon, { size: 18 })} {SERVICES[t].label}</button>)}</div>}
              </div>
            </div>
            <div className="dp-fields">
              {svc.fields.map((row, i) => (
                Array.isArray(row)
                  ? <div className="dp-grid2" key={i}>{row.map((f) => <FieldView key={f.key} def={f} form={form} set={set} error={errors[f.key]} />)}</div>
                  : <FieldView key={row.key} def={row} form={form} set={set} error={row.type === 'route' ? errors.route : errors[row.key]} />
              ))}
              {!hasNotes && <Field label="Trip notes" optional><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} max={500} placeholder="Prefer morning departure and flexible on return time." /></Field>}
            </div>
            <div className="pt-notice" style={{ marginTop: 20 }}><Info size={20} /><div>This is a travel request. Our travel advisors will review your requirements and get back to you with a personalised quotation, including options, fares and advice. No payment is required at this stage.</div></div>
            <div className="dp-foot">{earnRow}<button type="button" className="pt-gold-btn" onClick={next}>Continue <ArrowRight size={18} /></button></div>
          </div>
        )}

        {step === 3 && (
          <div className="dp-two">
            <div className="pt-stack lg" style={{ minWidth: 0 }}>
              <div className="pt-card dp-panel">
                <div className="pt-row between top" style={{ gap: 16 }}>
                  <div><h2 className="pt-serif-h" style={{ fontSize: 28 }}>Traveller details</h2><p className="pt-sub" style={{ marginTop: 6, fontSize: 15 }}>Enter details as per {needsPassport || isFlight ? 'passport for international travel' : 'ID'}.</p></div>
                  <div className="dp-secure"><Lock size={16} /> Your information is securely handled<small>We use industry-standard encryption to protect your data.</small></div>
                </div>
                <div className="pt-stack lg" style={{ marginTop: 18 }}>
                  {trav.map((t, i) => {
                    const err = (k) => travErr[`${i}.${k}`];
                    return (
                      <section key={i} className="dp-trav">
                        <div className="pt-row between"><h3>Traveller {i + 1} <small>{i === 0 ? 'Adult (18+ years) · Lead traveller' : 'Traveller'}</small></h3>{i > 0 && <button type="button" className="pt-icon-btn" aria-label={`Remove traveller ${i + 1}`} onClick={() => setTrav(trav.filter((_, j) => j !== i))}><X size={18} /></button>}</div>
                        <div className="dp-grid3">
                          <Field label="Full name (as per passport)" error={err('name')}><Input value={t.name} onChange={(e) => setT(i, { name: e.target.value })} error={err('name')} autoComplete="name" /></Field>
                          <Field label={`Date of birth${i === 0 ? ' *' : ''}`} error={err('dob')}><Input icon={Calendar} type="date" max={today()} value={t.dob} onChange={(e) => setT(i, { dob: e.target.value })} error={err('dob')} /></Field>
                          <Field label="Gender" optional><Select value={t.gender} onChange={(e) => setT(i, { gender: e.target.value })}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select></Field>
                        </div>
                        {i === 0 && (
                          <div className="dp-grid2" style={{ marginTop: 14 }}>
                            <Field label="Phone number *" error={err('phone')}><PhoneField value={nationalNumber(t.phone)} onChange={(v) => setT(i, { phone: v })} error={err('phone')} /></Field>
                            <Field label="Email address" optional error={err('email')}><Input type="email" value={t.email} onChange={(e) => setT(i, { email: e.target.value })} error={err('email')} /></Field>
                          </div>
                        )}
                        <div className="dp-passport"><h4>Passport details <small>{needsPassport ? 'Required for visa applications' : 'Required for international travel'}</small><span className="dp-stored"><Lock size={13} /> Stored securely</span></h4>
                          <div className="dp-grid3">
                            <Field label={`Passport number${needsPassport ? ' *' : ''}`} error={err('passport')}><Input value={t.passport} onChange={(e) => setT(i, { passport: e.target.value.toUpperCase() })} error={err('passport')} autoComplete="off" /></Field>
                            <Field label="Nationality"><Select value={t.nationality} onChange={(e) => setT(i, { nationality: e.target.value })}>{['Indian', 'American', 'British', 'Canadian', 'Australian', 'Singaporean', 'Other'].map((n) => <option key={n}>{n}</option>)}</Select></Field>
                            <Field label="Date of expiry" error={err('expiry')}><Input icon={Calendar} type="date" min={today()} value={t.expiry} onChange={(e) => setT(i, { expiry: e.target.value })} error={err('expiry')} /></Field>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                  {trav.length < 9 && <button type="button" className="dp-add" onClick={() => setTrav([...trav, emptyTraveller()])}><Plus size={22} /><span><b>Add another traveller</b><small>Add family or friends to this booking</small></span></button>}
                </div>
                {isFlight && (
                  <div className="dp-passport" style={{ marginTop: 22 }}>
                    <h4>Travel preferences <small>Optional — your advisor will try to accommodate these</small></h4>
                    <div className="dp-grid3">
                      <Field label="Seat preference"><Select value={tp.seat} onChange={(e) => setTp({ ...tp, seat: e.target.value })}>{SEATS.map((o) => <option key={o}>{o}</option>)}</Select></Field>
                      <Field label="Baggage preference"><Select value={tp.baggage} onChange={(e) => setTp({ ...tp, baggage: e.target.value })}>{BAGGAGE.map((o) => <option key={o}>{o}</option>)}</Select></Field>
                      <Field label="In-flight preferences"><Select value={tp.meal} onChange={(e) => setTp({ ...tp, meal: e.target.value })}>{MEALS.map((o) => <option key={o}>{o}</option>)}</Select></Field>
                    </div>
                  </div>
                )}
                <div className="dp-foot between"><button type="button" className="pt-navy-btn ghost" onClick={() => setStep(2)}><ArrowLeft size={17} /> Back</button><button type="button" className="pt-gold-btn" onClick={next}>Continue <ArrowRight size={18} /></button></div>
              </div>
            </div>
            <aside className="pt-stack lg" style={{ minWidth: 0 }}>
              <SummaryCard svc={svc} service={service} form={form} photo={photo} start={start} end={end} onEdit={() => setStep(2)} />
              <HelpCard />
              <div className="pt-notice gold" style={{ alignItems: 'center' }}><ShieldCheck size={24} /><div><strong>Your privacy matters</strong>Traveller details are used only for this booking and handled securely in line with our Terms &amp; Conditions.</div></div>
            </aside>
          </div>
        )}

        {step === 4 && (
          <div className="dp-two review">
            <div className="pt-stack lg" style={{ minWidth: 0 }}>
              <div className="pt-card dp-panel">
                <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 26 }}>Trip details</h2><button type="button" className="dp-edit" onClick={() => setStep(2)}><Pencil size={14} /> Edit trip details</button></div>
                <div className="dp-review-trip">
                  <div>
                    {svc.summary(form).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                      <div className="dp-rrow" key={k}><span><svc.Icon size={20} /> {k}</span><div><b>{String(v)}</b>{k === 'Departure' && stayNights ? <small>{stayNights} nights · {form.tripType === 'oneway' ? 'One way' : 'Round trip'}</small> : null}</div></div>
                    ))}
                  </div>
                  <div className="dp-review-photo" style={{ backgroundImage: `url(${photo})` }} />
                </div>
              </div>
              <div className="pt-card dp-panel">
                <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 26 }}>Traveller details</h2><button type="button" className="dp-edit" onClick={() => setStep(3)}><Pencil size={14} /> Edit traveller details</button></div>
                {trav.filter((t) => t.name).map((t, i) => (
                  <div className="dp-rrow" key={i}><span><User size={20} /> {i === 0 ? 'Adult travellers' : `Traveller ${i + 1}`}</span><div><b>{i === 0 ? `${trav.filter((x) => x.name).length} adult${trav.filter((x) => x.name).length === 1 ? '' : 's'}` : t.name}</b><small>{i === 0 ? `Primary traveller: ${t.name}` : t.dob ? fmtDate(t.dob) : ''}</small></div></div>
                ))}
              </div>
              {(isFlight || notes || form.specialRequests) && (
                <div className="pt-card dp-panel">
                  <div className="pt-row between"><h2 className="pt-serif-h" style={{ fontSize: 26 }}>Travel preferences</h2><button type="button" className="dp-edit" onClick={() => setStep(isFlight ? 3 : 2)}><Pencil size={14} /> Edit preferences</button></div>
                  {isFlight && <>
                    <div className="dp-rrow"><span><Armchair size={20} /> Seat preference</span><div><b>{tp.seat}</b></div></div>
                    <div className="dp-rrow"><span><Luggage size={20} /> Baggage preference</span><div><b>{tp.baggage}</b></div></div>
                    <div className="dp-rrow"><span><Utensils size={20} /> In-flight preferences</span><div><b>{tp.meal}</b></div></div>
                  </>}
                  <div className="dp-rrow"><span><Star size={20} /> Additional notes</span><div><b style={{ fontWeight: 500 }}>{[notes, form.specialRequests, form.preferences].filter(Boolean).join(' · ') || 'None added'}</b></div></div>
                </div>
              )}
            </div>
            <aside className="pt-stack lg" style={{ minWidth: 0 }}>
              <div className="dp-quote-box">
                <div className="pt-row" style={{ gap: 14, alignItems: 'flex-start' }}><Info size={26} style={{ color: '#c9963e', flex: 'none' }} /><div><h3>Submit a request for an advisor quotation</h3><p>You are submitting a travel request to our advisors. We will review your requirements and get back to you with a personalised quotation and options.</p></div></div>
                <ul>{['No payment is taken at this stage', 'Our travel advisors will get in touch with options and a quotation', 'You can request changes after receiving the quotation'].map((t) => <li key={t}><span><Check size={14} strokeWidth={3} /></span>{t}</li>)}</ul>
              </div>
              <div className="pt-notice" style={{ alignItems: 'center', background: '#e3effa' }}><Headset size={30} /><div><strong>Expected response time</strong>Our travel advisors usually respond within 1 business day, often sooner.</div></div>
              <div className="pt-notice green" style={{ alignItems: 'center' }}><Gift size={30} /><div><strong>Earn {earnPoints != null ? fmtNum(earnPoints) : '—'} Wings after booking is completed</strong>You will earn {earnPoints != null ? fmtNum(earnPoints) : 'Wings'} after your booking is confirmed and completed.</div></div>
              <div className="pt-card" style={{ padding: 20 }}>
                <Check2 checked={agree} onChange={setAgree}>I confirm that the information provided is accurate to the best of my knowledge and I agree to submit this travel request to Bright Wings.</Check2>
                <button type="button" className="pt-gold-btn full" style={{ marginTop: 18 }} disabled={!agree || busy} onClick={submit}>{busy ? 'Submitting…' : <>Submit travel request <ArrowRight size={18} /></>}</button>
                <button type="button" className="pt-back" style={{ margin: '16px auto 0', display: 'flex' }} onClick={() => setStep(3)}><ArrowLeft size={16} /> Back</button>
              </div>
            </aside>
          </div>
        )}
      </Page>
    </Shell>
  );
}

function SummaryCard({ svc, service, form, photo, start, end, onEdit }) {
  const title = svc.title_of(form);
  return (
    <div className="pt-card" style={{ padding: 20 }}>
      <div className="pt-row between"><h3 className="pt-serif-h" style={{ fontSize: 20 }}>Your selected {svc.label.toLowerCase()}</h3><button type="button" className="dp-edit" onClick={onEdit}><Pencil size={13} /> Edit</button></div>
      {service === 'flight' ? (
        <div className="dp-route"><div><b>{(form.from || '').replace(/ \(.*/, '') || '—'}</b><small>{(form.from || '').match(/\((\w+)\)/)?.[1]}</small></div><span /><div style={{ textAlign: 'right' }}><b>{(form.to || '').replace(/ \(.*/, '') || '—'}</b><small>{(form.to || '').match(/\((\w+)\)/)?.[1]}</small></div></div>
      ) : <div style={{ marginTop: 12 }}><b className="pt-serif" style={{ fontSize: 22, color: 'var(--pt-navy)' }}>{title}</b></div>}
      <div className="pt-row between pt-small" style={{ margin: '10px 0 14px' }}><span>{start ? fmtRange(start, end) : ''}</span><span className="pt-row" style={{ gap: 6 }}><Users size={15} /> {svc.people_of(form) || 1} traveller{Number(svc.people_of(form)) === 1 ? '' : 's'}</span></div>
      <div className="dp-sumphoto" style={{ backgroundImage: `url(${photo})` }} />
    </div>
  );
}

function HelpCard() {
  const navigate = useNavigate();
  return (
    <div className="pt-card" style={{ padding: 20 }}>
      <h3 className="pt-serif-h" style={{ fontSize: 20 }}>Need help with your booking?</h3>
      <p className="pt-sub" style={{ margin: '6px 0 14px' }}>Our travel experts are here for you.</p>
      <button type="button" className="pt-navy-btn ghost full" onClick={() => navigate('/support')}><CircleHelp size={18} /> Contact support</button>
    </div>
  );
}

