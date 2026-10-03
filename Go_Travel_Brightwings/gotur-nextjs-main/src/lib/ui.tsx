"use client";
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

// Shared bits for the authed (app) pages so each page doesn't re-define them.

export function Card({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      {title && (
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>{title}</div>
      )}
      {children}
    </div>
  );
}

export const BRAND = "#b45309";

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

// Public retrieval URL for an uploaded file (php_uploader at the resource
// subdomain root). Served with its real Content-Type, so it opens/downloads
// directly — no auth needed.
const RESOURCE_BASE = (
  process.env.NEXT_PUBLIC_RESOURCE_URL || "https://resource.brightwingstravel.in"
).replace(/\/$/, "");
export const fileUrl = (fileId: string) =>
  fileId ? `${RESOURCE_BASE}/file.php?id=${encodeURIComponent(fileId)}` : "";

// Humanize a snake_case enum value: airport_transfer -> Airport Transfer.
export const humanize = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_COLOR: Record<string, string> = {
  completed: "#16a34a",
  booking_confirmed: "#16a34a",
  payment_received: "#0891b2",
  cancelled: "#dc2626",
};

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? "#d97706";
  return (
    <span
      style={{
        background: c + "22",
        color: c,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {humanize(status)}
    </span>
  );
}

// 4-box dotted PIN entry. Controlled: value is the digit string, onChange gets
// the cleaned (digits-only, max 4) value. A transparent input overlays the
// boxes and captures keystrokes; the boxes just render the dots.
export function PinInput({
  value,
  onChange,
  length = 4,
  autoFocus,
  ariaLabel = "PIN",
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.focus()}
      style={{ position: "relative", display: "inline-flex", gap: 10, cursor: "text" }}
    >
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 48,
            height: 56,
            border: `2px solid ${i === value.length ? BRAND : "#ddd"}`,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "#fff",
            transition: "border-color .15s",
          }}
        >
          {i < value.length && (
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: BRAND }} />
          )}
        </div>
      ))}
      <input
        ref={ref}
        value={value}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "text" }}
      />
    </div>
  );
}
