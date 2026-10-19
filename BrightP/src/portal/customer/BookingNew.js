import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Calendar, CircleCheck, Copy, FileText, Gift, Info, MapPin, ArrowLeftRight, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import {
  AppBar, Card, Check2, Counter, Field, Hero, IMG, Input, MultiChips, Notice, Page, Segmented, Select, Shell, Spinner,
  BookingThanks, TextArea, bg, fmtDate, fmtDateTime, fmtNum, memberName, useAsync, useCopy, useWide, WingsIcon, ErrorState,
} from '../ui';
import { CITIES, SERVICE_ORDER, SERVICES } from '../booking';
import { clearDraft, RecoverableError, saveDraft } from './Bookings';
import { ServiceArt } from './parts';

const today = () => new Date().toISOString().slice(0, 10);

/* ----------------------------------------------------------- service picker */

export function ServiceSelect() {
  const navigate = useNavigate();
  const wide = useWide();
  const { userData } = useAuth();
  const { data: config } = useAsync(() => api.get('/rewards/points-config'), []);
  const earn = (type) => (config?.services || []).find((s) => s.booking_type === type)?.points;
  const first = memberName(userData).split(' ')[0];

  return (
    <Shell active="bookings" topbar={wide}>
      {!wide && (
        <div style={{ padding: '14px 16px 0' }}>
          <div className="pt-row between">
            <div><h2 className="pt-h2" style={{ fontSize: 17 }}>Hello, {first}</h2><p className="pt-small">Plan your next journey</p></div>
            <button type="button" className="pt-wings-pill" onClick={() => navigate('/rewards')}><WingsIcon size={16} /> {fmtNum(userData?.tokens)} Wings</button>
          </div>
        </div>
      )}
      <Page wide={wide}>
        <div style={{ margin: '18px 0 14px' }}>
          <h1 className="pt-h1">What are you planning?</h1>
          <p className="pt-sub" style={{ marginTop: 6 }}>Choose a service to request a quote from our travel advisors.</p>
        </div>
        <div className="pt-grid3" style={wide ? { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' } : undefined}>
          {SERVICE_ORDER.map((type) => {
            const s = SERVICES[type];
            return (
              <button type="button" key={type} className="pt-service" onClick={() => navigate(`/bookings/new/${type}`)}>
                <ServiceArt type={type} size={84} iconSize={34} radius={0} style={{ width: '100%', height: 84 }} />
                <div className="pt-service-body">
                  <strong>{s.label}</strong>
                  <div className="pt-service-earn"><WingsIcon size={14} /> Earn {earn(type) ?? '—'} Wings</div>
                </div>
              </button>
            );
          })}
        </div>
      </Page>
    </Shell>
  );
}

/* ------------------------------------------------------------ field renderer */

const flatten = (fields) => fields.flat();

export function FieldView({ def, form, set, error }) {
  const value = form[def.key];
  const label = def.label;
  const onText = (e) => set(def.key, e.target.value);
  if (def.showIf && !def.showIf(form)) return null;

  switch (def.type) {
    case 'seg':
      return (
        <Field label={def.label} error={error}>
          <Segmented options={def.options} value={value} onChange={(v) => set(def.key, v)} />
        </Field>
      );
    case 'route':
      return (
        <div style={{ position: 'relative' }}>
          <div className="pt-grid2" style={{ gap: 14 }}>
            <Field label="From" error={error?.from}><Input icon={MapPin} list="bw-cities" value={form.from || ''} onChange={(e) => set('from', e.target.value)} placeholder="Jaipur (JAI)" error={error?.from} /></Field>
            <Field label="To" error={error?.to}><Input icon={MapPin} list="bw-cities" value={form.to || ''} onChange={(e) => set('to', e.target.value)} placeholder="Goa (GOI)" error={error?.to} /></Field>
          </div>
          <button type="button" aria-label="Swap" className="pt-icon-btn" style={{ position: 'absolute', left: 'calc(50% - 19px)', top: 27, width: 38, height: 38, background: '#fff', border: '1px solid var(--pt-line-strong)' }} onClick={() => { const f = form.from; set('from', form.to); set('to', f); }}><ArrowLeftRight size={16} /></button>
          <datalist id="bw-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      );
    case 'city':
      return (
        <Field label={label} error={error}>
          <Input icon={MapPin} list="bw-cities" value={value || ''} onChange={onText} placeholder={def.placeholder} error={error} />
          <datalist id="bw-cities">{CITIES.map((c) => <option key={c} value={c.replace(/ \(.*\)/, '')} />)}</datalist>
        </Field>
      );
    case 'text':
      return <Field label={label} optional={def.optional} error={error} hint={def.hint}><Input value={value || ''} onChange={onText} placeholder={def.placeholder} error={error} /></Field>;
    case 'date':
      return <Field label={label} error={error}><Input icon={Calendar} type="date" min={today()} value={value || ''} onChange={onText} error={error} /></Field>;
    case 'datetime':
      return <Field label={label} error={error}><Input icon={Calendar} type="datetime-local" min={`${today()}T00:00`} value={value || ''} onChange={onText} error={error} /></Field>;
    case 'select':
      return (
        <Field label={label} error={error}>
          <Select value={value ?? ''} onChange={(e) => set(def.key, def.num ? Number(e.target.value) : e.target.value)} error={error}>
            {def.options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
          </Select>
        </Field>
      );
    case 'counter':
      return <Field label={label} error={error}><Counter value={Number(value) || def.min || 0} onChange={(v) => set(def.key, v)} min={def.min} max={def.max} suffix={def.suffix ? def.suffix(Number(value) || def.min || 0) : ''} /></Field>;
    case 'check':
      return <Check2 checked={!!value} onChange={(v) => set(def.key, v)}><strong style={{ color: 'var(--pt-navy)', display: 'block' }}>{def.label}</strong><span className="pt-small">{def.hint}</span></Check2>;
    case 'multi': {
      const list = Array.isArray(value) ? value : String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
      return <Field label={label} optional={def.optional}><MultiChips options={def.options} value={list} onChange={(v) => set(def.key, def.join ? v.join(', ') : v)} /></Field>;
    }
    case 'cards':
      return (
        <Field label={label}>
          <div className="pt-grid3" style={{ gap: 8 }}>
            {def.options.map(([v, desc]) => (
              <button type="button" key={v} onClick={() => set(def.key, v)} className="pt-item" style={{ display: 'grid', gap: 6, alignContent: 'start', padding: 10, borderColor: value === v ? 'var(--pt-gold)' : undefined, background: value === v ? 'var(--pt-gold-soft)' : '#fff' }}>
                <span className="pt-row" style={{ gap: 6 }}><span style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--pt-navy)', display: 'grid', placeItems: 'center', background: value === v ? 'var(--pt-navy)' : '#fff', color: '#fff' }}>{value === v && <Check size={11} strokeWidth={3} />}</span><strong style={{ fontSize: 12, color: 'var(--pt-navy)' }}>{v}</strong></span>
                <span className="pt-tiny" style={{ lineHeight: 1.35 }}>{desc}</span>
              </button>
            ))}
          </div>
        </Field>
      );
    case 'textarea':
      return <Field label={label} optional={def.optional} error={error}><TextArea value={value || ''} onChange={onText} max={def.max} placeholder={def.placeholder} error={error} /></Field>;
    default:
      return null;
  }
}

export const initialForm = (svc, query, prefs) => {
  const form = {};
  flatten(svc.fields).forEach((f) => { if (f.def !== undefined) form[f.key] = f.def; });
  query.forEach((value, key) => { form[key] = value; });
  if (svc.fields.some((f) => f.type === 'route') && prefs?.departure_city && !form.from) form.from = prefs.departure_city;
  return form;
};

export const validateTrip = (svc, form) => {
  const errors = {};
  flatten(svc.fields).forEach((f) => {
    if (f.showIf && !f.showIf(form)) return;
    if (f.type === 'route') {
      if (!form.from?.trim()) errors.route = { ...(errors.route || {}), from: 'Enter where you are leaving from' };
      if (!form.to?.trim()) errors.route = { ...(errors.route || {}), to: 'Enter your destination' };
      if (form.from && form.to && form.from.trim().toLowerCase() === form.to.trim().toLowerCase()) errors.route = { ...(errors.route || {}), to: 'Destination must differ from the origin' };
      return;
    }
    if (f.required && !String(form[f.key] ?? '').trim()) errors[f.key] = 'This field is required';
  });
  const before = (a, b) => a && b && new Date(a) > new Date(b);
  const past = (a) => a && String(a).slice(0, 10) < today();
  const pairs = [['departureDate', 'returnDate', 'Return must be on or after departure'], ['checkIn', 'checkOut', 'Check-out must be after check-in'], ['startDate', 'endDate', 'End date must be on or after the start'], ['pickupAt', 'dropoffAt', 'Drop-off must be after pickup']];
  pairs.forEach(([a, b, msg]) => { if (!errors[b] && form[b] && before(form[a], form[b]) && (a !== 'checkIn' || true)) errors[b] = msg; });
  if (form.checkIn && form.checkOut && form.checkIn === form.checkOut && !errors.checkOut) errors.checkOut = 'Check-out must be after check-in';
  ['departureDate', 'checkIn', 'startDate', 'pickupAt', 'visitDate', 'travelDate'].forEach((k) => { if (!errors[k] && past(form[k])) errors[k] = 'Choose a date that has not passed'; });
  return errors;
};

/* -------------------------------------------------------------------- wizard */

export function BookingWizard() {
  const { service } = useParams();
  const svc = SERVICES[service];
  const navigate = useNavigate();
  const wide = useWide();
  const [query] = useSearchParams();
  const { userData } = useAuth();
  const { submitBooking } = useBooking();
  const { data: prefs } = useAsync(() => api.get('/preferences/me').catch(() => null), []);
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);

  const [form, setForm] = useState(() => (svc ? initialForm(svc, query, null) : {}));
  const [errors, setErrors] = useState({});
  const [special, setSpecial] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (prefs?.departure_city && svc?.fields.some((f) => f.type === 'route')) setForm((f) => (f.from ? f : { ...f, from: prefs.departure_city }));
  }, [prefs, svc]);

  const hasOwnNotes = !!svc?.fields.flat().some((f) => f.key === 'specialRequests' || f.key === 'preferences');
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, route: key === 'from' || key === 'to' ? undefined : e.route })); };

  if (!svc) return <Shell active="bookings"><Page><ErrorState title="We couldn’t find that service" onRetry={() => navigate('/bookings/new')}>Please choose a service to continue.</ErrorState></Page></Shell>;

  const earnPoints = (config?.services || []).find((s) => s.booking_type === service)?.points;
  const goHome = () => navigate('/dashboard', { replace: true });

  const payload = () => ({
    type: service,
    specialRequests: (hasOwnNotes ? form.specialRequests || form.preferences : special) || undefined,
    ...form,
    // The lead traveller is the member's own profile; the advisor collects everything else afterwards.
    travelerDetails: {
      lead: { name: memberName(userData), dob: null, phone: userData?.phone || '', email: userData?.email || null },
      additional: [],
    },
    ...(special && hasOwnNotes ? { travelNotes: special } : {}),
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
      if (err?.status >= 400 && err.status < 500 && err.status !== 401 && !err.network) { toast.error(err.message || 'Please check your details and try again'); return; }
      const ref = `BW${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      saveDraft({ ref, service, summary: `${svc.title_of(form)}${svc.date_of(form) ? ` · ${fmtDate(svc.date_of(form))}` : ''}`, form });
      setFailed({ ref, summary: `Travel date: ${fmtDate(svc.date_of(form))} · ${svc.title_of(form)}` });
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    const e = validateTrip(svc, form);
    setErrors(e);
    if (Object.keys(e).some((k) => e[k])) { toast.error('Please complete the highlighted details'); return; }
    submit();
  };

  if (failed) {
    return (
      <Shell active="bookings" topbar={wide}>
        {!wide && <div style={{ padding: '0 16px' }}><AppBar title="My bookings" onBack={() => setFailed(null)} /></div>}
        <Page><RecoverableError title="We couldn’t submit your request" body="We’re having a temporary issue connecting to our systems. Your details are saved on this device." draft={failed} busy={busy} onRetry={() => { setFailed(null); submit(); }} onSupport={() => navigate('/support')} /></Page>
      </Shell>
    );
  }

  return (
    <Shell active="bookings" topbar={wide}>
      <div style={{ padding: '0 16px', maxWidth: 760, margin: '0 auto' }}>
        <AppBar title={svc.title} onBack={() => navigate('/bookings/new')} right={<span className="spacer" />} />
        <p className="pt-small" style={{ margin: '-4px 0 8px' }}>{svc.blurb}</p>
      </div>

      <Page>
        <div className="pt-stack lg" style={{ marginTop: 16 }}>
          {(
            <>
              <div className="pt-banner" style={{ backgroundImage: bg(service === 'hotel' ? IMG.chairs : service === 'visa' ? IMG.palace : service === 'cruise' ? IMG.coast : IMG.coast), minHeight: 150 }}>
                <h2>{svc.heroTitle}</h2>
                <span style={{ width: 34, height: 3, background: 'var(--pt-gold)', marginTop: 8, borderRadius: 2 }} />
              </div>
              {svc.fields.map((row, i) => (
                Array.isArray(row)
                  ? <div className={`pt-grid2 ${row.some((f) => f.type === 'datetime') ? 'stack-sm' : ''}`} key={i} style={{ alignItems: 'start' }}>{row.map((f) => <FieldView key={f.key} def={f} form={form} set={set} error={errors[f.key]} />)}</div>
                  : <FieldView key={row.key} def={row} form={form} set={set} error={row.type === 'route' ? errors.route : errors[row.key]} />
              ))}
              {svc.note && <Notice icon={FileText}><strong>{svc.note[0]}</strong>{svc.note[1]}</Notice>}
              {!hasOwnNotes && <Field label="Trip notes" optional><TextArea value={special} onChange={(e) => setSpecial(e.target.value)} max={500} placeholder="Tell us if you have any special requests…" /></Field>}
              {service === 'flight' || service === 'hotel' ? <Notice icon={Info}>Request a quote. Price confirmed by your travel advisor.</Notice> : <Notice tone="gold" icon={Gift}><strong>You will earn {earnPoints ?? '—'} Wings</strong>{svc.earnLabel}</Notice>}
            </>
          )}

          <div className="pt-sticky-cta">
            <button type="button" className="pt-btn full" onClick={next} disabled={busy}>{busy ? 'Sending…' : <>Submit request <ArrowRight size={18} /></>}</button>
          </div>
        </div>
      </Page>
      <BookingThanks open={thanks} onDone={goHome} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ received */

export function BookingReceived() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { copied, copy } = useCopy();
  const { data, loading, error, reload } = useAsync(() => api.get(`/bookings/${id}`), [id]);
  const portal = useAsync(() => api.get(`/portal/bookings/${id}`).catch(() => null), [id]);

  if (loading) return <Shell active="bookings"><Page><Spinner label="Loading your request…" /></Page></Shell>;
  if (error || !data) return <Shell active="bookings"><Page><ErrorState onRetry={reload} /></Page></Shell>;
  const assigned = !!portal.data?.advisor;
  const steps = [
    ['Request received', fmtDateTime(data.created_at), 'done'],
    ['Travel advisor assignment', assigned ? `Assigned to ${portal.data.advisor.name}` : 'Pending', assigned ? 'done' : 'now'],
    ['Advisor will contact you', 'You’ll hear from us soon', ''],
    ['Trip confirmed', 'We’ll update you here', ''],
  ];

  return (
    <Shell active="bookings" topbar={false}>
      <Hero image={IMG.chairs} style={{ minHeight: 230, paddingBottom: 86 }} />
      <Page style={{ marginTop: -70, position: 'relative' }}>
        <div className="pt-stack lg" style={{ textAlign: 'center' }}>
          <div className="pt-success-mark" style={{ background: '#fff', boxShadow: '0 12px 30px rgba(16,40,63,.16)' }}><CircleCheck size={50} strokeWidth={2.4} color="#1b7a5a" /></div>
          <div><h1 className="pt-h1 serif" style={{ fontSize: 28 }}>Your booking request<br />has been received!</h1><p className="pt-sub" style={{ marginTop: 8 }}>Your travel advisor will contact you shortly with options and next steps.</p></div>
          <Card style={{ textAlign: 'center' }}>
            <div className="pt-small">Booking request ID</div>
            <div className="pt-row" style={{ justifyContent: 'center', gap: 10, marginTop: 4 }}><strong className="pt-serif" style={{ fontSize: 26, color: 'var(--pt-navy)', letterSpacing: '0.02em' }}>{data.display_code}</strong><button type="button" className="pt-icon-btn" aria-label="Copy request ID" onClick={() => copy(data.display_code, 'id')}>{copied === 'id' ? <Check size={18} /> : <Copy size={18} />}</button></div>
          </Card>
          <Card style={{ textAlign: 'left' }}>
            <div className="pt-vtl">
              {steps.map(([title, sub, state]) => (
                <div key={title} className={`pt-vtl-row ${state}`}>
                  <span className="pt-vtl-dot">{state === 'done' && <Check size={13} strokeWidth={3} />}</span>
                  <div className="pt-vtl-body"><strong>{title}</strong><span>{sub}</span></div>
                </div>
              ))}
            </div>
          </Card>
          <button type="button" className="pt-btn full" onClick={() => navigate(`/bookings/${id}`)}>View booking <ArrowRight size={18} /></button>
          <button type="button" className="pt-btn ghost full" onClick={() => navigate('/dashboard')}>Back home</button>
        </div>
      </Page>
    </Shell>
  );
}

