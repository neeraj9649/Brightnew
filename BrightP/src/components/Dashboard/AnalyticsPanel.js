import React, { useCallback, useEffect, useState } from "react";
import { useAnalytics } from "../../contexts/AnalyticsContext";
import { cls, Spinner, ErrorState, EmptyState, humanize, formatINR } from "./ui";

const TYPE_ICONS = {
  flight: "fa-plane",
  hotel: "fa-bed",
  tour: "fa-map-location-dot",
  visa: "fa-passport",
  airport_transfer: "fa-van-shuttle",
  cruise: "fa-ship",
  insurance: "fa-shield-halved",
  activity: "fa-ticket",
  car_rental: "fa-car",
  custom: "fa-bell-concierge",
};

const now = new Date();
// Default the payout period to last month (payouts run after a month closes).
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

const AnalyticsPanel = () => {
  const { fetchAll, runMonthlyPayout } = useAnalytics();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchAll());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Crunching the numbers…" className="min-h-[60vh]" />;
  if (error)
    return (
      <div className="min-h-[60vh]">
        <ErrorState message="Couldn't load analytics." onRetry={load} />
      </div>
    );

  const { overview, revenue, customers, membership, referral, employees } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-500">Business performance at a glance.</p>
        </div>
        <button onClick={load} className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}>
          <i className="fas fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="fa-sack-dollar" accent="emerald" label="Total Revenue"
          value={formatINR(overview.total_revenue || 0)} />
        <StatCard icon="fa-calendar-check" accent="amber" label="Total Bookings"
          value={overview.total_bookings}
          sub={`${overview.active_bookings} active · ${overview.completed_bookings} done`} />
        <StatCard icon="fa-users" accent="blue" label="Customers"
          value={overview.total_customers}
          sub={`${customers.new_this_month} new this month`} />
        <StatCard icon="fa-coins" accent="violet" label="Wings Outstanding"
          value={(overview.points_outstanding || 0).toLocaleString()}
          sub={`${overview.total_referrals} referrals · ${overview.total_employees} staff`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by type */}
        <Section title="Revenue by Service" icon="fa-chart-pie">
          {revenue.by_type.length === 0 ? (
            <EmptyState icon="fa-chart-pie" title="No revenue yet" />
          ) : (
            <BarList
              items={[...revenue.by_type]
                .sort((a, b) => b.revenue - a.revenue)
                .map((r) => ({
                  key: r.type,
                  label: humanize(r.type),
                  icon: TYPE_ICONS[r.type],
                  value: r.revenue,
                  caption: `${formatINR(r.revenue)} · ${r.bookings} bkg`,
                }))}
              color="bg-amber-500"
            />
          )}
        </Section>

        {/* Monthly revenue */}
        <Section title="Monthly Revenue" icon="fa-chart-column">
          {revenue.monthly.length === 0 ? (
            <EmptyState icon="fa-chart-column" title="No revenue yet" />
          ) : (
            <BarList
              items={revenue.monthly.map((m) => ({
                key: m.month,
                label: m.month,
                value: m.revenue,
                caption: formatINR(m.revenue),
              }))}
              color="bg-emerald-500"
            />
          )}
        </Section>

        {/* Membership distribution */}
        <Section title="Membership Tiers" icon="fa-medal">
          {membership.length === 0 ? (
            <EmptyState icon="fa-medal" title="No members yet" />
          ) : (
            <BarList
              items={membership.map((t) => ({
                key: t.tier,
                label: t.tier,
                value: t.count,
                caption: `${t.count}`,
              }))}
              color="bg-violet-500"
            />
          )}
        </Section>

        {/* Customer signups */}
        <Section title="Customer Signups" icon="fa-user-plus">
          {customers.monthly_signups.length === 0 ? (
            <EmptyState icon="fa-user-plus" title="No signups yet" />
          ) : (
            <BarList
              items={customers.monthly_signups.map((m) => ({
                key: m.month,
                label: m.month,
                value: m.count,
                caption: `${m.count}`,
              }))}
              color="bg-blue-500"
            />
          )}
        </Section>
      </div>

      {/* Referral + payout */}
      <ReferralSection referral={referral} runMonthlyPayout={runMonthlyPayout} />

      {/* Employee performance */}
      <Section title="Employee Performance" icon="fa-user-tie" className="mt-6">
        {employees.length === 0 ? (
          <EmptyState icon="fa-user-tie" title="No staff yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-4 font-semibold">Employee</th>
                  <th className="px-2 py-2 text-right font-semibold">Assigned</th>
                  <th className="px-2 py-2 text-right font-semibold">Completed</th>
                  <th className="px-2 py-2 text-right font-semibold">Open Tasks</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.user_id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-700">{e.name}</td>
                    <td className="px-2 py-2 text-right text-gray-600">{e.assigned}</td>
                    <td className="px-2 py-2 text-right text-emerald-600">{e.completed}</td>
                    <td className="px-2 py-2 text-right text-amber-600">{e.open_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};

const ACCENTS = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
};

const StatCard = ({ icon, label, value, sub, accent = "amber" }) => (
  <div className={`${cls.card} p-4`}>
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
        <i className={`fas ${icon}`} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
    {sub && <p className="mt-2 text-xs text-gray-400">{sub}</p>}
  </div>
);

const Section = ({ title, icon, children, action, className = "" }) => (
  <section className={`${cls.card} p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        <i className={`fas ${icon} text-amber-500`} /> {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const BarList = ({ items, color = "bg-amber-500" }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-700">
              {i.icon && <i className={`fas ${i.icon} text-gray-400`} />}
              {i.label}
            </span>
            <span className="text-xs font-medium text-gray-500">{i.caption}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${color} transition-all`}
              style={{ width: `${Math.max((i.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ReferralSection = ({ referral, runMonthlyPayout }) => {
  const [year, setYear] = useState(lastMonth.getFullYear());
  const [month, setMonth] = useState(lastMonth.getMonth() + 1); // 1-12
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);

  const periodLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const run = async () => {
    setRunning(true);
    try {
      await runMonthlyPayout(Number(year), Number(month));
      setConfirming(false);
    } catch {
      /* toast handled in context */
    } finally {
      setRunning(false);
    }
  };

  return (
    <Section title="Referrals" icon="fa-share-nodes" className="mt-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <Mini label="Total Referrals" value={referral.total_referrals} />
          <Mini label="Wings Paid Out" value={(referral.total_referral_points_paid || 0).toLocaleString()} />
        </div>

        {/* Payout control */}
        <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            <i className="fas fa-money-bill-transfer mr-1 text-amber-500" /> Run Monthly Payout
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${cls.input} w-auto`} value={month}
              onChange={(e) => setMonth(e.target.value)} disabled={confirming}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("en-US", { month: "short" })}
                </option>
              ))}
            </select>
            <input type="number" className={`${cls.input} w-24`} value={year}
              onChange={(e) => setYear(e.target.value)} disabled={confirming} />
          </div>

          {!confirming ? (
            <button onClick={() => setConfirming(true)}
              className={`${cls.btn} ${cls.btnPrimary} ${cls.btnSm} mt-3`}>
              <i className="fas fa-play" /> Run for {periodLabel}
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-amber-800">
                Credit referral points for <b>{periodLabel}</b>? This can only run
                once per month.
              </p>
              <div className="flex gap-2">
                <button onClick={run} disabled={running}
                  className={`${cls.btn} ${cls.btnPrimary} ${cls.btnSm}`}>
                  <i className={`fas ${running ? "fa-spinner fa-spin" : "fa-check"}`} />
                  {running ? "Running…" : "Confirm"}
                </button>
                <button onClick={() => setConfirming(false)} disabled={running}
                  className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top referrers */}
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Top Referrers
        </h3>
        {referral.top_referrers.length === 0 ? (
          <p className="text-sm text-gray-400">No referrals recorded yet.</p>
        ) : (
          <ul className="space-y-1">
            {referral.top_referrers.map((r, idx) => (
              <li key={r.user_id} className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-gray-50">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {idx + 1}
                  </span>
                  {r.name}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {r.referral_count} referral{r.referral_count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
};

const Mini = ({ label, value }) => (
  <div className={`${cls.card} p-4`}>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

export default AnalyticsPanel;
