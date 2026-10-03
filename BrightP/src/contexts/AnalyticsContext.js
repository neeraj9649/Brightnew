import React, { createContext, useContext, useCallback } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";

// Read-only admin reporting. The /admin/analytics endpoints return
// presentation-ready projections, so (like the backend) we pass the raw
// snake_case shapes straight through to the panel -- no mapper layer.
const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (ctx === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
};

export const AnalyticsProvider = ({ children }) => {
  // All six dashboards in one round-trip; the panel owns loading/error state.
  const fetchAll = useCallback(async () => {
    const [overview, revenue, customers, membership, referral, employees] =
      await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/revenue"),
        api.get("/admin/analytics/customers"),
        api.get("/admin/analytics/membership"),
        api.get("/admin/analytics/referral"),
        api.get("/admin/analytics/employees"),
      ]);
    return { overview, revenue, customers, membership, referral, employees };
  }, []);

  // Admin-triggered monthly referral payout (no in-process scheduler exists;
  // this is the manual lever). Re-running a paid month returns 409.
  const runMonthlyPayout = useCallback(async (year, month) => {
    try {
      const res = await api.post("/admin/referrals/run-monthly-payout", {
        year,
        month,
      });
      toast.success(
        `Payout complete — ${res.users_paid} member(s) paid ${res.total_points_paid} pts`,
      );
      return res;
    } catch (err) {
      toast.error(err.message || "Payout failed");
      throw err;
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{ fetchAll, runMonthlyPayout }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
