import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarDays, Clock, FileText, Gift, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminBooking } from '../../contexts/AdminBookingContext';
import { api } from '../../services/api';
import { Badge, Card, ErrorState, IMG, Select, Skeleton, WingsIcon, bg, fmtDate, fmtNum, memberName, useAsync } from '../ui';
import { bookingTitle, serviceOf, statusMeta } from '../booking';
import StaffShell from './StaffShell';
import { CHART_COLORS, Donut, LineChart, Spark } from './charts';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const rangeLabel = (days) => { const end = new Date(); const start = new Date(Date.now() - (days - 1) * 864e5); const f = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); return `${f(start)} – ${f(end)}`; };

function StatCard({ icon: Icon, label, metric, tone, color }) {
  const delta = metric?.delta_pct;
  return (
    <Card className="st-stat" style={{ overflow: 'hidden' }}>
      <div className="pt-row"><span className="pt-item-icon" style={{ background: 'transparent', color: 'var(--pt-gold-dark)', width: 34, height: 34 }}><Icon size={26} strokeWidth={1.5} /></span><span className="pt-small" style={{ color: 'var(--pt-navy)', fontWeight: 600 }}>{label}</span></div>
      <div className="pt-row between" style={{ alignItems: 'flex-end' }}>
        <div><div className="num">{fmtNum(metric?.total)}</div>{delta != null ? <div className={`delta ${tone === 'down' || delta < 0 ? 'down' : ''}`}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%</div> : <div className="pt-tiny">No prior period</div>}</div>
        <div style={{ width: '48%', minWidth: 90 }}><Spark data={(metric?.series || []).map((d) => d.value)} color={color} /></div>
      </div>
    </Card>
  );
}

