import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import { BookingThanks, ErrorState, Field, Page, Shell, TextArea, WingsIcon, fmtDate, fmtNum, memberName, useAsync } from '../ui';
import { SERVICE_PHOTO } from '../photos';
import { SERVICE_ORDER, SERVICES } from '../booking';
import { FieldView, initialForm, validateTrip } from '../customer/BookingNew';
import { RecoverableError, clearDraft, saveDraft } from '../customer/Bookings';
import { Crumbs } from './common';

/* ----------------------------------------------------------- service picker */

export function DeskServiceSelect() {
  const navigate = useNavigate();
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);
  const earn = (t) => (config?.services || []).find((s) => s.booking_type === t)?.points;
  const order = [...SERVICE_ORDER.filter((t) => t !== 'custom'), 'custom'];

  const Card = ({ type, wide }) => {
    const s = SERVICES[type];
    return (
      <button type="button" className={`dp-service ${wide ? 'wide' : ''}`} onClick={() => navigate(`/bookings/new/${type}`)}>
        <span className="dp-service-photo" style={{ backgroundImage: `url(${SERVICE_PHOTO[type]})` }} />
        <span className="dp-service-body">
          <span className="dp-service-title"><s.Icon size={24} strokeWidth={1.6} /> {s.label}</span>
          <span className="dp-service-desc">{s.desc}</span>
          <span className="dp-service-earn"><WingsIcon size={22} color="#c9963e" /> <span>Earn <b>{earn(type) != null ? fmtNum(earn(type)) : '—'} Wings</b> after completed booking</span></span>
        </span>
        <ArrowRight size={18} className="dp-chev" />
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
        </div>
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------------------------ stepper */

// Two steps only: once the trip details are in, the request is sent. The advisor collects
// traveller, passport and preference details afterwards.
const STEPS = [['Service', null], ['Trip details', 'Tell us your travel plans']];

function Stepper({ step, serviceLabel }) {
  return (
    <ol className="dp-stepper" aria-label="Progress" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
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

export function DeskWizard() {
  const { service } = useParams();
  const svc = SERVICES[service];
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const { userData } = useAuth();
  const { submitBooking } = useBooking();
  const { data: prefs } = useAsync(() => api.get('/preferences/me').catch(() => null), []);
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);

  const [form, setForm] = useState(() => (svc ? initialForm(svc, query, null) : {}));
  const [errors, setErrors] = useState({});
  const [notes, setNotes] = useState('');
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => { if (prefs?.departure_city && svc?.fields.some((f) => f.type === 'route')) setForm((f) => (f.from ? f : { ...f, from: prefs.departure_city })); }, [prefs, svc]);

  if (!svc) return <Shell active="bookings"><Page wide><ErrorState title="We couldn’t find that service" onRetry={() => navigate('/bookings/new')} /></Page></Shell>;

  const hasNotes = svc.fields.flat().some((f) => f.key === 'specialRequests' || f.key === 'preferences');
  const earnPoints = (config?.services || []).find((s) => s.booking_type === service)?.points;
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, route: key === 'from' || key === 'to' ? undefined : e.route })); };
  const start = svc.date_of(form);
  const goHome = () => navigate('/dashboard', { replace: true });

  const payload = () => ({
    type: service,
    specialRequests: (hasNotes ? form.specialRequests || form.preferences : notes) || undefined,
    ...form,
    // The lead traveller is the member's own profile; the advisor collects everything else afterwards.
    travelerDetails: {
      lead: { name: memberName(userData), dob: null, phone: userData?.phone || '', email: userData?.email || null },
      additional: [],
    },
    ...(notes && hasNotes ? { travelNotes: notes } : {}),
  });

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await submitBooking(payload());
      clearDraft();
      setThanks(true);
    } catch (err) {
      console.error('Booking request failed', err);
      // The server answered and refused the request (e.g. a validation message): show it on the form.
      if (err?.status >= 400 && err.status < 500 && err.status !== 401 && !err.network) { toast.error(err.message || 'Please check your details and try again'); return; }
      const ref = `BW${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      saveDraft({ ref, service, summary: svc.title_of(form), form });
      setFailed({ ref, summary: `${svc.title_of(form)}${start ? ` · ${fmtDate(start)}` : ''}` });
    } finally { setBusy(false); }
  };

  const next = () => {
    const e = validateTrip(svc, form);
    setErrors(e);
    if (Object.keys(e).some((k) => e[k])) { toast.error('Please complete the highlighted details'); return; }
    submit();
  };

  if (failed) {
    return (
      <Shell active="bookings"><Page wide><div style={{ maxWidth: 560, margin: '40px auto' }}><RecoverableError title="We couldn’t submit your request" body="We’re having a temporary issue connecting to our systems. Your details are saved on this device." draft={failed} busy={busy} onRetry={() => { setFailed(null); submit(); }} onSupport={() => navigate('/support')} /></div></Page></Shell>
    );
  }

  const earnRow = (
    <div className="dp-earn-row">
      <span className="pt-row" style={{ gap: 12 }}><WingsIcon size={28} color="#c9963e" /><span>Earn <b>{earnPoints != null ? fmtNum(earnPoints) : '—'} Wings</b> after your booking is completed. <Info size={15} style={{ verticalAlign: -3, color: 'var(--pt-faint)' }} /></span></span>
    </div>
  );

  return (
    <Shell active="bookings">
      <Page wide>
        <Crumbs trail={[['Bookings', '/bookings'], ['Plan your trip']]} />
        <h1 className="pt-title" style={{ marginTop: 6 }}>Plan your trip</h1>
        <p className="pt-lede">Tell us about your travel plans and our expert advisors will get back with the best options and a personalised quotation.</p>
        <Stepper step={2} serviceLabel={svc.label} />

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
          <div className="dp-foot">{earnRow}<button type="button" className="pt-gold-btn" onClick={next} disabled={busy}>{busy ? 'Sending…' : <>Submit request <ArrowRight size={18} /></>}</button></div>
        </div>
      </Page>
      <BookingThanks open={thanks} onDone={goHome} />
    </Shell>
  );
}
