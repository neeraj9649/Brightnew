import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Layout/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { fileUrl } from "../services/storage";

// Customer Reward Redemption page: browse the catalog, redeem Wings, and track
// the status of every redemption (request -> approval -> voucher -> delivery).

const STATUS_META = {
  requested: { label: "Requested", color: "#b45309", bg: "#fef3c7" },
  approved: { label: "Approved", color: "#1d4ed8", bg: "#dbeafe" },
  voucher_issued: { label: "Voucher Issued", color: "#7c3aed", bg: "#ede9fe" },
  delivered: { label: "Delivered", color: "#047857", bg: "#d1fae5" },
  rejected: { label: "Rejected", color: "#b91c1c", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.requested;
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: m.color,
        background: m.bg,
      }}
    >
      {m.label}
    </span>
  );
};

const RewardsPage = () => {
  const { userData, refreshUser } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // id being acted on
  const balance = userData?.tokens ?? 0;

  const load = useCallback(async () => {
    try {
      const [items, redemptions] = await Promise.all([
        api.get("/redemptions/catalog"),
        api.get("/redemptions/me"),
      ]);
      setCatalog(items || []);
      setMine(redemptions || []);
    } catch (e) {
      toast.error(e.message || "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const redeem = async (item) => {
    if (balance < item.wings_cost) {
      toast.error("Not enough Wings for this reward");
      return;
    }
    setBusy(item.id);
    try {
      await api.post("/redemptions", { reward_item_id: item.id });
      toast.success(`Requested: ${item.name}`);
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      toast.error(e.message || "Redemption failed");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (r) => {
    if (!window.confirm(`Cancel your request for ${r.item_name}? Wings refunded.`))
      return;
    setBusy(r.id);
    try {
      await api.post(`/redemptions/${r.id}/cancel`);
      toast.success("Redemption cancelled, Wings refunded");
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      toast.error(e.message || "Cancel failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
              Redeem Your Wings
            </h1>
            <p style={{ color: "#64748b" }}>
              Turn your Wings into travel experiences.
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i className="fas fa-feather-pointed" />
            {balance.toLocaleString()} Wings
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading rewards…</p>
        ) : (
          <>
            {/* Catalog */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 16,
                marginBottom: 36,
              }}
            >
              {catalog.map((item) => {
                const afford = balance >= item.wings_cost;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: 130,
                        background: item.image_file_id
                          ? `url(${fileUrl(item.image_file_id)}) center/cover`
                          : "linear-gradient(135deg,#1f2937,#374151)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                      }}
                    >
                      {!item.image_file_id && (
                        <i className="fas fa-gift" style={{ fontSize: 34 }} />
                      )}
                    </div>
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1 }}>
                      {item.category && (
                        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>
                          {item.category}
                        </span>
                      )}
                      <h3 style={{ fontWeight: 700, color: "#0f172a", margin: "2px 0 6px" }}>
                        {item.name}
                      </h3>
                      {item.description && (
                        <p style={{ fontSize: 13, color: "#64748b", flex: 1 }}>
                          {item.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 12,
                        }}
                      >
                        <span style={{ fontWeight: 800, color: "#d97706" }}>
                          {item.wings_cost.toLocaleString()} Wings
                        </span>
                        <button
                          disabled={!afford || busy === item.id}
                          onClick={() => redeem(item)}
                          style={{
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 14px",
                            fontWeight: 700,
                            cursor: afford ? "pointer" : "not-allowed",
                            color: "#fff",
                            background: afford ? "#f59e0b" : "#cbd5e1",
                          }}
                        >
                          {busy === item.id ? "…" : afford ? "Redeem" : "Need more"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tracking */}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              My Redemptions
            </h2>
            {mine.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 28, textAlign: "center", color: "#94a3b8" }}>
                <i className="fas fa-receipt" style={{ fontSize: 28 }} />
                <p style={{ marginTop: 8 }}>No redemptions yet. Pick a reward above!</p>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                {mine.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "14px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.item_name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {r.wings_cost.toLocaleString()} Wings · {fmtDate(r.created_at)}
                        {r.voucher_code && (
                          <>
                            {" "}· Voucher:{" "}
                            <span style={{ fontFamily: "monospace", color: "#7c3aed", fontWeight: 700 }}>
                              {r.voucher_code}
                            </span>
                          </>
                        )}
                      </div>
                      {r.admin_note && (
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          Note: {r.admin_note}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <StatusBadge status={r.status} />
                      {r.status === "requested" && (
                        <button
                          disabled={busy === r.id}
                          onClick={() => cancel(r)}
                          style={{
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#b91c1c",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
