import React, { useEffect, useMemo, useState } from 'react';
import { CircleCheck, Download, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Badge, Card, ErrorState, Input, Modal, ModalHead, Select, Skeleton, Tabs, fmtDate, fmtNum, useAsync } from '../ui';
import { TIERS } from '../booking';
import StaffShell from './StaffShell';
import { BarChart, Donut, HBar as HBarRow, LineChart } from './charts';

const SERVICE_LABEL = { flight: 'Flight booking', hotel: 'Hotel booking', car_rental: 'Car rental', visa: 'Visa booking', tour: 'Tour package', cruise: 'Cruise booking', custom: 'Customized travel', airport_transfer: 'Airport transfer', insurance: 'Insurance', activity: 'Activity tickets' };

/* ------------------------------------------------------------ loyalty settings */

export function LoyaltySettings() {
  const cfg = useAsync(() => api.get('/rewards/points-config'), []);
  const [tab, setTab] = useState('earning');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (cfg.data && !draft) setDraft({ ...JSON.parse(JSON.stringify(cfg.data)), referral_booking: cfg.data.referral_booking ?? 50 }); }, [cfg.data, draft]);

  const changes = useMemo(() => {
    if (!cfg.data || !draft) return [];
    const out = [];
    const push = (label, a, b) => { if (Number(a) !== Number(b)) out.push([label, a, b]); };
    push('Welcome registration', cfg.data.welcome_bonus, draft.welcome_bonus);
    push('First booking (any product)', cfg.data.first_booking, draft.first_booking);
    push('Direct referral (per friend)', cfg.data.referral_booking ?? 50, draft.referral_booking);
    cfg.data.services.forEach((s, i) => push(SERVICE_LABEL[s.booking_type] || s.booking_type, s.points, draft.services[i].points));
    return out;
  }, [cfg.data, draft]);

  const setField = (key, value) => setDraft({ ...draft, [key]: value === '' ? '' : Math.max(0, Math.floor(Number(value))) });
  const setService = (i, value) => setDraft({ ...draft, services: draft.services.map((s, j) => (j === i ? { ...s, points: value === '' ? '' : Math.max(0, Math.floor(Number(value))) } : s)) });
  const invalid = draft && (['welcome_bonus', 'first_booking', 'referral_booking'].some((k) => draft[k] === '') || draft.services.some((s) => s.points === ''));

  const save = async () => {
    setBusy(true);
    try {
      const saved = await api.put('/admin/points-config', draft);
      cfg.setData(saved);
      setDraft({ ...JSON.parse(JSON.stringify(saved)), referral_booking: saved.referral_booking ?? 50 });
      setSavedAt(new Date());
      toast.success('Loyalty settings saved. Changes apply to future qualifying events.');
    } catch (e) { toast.error(e.message || 'We could not save the settings'); } finally { setBusy(false); }
  };

  const cell = (label, value, onChange) => (
    <tr key={label}><td>{label}</td><td><Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 110, minHeight: 40 }} /></td><td><Badge tone="green" dot>Active</Badge></td></tr>
  );

  return (
    <StaffShell title="Loyalty Settings" sub="Configure how Wings are earned, tier thresholds and referral rewards."
      actions={<><Badge tone="green" dot>Live configuration</Badge>{savedAt && <span className="pt-small">Saved {fmtDate(savedAt)}</span>}<button type="button" className="pt-btn sm" disabled={!changes.length || busy || invalid} onClick={save}>{busy ? 'Saving…' : 'Save Changes'}</button><button type="button" className="pt-btn ghost sm" onClick={() => setSummary(true)}>View Change Summary{changes.length ? ` (${changes.length})` : ''}</button></>}>
      {cfg.error ? <ErrorState onRetry={cfg.reload} /> : !draft ? <Skeleton h={320} r={18} /> : (
        <div className="pt-stack lg">
          <Tabs tabs={[['earning', 'Earning Rules'], ['tiers', 'Tier Levels'], ['referral', 'Referral Program']]} value={tab} onChange={setTab} />
          {tab === 'earning' && (
            <Card pad={false}>
              <div style={{ padding: '18px 18px 4px' }}><h2 className="pt-h2">Wings Earning Rules</h2><p className="pt-small" style={{ marginTop: 4 }}>Set the number of Wings awarded for each qualifying action. Changes apply to future qualifying events only.</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 0 }}>
                <table className="pt-table"><thead><tr><th>Activity / Product</th><th>Wings Awarded</th><th>Status</th></tr></thead><tbody>{cell('Welcome registration', draft.welcome_bonus, (v) => setField('welcome_bonus', v))}{cell('First booking (any product)', draft.first_booking, (v) => setField('first_booking', v))}{draft.services.slice(0, 5).map((s, i) => cell(SERVICE_LABEL[s.booking_type] || s.booking_type, s.points, (v) => setService(i, v)))}</tbody></table>
                <table className="pt-table"><thead><tr><th>Activity / Product</th><th>Wings Awarded</th><th>Status</th></tr></thead><tbody>{draft.services.slice(5).map((s, i) => cell(SERVICE_LABEL[s.booking_type] || s.booking_type, s.points, (v) => setService(i + 5, v)))}{cell('Direct referral (per friend)', draft.referral_booking, (v) => setField('referral_booking', v))}</tbody></table>
              </div>
              <div style={{ padding: 18 }}><div className="pt-notice"><Info size={18} /><div><strong>Note</strong>Wings are awarded for completed and eligible bookings as per program terms. Values can be changed at any time and apply from the next qualifying event.</div></div></div>
            </Card>
          )}
          {tab === 'tiers' && (
            <Card>
              <h2 className="pt-h2">Tier Levels <span className="pt-small" style={{ fontWeight: 500 }}>(Lifetime Wings)</span></h2>
              <p className="pt-small" style={{ margin: '4px 0 14px' }}>No monthly cascading model. A member’s tier follows their lifetime Wings and never decreases.</p>
              <table className="pt-table" style={{ border: '1px solid var(--pt-line)' }}><thead><tr><th>Tier</th><th>Lifetime Wings Required</th></tr></thead><tbody>{TIERS.map(([name, t]) => <tr key={name}><td><strong>{name}</strong></td><td>{fmtNum(t)}</td></tr>)}</tbody></table>
              <div className="pt-notice plain" style={{ marginTop: 14 }}><Info size={18} /><div>Tier thresholds are fixed program policy in this release. Contact your developer to change them.</div></div>
            </Card>
          )}
          {tab === 'referral' && (
            <Card style={{ maxWidth: 640 }}>
              <h2 className="pt-h2">Referral Program</h2>
              <p className="pt-small" style={{ margin: '4px 0 14px' }}>Wings awarded once, when a referred customer completes their first booking.</p>
              <table className="pt-table" style={{ border: '1px solid var(--pt-line)' }}><thead><tr><th>Action</th><th>Wings Awarded</th></tr></thead><tbody><tr><td>Direct referral (per friend)</td><td><Input type="number" min="0" value={draft.referral_booking} onChange={(e) => setField('referral_booking', e.target.value)} style={{ maxWidth: 110, minHeight: 40 }} /></td></tr></tbody></table>
              <div className="pt-notice plain" style={{ marginTop: 14 }}><Info size={18} /><div>Cancelled bookings never qualify. There is no limit to how many friends a member can refer, but each friend pays out once.</div></div>
            </Card>
          )}
        </div>
      )}
      <Modal open={summary} onClose={() => setSummary(false)} label="Change summary">
        <ModalHead title="Change summary" sub="Unsaved changes to the loyalty configuration." onClose={() => setSummary(false)} />
        {!changes.length ? <p className="pt-sub">There are no unsaved changes.</p> : <div>{changes.map(([k, a, b]) => <div className="pt-kv" key={k}><span>{k}</span><strong>{fmtNum(a)} → {fmtNum(b)}</strong></div>)}</div>}
        <button type="button" className="pt-btn full" style={{ marginTop: 18 }} onClick={() => setSummary(false)}>Close</button>
      </Modal>
    </StaffShell>
  );
}

