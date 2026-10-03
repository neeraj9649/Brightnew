"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import {
  Card,
  BRAND,
  formatINR,
  fmtDate,
  humanize,
  StatusBadge,
  fileUrl,
} from "@/lib/ui";

// Customer-visible documents on a booking (tickets/vouchers/invoices).
interface BookingDoc {
  id: string;
  kind: string;
  file_id: string;
  label: string | null;
  created_at: string;
}

// Mirrors backend BookingDTO (modules/bookings api/dto/booking.rs). `type` is the
// serde-renamed booking_type.
interface Booking {
  id: string;
  display_code: string;
  type: string;
  status: string;
  estimated_cost: number;
  final_cost: number;
  special_requests: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// Spec's 10 service types.
const TYPES = [
  "flight",
  "visa",
  "tour",
  "hotel",
  "airport_transfer",
  "cruise",
  "insurance",
  "activity",
  "car_rental",
  "custom",
];

const CANCELLABLE = (s: string) => s !== "completed" && s !== "cancelled";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: "flight",
    estimated_cost: "",
    destination: "",
    special_requests: "",
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [docsById, setDocsById] = useState<Record<string, BookingDoc[]>>({});

  function load() {
    apiGet("/bookings")
      .then((d) => setBookings(d as Booking[]))
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  function toggleDetails(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!docsById[id]) {
      apiGet(`/bookings/${id}/documents`)
        .then((d) => setDocsById((m) => ({ ...m, [id]: d as BookingDoc[] })))
        .catch(() => setDocsById((m) => ({ ...m, [id]: [] })));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiPost("/bookings", {
        type: form.type,
        estimated_cost: Number(form.estimated_cost) || 0,
        special_requests: form.special_requests || null,
        // ponytail: single free-text field into details; richer per-type fields later.
        details: form.destination ? { destination: form.destination } : {},
      });
      setForm({ type: "flight", estimated_cost: "", destination: "", special_requests: "" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await apiPost(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const input = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, width: "100%" };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Bookings</h1>

      <Card title="New booking request" style={{ marginBottom: 24 }}>
        <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Service type</div>
            <select
              style={input}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Estimated cost (₹)</div>
            <input
              style={input}
              type="number"
              min="0"
              required
              value={form.estimated_cost}
              onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
            />
          </label>
          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Destination (optional)</div>
            <input
              style={input}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </label>
          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Special requests (optional)</div>
            <textarea
              style={{ ...input, minHeight: 70 }}
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
            />
          </label>
          {error && <div style={{ color: "#dc2626" }}>{error}</div>}
          <button
            className="gotur-btn"
            style={{ background: BRAND, justifySelf: "start" }}
            disabled={busy}
          >
            {busy ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </Card>

      <Card title="Your bookings">
        {!bookings && !error && <div style={{ opacity: 0.6 }}>Loading…</div>}
        {bookings?.length === 0 && (
          <div style={{ opacity: 0.6 }}>No bookings yet.</div>
        )}
        {bookings?.map((b) => (
          <div key={b.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {humanize(b.type)}{" "}
                  <span style={{ fontFamily: "monospace", opacity: 0.6, fontWeight: 400 }}>
                    #{b.display_code}
                  </span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>
                  {fmtDate(b.created_at)} ·{" "}
                  {formatINR(b.final_cost > 0 ? b.final_cost : b.estimated_cost)}
                  {b.final_cost > 0 ? " (final)" : " (est.)"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <StatusBadge status={b.status} />
                <button
                  onClick={() => toggleDetails(b.id)}
                  style={{
                    border: "1px solid #ddd",
                    background: "#fff",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  {openId === b.id ? "Hide" : "Details"}
                </button>
                {CANCELLABLE(b.status) && (
                  <button
                    onClick={() => cancel(b.id)}
                    style={{
                      border: "1px solid #dc2626",
                      color: "#dc2626",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {openId === b.id && (
              <div
                style={{
                  background: "#faf9f7",
                  border: "1px solid #f0ede8",
                  borderRadius: 10,
                  padding: 16,
                  margin: "0 0 16px",
                  display: "grid",
                  gap: 14,
                }}
              >
                <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
                  <Row label="Status" value={humanize(b.status)} />
                  <Row label="Estimated cost" value={formatINR(b.estimated_cost)} />
                  {b.final_cost > 0 && (
                    <Row label="Final cost" value={formatINR(b.final_cost)} />
                  )}
                  {b.special_requests && (
                    <Row label="Special requests" value={b.special_requests} />
                  )}
                  {Object.entries(b.details || {}).map(([k, v]) => (
                    <Row key={k} label={humanize(k)} value={String(v)} />
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Documents
                  </div>
                  {!docsById[b.id] ? (
                    <div style={{ opacity: 0.6, fontSize: 13 }}>Loading…</div>
                  ) : docsById[b.id].length === 0 ? (
                    <div style={{ opacity: 0.6, fontSize: 13 }}>
                      No documents available yet. Tickets appear here once issued.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {docsById[b.id].map((d) => (
                        <div
                          key={d.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 8,
                            padding: "8px 12px",
                          }}
                        >
                          <span style={{ fontSize: 14 }}>
                            <strong>{humanize(d.kind)}</strong>
                            {d.label ? ` · ${d.label}` : ""}
                          </span>
                          <a
                            href={fileUrl(d.file_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gotur-btn"
                            style={{ background: BRAND, padding: "6px 14px" }}
                          >
                            View / Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ opacity: 0.6, minWidth: 130 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
