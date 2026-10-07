import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Calendar, ChevronDown, ChevronUp, CircleCheck, Copy, FileText, Gift, Info, Lock, MapPin, Pencil, User, Users, ArrowLeftRight, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { api } from '../../services/api';
import {
  AppBar, Card, Check2, Counter, Field, Hero, IMG, Input, isValidIndianMobile, MultiChips, Notice, Page, PhoneField, Segmented, Select, Shell, Spinner,
  TextArea, bg, fmtDate, fmtDateTime, fmtNum, memberName, nationalNumber, useAsync, useCopy, useWide, WingsIcon, ErrorState,
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
  const { submitBooking, bookings } = useBooking();
  const { data: prefs } = useAsync(() => api.get('/preferences/me').catch(() => null), []);
  const { data: config } = useAsync(() => api.get('/rewards/points-config').catch(() => null), []);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => (svc ? initialForm(svc, query, null) : {}));
  const [errors, setErrors] = useState({});
  const [lead, setLead] = useState({ name: memberName(userData), dob: '', phone: userData?.phone || '' });
  const [others, setOthers] = useState([]);
  const [othersOpen, setOthersOpen] = useState(true);
  const [special, setSpecial] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    if (prefs?.departure_city && svc?.fields.some((f) => f.type === 'route')) setForm((f) => (f.from ? f : { ...f, from: prefs.departure_city }));
  }, [prefs, svc]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const people = svc ? Number(svc.people_of(form)) || 1 : 1;
  const extra = Math.min(Math.max(people - 1, 0), 9);
  useEffect(() => { setOthers((cur) => Array.from({ length: extra }, (_, i) => cur[i] || { name: '', dob: '' })); }, [extra]);

  const hasOwnNotes = !!svc?.fields.flat().some((f) => f.key === 'specialRequests' || f.key === 'preferences');
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, route: key === 'from' || key === 'to' ? undefined : e.route })); };

  if (!svc) return <Shell active="bookings"><Page><ErrorState title="We couldn’t find that service" onRetry={() => navigate('/bookings/new')}>Please choose a service to continue.</ErrorState></Page></Shell>;

  const earnPoints = (config?.services || []).find((s) => s.booking_type === service)?.points;
  const firstBonus = bookings.filter((b) => b.status !== 'cancelled').length === 0 ? config?.first_booking : null;

  const next = () => {
    if (step === 1) {
      const e = validateTrip(svc, form);
      setErrors(e);
      if (Object.keys(e).some((k) => e[k])) { toast.error('Please complete the highlighted details'); return; }
      setStep(2);
    } else if (step === 2) {
      const e = {};
      if (lead.name.trim().length < 2) e.leadName = 'Enter the name exactly as on the ID';
      if (!isValidIndianMobile(lead.phone)) e.leadPhone = 'Enter a valid 10-digit mobile number';
      if (service === 'visa' && !lead.dob) e.leadDob = 'Date of birth is needed for visa applications';
      if (lead.dob && lead.dob > today()) e.leadDob = 'Date of birth cannot be in the future';
      others.forEach((o, i) => { if (o.dob && o.dob > today()) e[`o${i}dob`] = 'Date of birth cannot be in the future'; });
      setErrors(e);
      if (Object.keys(e).length) { toast.error('Please complete the highlighted details'); return; }
      setStep(3);
    }
  };

  const payload = () => ({
    type: service,
    specialRequests: (hasOwnNotes ? form.specialRequests || form.preferences : special) || undefined,
    ...form,
    travelerDetails: {
      lead: { name: lead.name.trim(), dob: lead.dob || null, phone: nationalNumber(lead.phone) },
      additional: others.map((o) => ({ name: o.name.trim(), dob: o.dob || null })).filter((o) => o.name || o.dob),
    },
    ...(special && hasOwnNotes ? { travelNotes: special } : {}),
  });

  const submit = async () => {
    setBusy(true);
    try {
      const created = await submitBooking(payload());
      clearDraft();
      navigate(`/bookings/${created.docId}/received`, { replace: true });
    } catch {
      const ref = `BW${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      saveDraft({ ref, service, summary: `${svc.title_of(form)}${svc.date_of(form) ? ` · ${fmtDate(svc.date_of(form))}` : ''}`, form });
      setFailed({ ref, summary: `Travel date: ${fmtDate(svc.date_of(form))} · ${svc.title_of(form)}` });
    } finally {
      setBusy(false);
    }
  };

  const headTitle = step === 1 ? svc.title : 'Book a trip';
  const progress = (
    <div className="pt-steps" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((n) => <span key={n} className={n <= step ? 'on' : ''} />)}</div>
  );

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
        <AppBar title={headTitle} onBack={() => (step > 1 ? setStep(step - 1) : navigate('/bookings/new'))} right={step === 1 ? <span className="pt-small" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Step 1 of 3</span> : <span className="spacer" />} />
        {step === 1 && <p className="pt-small" style={{ margin: '-4px 0 8px' }}>{svc.blurb}</p>}
        {step > 1 && <p className="pt-small" style={{ textAlign: 'center', margin: '-6px 0 10px' }}>Step {step} of 3 • {step === 2 ? 'Traveler details' : 'Review request'}</p>}
        {progress}
      </div>

      <Page>
        <div className="pt-stack lg" style={{ marginTop: 16 }}>
          {step === 1 && (
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
              {service === 'flight' || service === 'hotel' ? <Notice icon={Info}>Request a quote. Price confirmed by your travel advisor.</Notice> : <Notice tone="gold" icon={Gift}><strong>You will earn {earnPoints ?? '—'} Wings</strong>{svc.earnLabel}</Notice>}
            </>
          )}

          {step === 2 && (
            <>
              <div><h1 className="pt-h1" style={{ fontSize: 24 }}>Traveler details</h1><p className="pt-sub" style={{ marginTop: 6 }}>Tell us who’s travelling. We’ll use this information to plan and book your trip.</p></div>
              <Card>
                <div className="pt-row between" style={{ marginBottom: 12 }}><h2 className="pt-h3">Lead traveler</h2><span className="pt-badge amber">Primary</span></div>
                <div className="pt-stack">
                  <Field label="Full name (as per ID)" error={errors.leadName}><Input icon={User} value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} error={errors.leadName} autoComplete="name" /></Field>
                  <Field label="Date of birth" optional={service !== 'visa'} error={errors.leadDob}><Input icon={Calendar} type="date" max={today()} value={lead.dob} onChange={(e) => setLead({ ...lead, dob: e.target.value })} error={errors.leadDob} /></Field>
                  <Field label="Phone number" error={errors.leadPhone} hint="We’ll use this number for all travel updates."><PhoneField value={nationalNumber(lead.phone)} onChange={(v) => setLead({ ...lead, phone: v })} error={errors.leadPhone} /></Field>
                </div>
              </Card>
              {extra > 0 && (
                <Card>
                  <button type="button" className="pt-row between" style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => setOthersOpen(!othersOpen)}>
                    <span className="pt-row"><span className="pt-item-icon round" style={{ background: '#eef1f4', color: 'var(--pt-navy)' }}><Users size={20} /></span><span><strong className="pt-h3" style={{ display: 'block' }}>Additional traveler{extra > 1 ? 's' : ''} ({extra})</strong><span className="pt-small">{others.filter((o) => o.name).map((o) => o.name).join(', ') || 'Add their names (optional)'}</span></span></span>
                    {othersOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {othersOpen && (
                    <div className="pt-stack" style={{ marginTop: 14 }}>
                      {others.map((o, i) => (
                        <div key={i} className="pt-grid2" style={{ alignItems: 'start' }}>
                          <Field label={`Traveler ${i + 2} name`}><Input value={o.name} onChange={(e) => setOthers(others.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Full name" /></Field>
                          <Field label="Date of birth" optional error={errors[`o${i}dob`]}><Input type="date" max={today()} value={o.dob} onChange={(e) => setOthers(others.map((x, j) => (j === i ? { ...x, dob: e.target.value } : x)))} error={errors[`o${i}dob`]} /></Field>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
              <Card>
                <div className="pt-row" style={{ gap: 10, marginBottom: 10 }}><FileText size={20} style={{ color: 'var(--pt-navy)' }} /><div><h2 className="pt-h3">Special requests <span className="pt-small" style={{ fontWeight: 500 }}>(optional)</span></h2><p className="pt-small">Dietary needs, accessibility, seating preference or any other request.</p></div></div>
                <TextArea value={special} onChange={(e) => setSpecial(e.target.value)} max={500} placeholder="Tell us if you have any special requests…" />
              </Card>
              <Notice icon={Lock}><strong>Your information is safe with us</strong>We use your details only for travel booking and related communication.</Notice>
            </>
          )}

          {step === 3 && (
            <>
              <div><h1 className="pt-h1" style={{ fontSize: 24 }}>Review your booking request</h1><p className="pt-sub" style={{ marginTop: 6 }}>Check the details below and submit your request. Our travel advisor will confirm and contact you shortly.</p></div>
              <div className="pt-banner" style={{ backgroundImage: bg(IMG.coast), minHeight: 130 }}>
                <h2 style={{ fontSize: 24 }}>{svc.title_of(form)}</h2>
                <p style={{ fontSize: 13 }}>{svc.date_of(form) ? fmtDate(svc.date_of(form)) : ''}{people ? ` · ${people} traveller${people === 1 ? '' : 's'}` : ''}</p>
              </div>
              <ReviewCard title="Trip details" icon={MapPin} onEdit={() => setStep(1)}>
                {svc.summary(form).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{String(v)}</strong></div>)}
              </ReviewCard>
              <ReviewCard title="Traveller details" icon={Users} onEdit={() => setStep(2)}>
                <div className="pt-kv"><span>Lead traveler</span><strong>{lead.name}</strong></div>
                <div className="pt-kv"><span>Contact</span><strong>+91 {nationalNumber(lead.phone)}</strong></div>
                {others.filter((o) => o.name).map((o, i) => <div className="pt-kv" key={i}><span>Traveler {i + 2}</span><strong>{o.name}</strong></div>)}
              </ReviewCard>
              <Card>
                <div className="pt-row" style={{ gap: 8, marginBottom: 10 }}><WingsIcon size={20} color="#9b6b21" /><h2 className="pt-h3">Estimated Wings earning</h2><Info size={15} style={{ color: 'var(--pt-faint)' }} /></div>
                <div className="pt-notice gold" style={{ display: 'block' }}>
                  <div className="pt-row between"><span className="pt-row"><WingsIcon size={18} /><span><strong style={{ margin: 0 }}>{earnPoints ?? '—'} Wings</strong>{svc.earnLabel}</span></span><span className="pt-badge green">Confirmed</span></div>
                  {firstBonus ? <div className="pt-row between" style={{ marginTop: 10 }}><span className="pt-row"><Gift size={18} /><span><strong style={{ margin: 0 }}>{firstBonus} Wings (first-booking bonus)</strong>Only if eligible</span></span><span className="pt-badge amber">Conditional</span></div> : null}
                </div>
              </Card>
              <ReviewCard title="Special requests" icon={FileText} onEdit={() => setStep(2)}>
                <p className="pt-sub">{(hasOwnNotes ? [form.specialRequests, form.preferences, special] : [special]).filter(Boolean).join(' · ') || 'No special requests added.'}</p>
              </ReviewCard>
            </>
          )}

          <div className="pt-sticky-cta">
            {step < 3 ? <button type="button" className="pt-btn full" onClick={next}>Continue <ArrowRight size={18} /></button>
              : <button type="button" className="pt-btn full" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit booking request'}</button>}
          </div>
        </div>
      </Page>
    </Shell>
  );
}

function ReviewCard({ title, icon: Icon, onEdit, children }) {
  return (
    <Card>
      <div className="pt-row between" style={{ marginBottom: 6 }}><span className="pt-row"><Icon size={19} style={{ color: 'var(--pt-navy)' }} /><h2 className="pt-h3">{title}</h2></span><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={onEdit}><Pencil size={12} style={{ verticalAlign: -1 }} /> Edit</button></div>
      {children}
    </Card>
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