/* ------------------------------------------------------------------ analytics */

const Kpi = ({ icon: Icon, label, value, delta, suffix = '', tone, unit = '%', invert }) => {
  const good = delta == null ? null : invert ? delta <= 0 : delta >= 0;
  return (
    <Card className="st-stat" style={{ background: tone }}>
      <div className="pt-row" style={{ gap: 8 }}><Icon size={22} strokeWidth={1.6} /><span className="pt-small" style={{ color: 'var(--pt-navy)' }}>{label}</span></div>
      <div className="num">{value}{suffix}</div>
      {delta != null ? <div className={`delta ${good ? '' : 'down'}`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}{unit}</div> : <div className="pt-tiny">No prior period</div>}
    </Card>
  );
};

export function Analytics() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useAsync(() => api.get(`/admin/portal/loyalty-analytics?days=${days}`), [days]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Metric', 'Value'], ['Period (days)', data.days], ['New members', data.new_members.period], ['Booking completion rate %', data.booking_completion.rate], ['Wings issued', data.wings_issued.period], ['Wings redeemed', data.wings_redeemed.period], ['Referral conversion %', data.referral_conversion.rate], ['Avg redemption approval (hours)', data.approval_time.hours ?? ''], ...data.tier_distribution.map((t) => [`Members - ${t.tier}`, t.count])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `bright-wings-loyalty-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const rate = useMemo(() => (data ? data.created_series.map((d, i) => ({ date: d.date, value: d.value ? Math.round((data.completion_series[i].value / d.value) * 100) : 0 })) : []), [data]);
  const tierTotal = (data?.tier_distribution || []).reduce((a, t) => a + t.count, 0);
  const tiers = ['Silver', 'Gold', 'Platinum', 'Titanium'].map((t, i) => ({ label: t, value: (data?.tier_distribution || []).find((x) => x.tier === t)?.count || 0, color: ['#bfc5cc', '#d9a43e', '#6e8aa6', '#10283f'][i] }));
  const funnelMax = Math.max(data?.referral_conversion.referred || 0, 1);

  return (
    <StaffShell title="Loyalty Analytics" sub="Track program performance, member growth and engagement across Bright Wings."
      actions={<><Select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ minWidth: 190 }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option></Select><button type="button" className="pt-btn ghost sm" onClick={exportCsv} disabled={!data}><Download size={16} /> Export Report</button></>}>
      {error ? <ErrorState onRetry={reload} /> : loading && !data ? <div className="pt-stack"><Skeleton h={110} r={18} /><Skeleton h={260} r={18} /></div> : (
        <div className="pt-stack lg">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 165px), 1fr))', gap: 14 }}>
            <Kpi icon={CircleCheck} label="New Loyalty Members" value={fmtNum(data.new_members.period)} delta={data.new_members.delta_pct} tone="#eaf3fb" />
            <Kpi icon={CircleCheck} label="Booking Completion Rate" value={data.booking_completion.rate} suffix="%" delta={data.booking_completion.delta_pp} unit=" pp" tone="#eaf6f0" />
            <Kpi icon={CircleCheck} label="Wings Issued" value={fmtNum(data.wings_issued.period)} delta={data.wings_issued.delta_pct} tone="#fff3dc" />
            <Kpi icon={CircleCheck} label="Wings Redeemed" value={fmtNum(data.wings_redeemed.period)} delta={data.wings_redeemed.delta_pct} tone="#eef3fb" />
            <Kpi icon={CircleCheck} label="Referral to First Completion" value={data.referral_conversion.rate} suffix="%" delta={data.referral_conversion.delta_pp} unit=" pp" tone="#eaf6f0" />
            <Kpi icon={CircleCheck} label="Redemption Approval Time" value={data.approval_time.hours ?? '—'} suffix={data.approval_time.hours != null ? ' hours' : ''} delta={data.approval_time.delta_pct} invert tone="#fdecea" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18 }}>
            <Card><h2 className="pt-h2" style={{ marginBottom: 4 }}>Customer Growth</h2><p className="pt-small">New loyalty members (daily)</p><BarChart data={data.new_members.series} /></Card>
            <Card><h2 className="pt-h2" style={{ marginBottom: 4 }}>Booking Completion Rate</h2><p className="pt-small">Completed bookings vs total bookings</p><BarChart data={data.created_series} secondary={data.completion_series} line={rate} /></Card>
            <Card><h2 className="pt-h2" style={{ marginBottom: 4 }}>Wings Issued vs Redeemed</h2><p className="pt-small">Per day</p><LineChart series={[{ name: 'Issued', color: '#10283f', data: data.wings_issued.series }, { name: 'Redeemed', color: '#d9a43e', data: data.wings_redeemed.series }]} />
              <div className="st-legend" style={{ marginTop: 8 }}><span><i style={{ background: '#10283f' }} />Issued</span><span><i style={{ background: '#d9a43e' }} />Redeemed</span></div></Card>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 18 }}>
            <Card><h2 className="pt-h2" style={{ marginBottom: 12 }}>Tier Distribution</h2>
              <div className="pt-row" style={{ gap: 18, flexWrap: 'wrap' }}><Donut slices={tiers.some((t) => t.value) ? tiers : [{ label: 'None', value: 1, color: '#eee9dc' }]} size={170} center={[tierTotal, 'Total Members']} />
                <table className="pt-table" style={{ flex: 1, minWidth: 200 }}><tbody>{tiers.map((t) => <tr key={t.label}><td><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: t.color, marginRight: 8 }} />{t.label}</td><td>{fmtNum(t.value)}</td><td>{tierTotal ? Math.round((t.value / tierTotal) * 100) : 0}%</td></tr>)}</tbody></table></div></Card>
            <Card><h2 className="pt-h2" style={{ marginBottom: 4 }}>Referral Conversion Funnel</h2><p className="pt-small" style={{ marginBottom: 14 }}>From joining to first completed booking</p>
              <div className="pt-stack"><HBarRow label="Signed up" value={data.referral_conversion.referred} max={funnelMax} right={`${fmtNum(data.referral_conversion.referred)}  100%`} /><HBarRow label="First booking completed" value={data.referral_conversion.completed} max={funnelMax} color="#6e8aa6" right={`${fmtNum(data.referral_conversion.completed)}  ${data.referral_conversion.rate}%`} /></div></Card>
            <Card><h2 className="pt-h2" style={{ marginBottom: 4 }}>Redemption Approval Time</h2><p className="pt-small">Hours from request to decision</p><BarChart data={data.approval_time.series} color="#d9a43e" avg={data.approval_time.hours ?? undefined} /></Card>
          </div>
        </div>
      )}
    </StaffShell>
  );
}

