// Small shared UI kit for the admin dashboard's newer panels (analytics, CRM,
// tasks). Brand colour = amber/gold from the Bright Wings logo. Tailwind ships
// the `amber` palette, so no config change is needed.
import React from "react";

export const cls = {
  card: "rounded-xl border border-gray-200 bg-white shadow-sm",
  input:
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200",
  label: "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500",
  btn: "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
  btnPrimary:
    "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:bg-amber-700",
  btnOutline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  btnDanger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  btnSm: "px-3 py-1.5 text-xs",
};

// Booking pipeline status -> tailwind colour classes for a pill badge.
const BOOKING_STATUS_COLORS = {
  new: "bg-slate-100 text-slate-700",
  assigned: "bg-blue-100 text-blue-700",
  contacted: "bg-indigo-100 text-indigo-700",
  awaiting_approval: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-orange-100 text-orange-700",
  payment_received: "bg-teal-100 text-teal-700",
  booking_confirmed: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

const TASK_STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export const bookingStatusColor = (s) =>
  BOOKING_STATUS_COLORS[s] || "bg-gray-100 text-gray-700";
export const taskStatusColor = (s) =>
  TASK_STATUS_COLORS[s] || "bg-gray-100 text-gray-700";

// Whole app shows Indian Rupees; keep analytics consistent (no decimals,
// matching the overview cards).
export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const humanize = (value) =>
  (value || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const Badge = ({ color = "bg-gray-100 text-gray-700", children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
  >
    {children}
  </span>
);

export const Spinner = ({ label = "Loading…", className = "" }) => (
  <div
    className={`flex items-center justify-center gap-3 py-10 text-gray-500 ${className}`}
  >
    <i className="fas fa-spinner fa-spin text-amber-500" />
    <span className="text-sm">{label}</span>
  </div>
);

export const EmptyState = ({ icon = "fa-inbox", title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <i className={`fas ${icon} text-3xl text-gray-300`} />
    <p className="text-sm font-medium text-gray-600">{title}</p>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <i className="fas fa-triangle-exclamation text-3xl text-red-400" />
    <p className="text-sm font-medium text-gray-600">
      {message || "Something went wrong."}
    </p>
    {onRetry && (
      <button onClick={onRetry} className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}>
        <i className="fas fa-rotate-right" /> Retry
      </button>
    )}
  </div>
);
