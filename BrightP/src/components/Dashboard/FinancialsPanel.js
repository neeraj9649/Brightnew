import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import {
  cls,
  Badge,
  Spinner,
  EmptyState,
  bookingStatusColor,
  formatINR,
  humanize,
} from "./ui";

const StatCard = ({ label, value, color }) => (
  <div className={`${cls.card} p-4`}>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const FinancialsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const qs = params.toString();
      const res = await api.get(`/admin/financials/pnl${qs ? `?${qs}` : ""}`);
      setData(res);
    } catch (e) {
      toast.error(e.message || "Failed to load financials");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={cls.label}>From</label>
          <input
            type="date"
            className={cls.input}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className={cls.label}>To</label>
          <input
            type="date"
            className={cls.input}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading financials…" />
      ) : !data ? (
        <EmptyState icon="fa-chart-line" title="No data" />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatINR(data.overall.revenue)}
              color="text-gray-800"
            />
            <StatCard
              label="Expenses"
              value={formatINR(data.overall.expense)}
              color="text-gray-800"
            />
            <StatCard
              label="Profit"
              value={formatINR(data.overall.profit)}
              color={data.overall.profit >= 0 ? "text-emerald-600" : "text-red-600"}
            />
            <StatCard
              label="Bookings"
              value={data.overall.count}
              color="text-gray-800"
            />
          </div>

          {data.bookings.length === 0 ? (
            <EmptyState icon="fa-chart-line" title="No bookings in range" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-3">Booking</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Revenue</th>
                    <th className="py-2 pr-3 text-right">Expense</th>
                    <th className="py-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 pr-3">
                        <Link
                          to={`/admin/bookings/${b.id}`}
                          className="font-mono text-amber-600 hover:underline"
                        >
                          {b.display_code}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">{humanize(b.type)}</td>
                      <td className="py-2 pr-3">
                        <Badge color={bookingStatusColor(b.status)}>
                          {humanize(b.status)}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatINR(b.revenue)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatINR(b.expense)}
                      </td>
                      <td
                        className={`py-2 text-right font-semibold ${b.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {formatINR(b.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialsPanel;