function AdminOverview() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useAsync(() => api.get(`/admin/portal/overview?days=${days}`), [days]);
  const mixTotal = (data?.service_mix || []).reduce((a, m) => a + m.count, 0);
  const slices = useMemo(() => {
    const mix = data?.service_mix || [];
    const top = mix.slice(0, 4).map((m, i) => ({ label: serviceOf(m.type).label, value: m.count, color: CHART_COLORS[i] }));
    const rest = mix.slice(4).reduce((a, m) => a + m.count, 0);
    return rest ? [...top, { label: 'Other services', value: rest, color: CHART_COLORS[4] }] : top;
  }, [data]);

  return (
    <StaffShell
      title={`${greeting()}, ${memberName(userData).split(' ')[0]}`}
      sub="Here’s what’s happening with Bright Wings today."
      actions={<Select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ minWidth: 250 }}><option value={7}>Last 7 days · {rangeLabel(7)}</option><option value={30}>Last 30 days · {rangeLabel(30)}</option><option value={90}>Last 90 days · {rangeLabel(90)}</option></Select>}
    >
      {error ? <ErrorState onRetry={reload} /> : (
        <div className="pt-stack lg">
          <div className="pt-grid4">
            {loading && !data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={118} r={18} />) : (
              <>
                <StatCard icon={Users} label="Members" metric={data.members} color="#2f6fa1" />
                <StatCard icon={CalendarDays} label="Active bookings" metric={data.active_bookings} color="#d9a43e" />
                <StatCard icon={WingsIcon} label="Wings issued" metric={data.wings_issued} color="#2f9e83" />
                <StatCard icon={Gift} label="Pending redemptions" metric={data.pending_redemptions} color="#d9604f" />
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18 }}>
            <Card className="st-span2">
              <div className="pt-row between" style={{ marginBottom: 8 }}><h2 className="pt-h2">Booking trends</h2><Badge>Bookings</Badge></div>
              {loading && !data ? <Skeleton h={230} /> : <LineChart series={[{ name: 'Bookings', color: '#10283f', data: data.booking_trends }]} />}
            </Card>
            <Card>
              <div className="pt-row" style={{ marginBottom: 8 }}><h2 className="pt-h2">Service mix</h2><span className="pt-small">(by bookings)</span></div>
              {loading && !data ? <Skeleton h={190} /> : !slices.length ? <p className="pt-sub">No bookings in this period.</p> : (
                <div className="pt-row" style={{ gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Donut slices={slices} center={[mixTotal, 'bookings']} />
                  <div className="pt-stack" style={{ gap: 9, fontSize: 12.5, flex: 1, minWidth: 140 }}>{slices.map((s) => <div key={s.label} className="pt-row between"><span className="pt-row" style={{ gap: 8 }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />{s.label}</span><strong>{Math.round((s.value / mixTotal) * 100)}%</strong></div>)}</div>
                </div>
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 18 }}>
            <Card pad={false}>
              <div className="pt-row between" style={{ padding: '18px 18px 8px' }}><h2 className="pt-h2">Redemption queue</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => navigate('/admin/redemptions')}>View all</button></div>
              <div className="pt-table-wrap"><table className="pt-table"><thead><tr><th>Request ID</th><th>Customer</th><th>Reward</th><th>Wings</th><th>Requested on</th><th>Status</th></tr></thead><tbody>
                {(data?.redemption_queue || []).map((r) => <tr key={r.id} className="clickable" onClick={() => navigate(`/admin/redemptions?open=${r.id}`)}><td><strong>{r.display_code}</strong></td><td>{r.customer}</td><td>{r.reward}</td><td>{fmtNum(r.wings)}</td><td>{fmtDate(r.created_at)}</td><td><Badge tone={r.status === 'requested' ? 'amber' : 'blue'}>{r.status === 'requested' ? 'Pending' : 'In review'}</Badge></td></tr>)}
                {data && !data.redemption_queue.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--pt-muted)' }}>No redemptions waiting.</td></tr>}
              </tbody></table></div>
            </Card>
            <Card pad={false}>
              <div className="pt-row between" style={{ padding: '18px 18px 8px' }}><h2 className="pt-h2">Recent bookings</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => navigate('/admin/bookings')}>View all</button></div>
              <div className="pt-table-wrap"><table className="pt-table"><thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Status</th><th>Created on</th></tr></thead><tbody>
                {(data?.recent_bookings || []).map((b) => { const m = statusMeta(b.status); return <tr key={b.id} className="clickable" onClick={() => navigate(`/admin/bookings/${b.id}`)}><td><strong>{b.display_code}</strong></td><td>{b.customer}</td><td>{b.place || serviceOf(b.type).label}</td><td><Badge tone={m.tone}>{m.label}</Badge></td><td>{fmtDate(b.created_at)}</td></tr>; })}
                {data && !data.recent_bookings.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--pt-muted)' }}>No bookings yet.</td></tr>}
              </tbody></table></div>
            </Card>
          </div>
        </div>
      )}
    </StaffShell>
  );
}

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function EmployeeOverview() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { allBookings, loading } = useAdminBooking();
  const { data: tasks } = useAsync(() => api.get('/portal/staff/tasks'), []);
  const open = (tasks || []).filter((t) => ['pending', 'in_progress'].includes(t.status));
  const today = new Date();
  const dueToday = open.filter((t) => t.due_at && (sameDay(new Date(t.due_at), today) || new Date(t.due_at) < today));
  const active = allBookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
  const quotesDue = active.filter((b) => ['new', 'assigned', 'contacted'].includes(b.status));
  const followBy = useMemo(() => { const m = new Map(); open.forEach((t) => { if (t.booking_id && t.due_at && (!m.has(t.booking_id) || new Date(t.due_at) < new Date(m.get(t.booking_id)))) m.set(t.booking_id, t.due_at); }); return m; }, [open]);
  const tile = (icon, value, label, sub, path) => <button type="button" className="pt-card pad" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate(path)}><div className="pt-row" style={{ gap: 14 }}><span className="pt-item-icon" style={{ width: 54, height: 54 }}>{React.createElement(icon, { size: 24 })}</span><div><div className="pt-small" style={{ color: 'var(--pt-navy)', fontWeight: 600 }}>{label}</div><div className="num pt-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--pt-navy)', lineHeight: 1.1 }}>{value}</div><div className="pt-tiny">{sub}</div></div></div></button>;
  const dot = (p) => (p === 'high' ? '#d9453b' : p === 'medium' ? '#e3a22c' : '#b9bfc7');

  return (
    <StaffShell title={`${greeting()}, ${memberName(userData).split(' ')[0]}`} sub="Here’s your workspace for today." actions={<div className="pt-row" style={{ gap: 10 }}><Calendar size={20} style={{ color: 'var(--pt-muted)' }} /><div style={{ textAlign: 'right' }}><strong style={{ color: 'var(--pt-navy)', fontSize: 13 }}>{todayLabel()}</strong><div className="pt-tiny">Bright Wings • Employee Workspace</div></div></div>}>
      <div className="pt-stack lg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
          {tile(FileText, loading ? '—' : active.length, 'Assigned bookings', 'Active bookings assigned to you', '/admin/bookings')}
          {tile(Clock, dueToday.length, 'Follow-ups due', 'Customer follow-ups today', '/admin/crm')}
          {tile(FileText, quotesDue.length, 'Quotes due', 'Quotes to send today', '/admin/bookings')}
          <div className="pt-banner" style={{ backgroundImage: bg(IMG.palace), minHeight: 120, textAlign: 'right', alignItems: 'flex-end', padding: '16px 20px' }}><h2 style={{ fontSize: 18, lineHeight: 1.25 }}>Curating<br />happier journeys<br />every day</h2></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 18 }}>
          <Card pad={false} style={{ gridColumn: 'span 1', minWidth: 0 }}>
            <div className="pt-row between" style={{ padding: '18px 18px 8px' }}><h2 className="pt-h2" style={{ fontSize: 17 }}>My assigned bookings</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => navigate('/admin/bookings')}>View all</button></div>
            <div className="pt-table-wrap"><table className="pt-table"><thead><tr><th>Ref #</th><th>Customer</th><th>Destination</th><th>Travel dates</th><th>Service</th><th>Status</th><th>Next follow-up</th></tr></thead><tbody>
              {active.slice(0, 6).map((b) => { const m = statusMeta(b.status); const f = followBy.get(b.docId); return <tr key={b.docId} className="clickable" onClick={() => navigate(`/admin/bookings/${b.docId}`)}><td><strong>{b.id}</strong></td><td>{b.userName}</td><td>{bookingTitle(b)}</td><td>{fmtDate(serviceOf(b.type).date_of(b))}</td><td>{serviceOf(b.type).label}</td><td><Badge tone={m.tone}>{m.label}</Badge></td><td>{f ? new Date(f).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</td></tr>; })}
              {!active.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--pt-muted)', padding: 28 }}>{loading ? 'Loading your bookings…' : 'No bookings are assigned to you yet.'}</td></tr>}
            </tbody></table></div>
          </Card>
          <Card pad={false}>
            <div className="pt-row between" style={{ padding: '18px 18px 8px' }}><h2 className="pt-h2" style={{ fontSize: 17 }}>Today’s task queue</h2><button type="button" className="pt-link" style={{ color: 'var(--pt-blue)' }} onClick={() => navigate('/admin/crm')}>View all</button></div>
            <div style={{ padding: '4px 18px 16px' }}>
              {open.slice(0, 6).map((t) => (
                <button type="button" key={t.id} className="pt-row top" onClick={() => navigate('/admin/crm')} style={{ width: '100%', gap: 12, padding: '12px 0', border: 0, borderTop: '1px solid var(--pt-line)', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  <span className="pt-small" style={{ width: 66, flex: 'none' }}>{t.due_at ? new Date(t.due_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'}</span>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot(t.priority), marginTop: 5, flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', color: 'var(--pt-navy)', fontSize: 13 }}>{t.title}</strong><span className="pt-small">{t.description || t.customer_name}</span></span>
                  <span className="pt-small">{t.booking_code}</span>
                </button>
              ))}
              {!open.length && <p className="pt-sub" style={{ padding: '18px 0' }}>You’re all caught up — no open follow-ups.</p>}
            </div>
          </Card>
        </div>
      </div>
    </StaffShell>
  );
}

export default function StaffOverview() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminOverview /> : <EmployeeOverview />;
}

