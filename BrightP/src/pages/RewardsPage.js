import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Gift, Info, Search, X } from "lucide-react";
import Navbar from "../components/Layout/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { fileUrl } from "../services/storage";
import hotelReward from "../assets/travel/destination-beach.jpg";
import loungeReward from "../assets/travel/hero-coast.jpg";
import upgradeReward from "../assets/travel/cta.jpg";
import "../components/Layout/CustomerPortal.css";

const STATUS_META = {
  requested: { label: "Awaiting approval", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  voucher_issued: { label: "Voucher issued", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  rejected: { label: "Rejected · Wings refunded", tone: "error" },
  cancelled: { label: "Cancelled · Wings refunded", tone: "neutral" },
};

const FALLBACK_REWARDS = [
  { id: "hotel", name: "Hotel booking credit", category: "Stay", description: "₹500 credit on eligible hotel bookings.", wings_cost: 500, image: hotelReward },
  { id: "lounge", name: "Airport lounge voucher", category: "Travel", description: "Global lounge access for one visit.", wings_cost: 1000, image: loungeReward },
  { id: "upgrade", name: "Travel upgrade", category: "Travel", description: "Upgrade to the next cabin class, subject to availability.", wings_cost: 2000, image: upgradeReward },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status || "Requested", tone: "neutral" };
  return <span className={`bw-status ${meta.tone}`}>{meta.label}</span>;
};

function RewardImage({ item, className = "" }) {
  const image = item.image_file_id ? fileUrl(item.image_file_id) : item.image;
  return <div className={`bw-reward-image ${className}`} style={image ? { backgroundImage: `url(${image})` } : undefined} aria-label={item.name} role="img" />;
}

const RewardsPage = () => {
  const { userData, refreshUser } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const balance = Number(userData?.tokens ?? 0);

  const load = useCallback(async () => {
    try {
      const [items, redemptions] = await Promise.all([api.get("/redemptions/catalog"), api.get("/redemptions/me")]);
      setCatalog((items || []).map((item, index) => ({ ...item, image: FALLBACK_REWARDS[index % FALLBACK_REWARDS.length].image })));
      setMine(redemptions || []);
    } catch (error) {
      toast.error(error.message || "Unable to load rewards");
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rewards = catalog.length ? catalog : FALLBACK_REWARDS;
  const categories = useMemo(() => ["All", ...new Set(rewards.map((item) => item.category).filter(Boolean))], [rewards]);
  const filtered = rewards.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const haystack = `${item.name} ${item.description || ""} ${item.category || ""}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });

  const redeem = async () => {
    if (!selected || selected.id === "hotel" || selected.id === "lounge" || selected.id === "upgrade") {
      toast.error("This reward is illustrative until the catalog is configured by an administrator.");
      return;
    }
    if (balance < Number(selected.wings_cost)) {
      toast.error("You do not have enough available Wings for this reward.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the reward terms before continuing.");
      return;
    }
    setBusy(selected.id);
    try {
      await api.post("/redemptions", { reward_item_id: selected.id });
      toast.success("Redemption request submitted");
      setSelected(null);
      setAgreed(false);
      await Promise.all([load(), refreshUser()]);
    } catch (error) {
      toast.error(error.message || "Redemption failed");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (redemption) => {
    if (!window.confirm(`Cancel your request for ${redemption.item_name}? Your Wings will be refunded.`)) return;
    setBusy(redemption.id);
    try {
      await api.post(`/redemptions/${redemption.id}/cancel`);
      toast.success("Request cancelled and Wings refunded");
      await Promise.all([load(), refreshUser()]);
    } catch (error) {
      toast.error(error.message || "Could not cancel the request");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bw-app-shell">
      <Navbar />
      <main className="bw-page">
        <div className="bw-page-heading">
          <div><div className="bw-eyebrow">Wings marketplace</div><h1>Rewards catalog</h1><p>Turn your Wings into meaningful travel moments.</p></div>
          <div className="bw-balance-pill"><Gift size={18} /> <strong>{balance.toLocaleString("en-IN")}</strong> available Wings</div>
        </div>

        <section className="bw-card bw-info-banner"><Info size={20} /><span>Rewards are subject to availability and approval. Wings are reserved when you submit a request and refunded once if it is rejected.</span></section>

        <section className="bw-card bw-toolbar">
          <label className="bw-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rewards" aria-label="Search rewards" /></label>
          <div className="bw-chip-row" role="tablist" aria-label="Reward categories">
            {categories.map((item) => <button type="button" key={item} className={`bw-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </section>

        {loading ? <div className="bw-card bw-empty">Loading rewards…</div> : (
          <section className="bw-reward-grid" aria-label="Available rewards">
            {filtered.map((item) => {
              const affordable = balance >= Number(item.wings_cost);
              return <article className="bw-card bw-reward-card" key={item.id}>
                <RewardImage item={item} />
                <div className="bw-reward-card-body"><span className="bw-category-label">{item.category || "Travel"}</span><h3>{item.name}</h3><p>{item.description || "A Bright Wings reward for your next journey."}</p><div className="bw-reward-card-footer"><strong>{Number(item.wings_cost || 0).toLocaleString("en-IN")} Wings</strong><button type="button" className="bw-button secondary small" onClick={() => { setSelected(item); setAgreed(false); }}>{affordable ? "View reward" : "Not enough Wings"}</button></div></div>
              </article>;
            })}
            {!filtered.length && <div className="bw-card bw-empty">No rewards match those filters.</div>}
          </section>
        )}

        <section className="bw-card bw-redemption-panel"><div className="bw-section-heading"><div><div className="bw-eyebrow">Your requests</div><h2>Redemption history</h2></div><span className="bw-muted">{mine.length} total</span></div>
          {!mine.length ? <div className="bw-empty"><Gift size={28} /><p>No redemptions yet. Choose a reward above when you’re ready.</p></div> : <div className="bw-redemption-list">{mine.map((redemption) => <div className="bw-redemption-row" key={redemption.id}><div><strong>{redemption.item_name}</strong><span>{Number(redemption.wings_cost || 0).toLocaleString("en-IN")} Wings · {formatDate(redemption.created_at)}</span>{redemption.voucher_code && <span className="bw-voucher">Voucher: {redemption.voucher_code}</span>}</div><div className="bw-redemption-actions"><StatusBadge status={redemption.status} />{redemption.status === "requested" && <button type="button" className="bw-button ghost small" disabled={busy === redemption.id} onClick={() => cancel(redemption)}>{busy === redemption.id ? "Cancelling…" : "Cancel"}</button>}</div></div>)}</div>}
        </section>
      </main>

      {selected && <div className="bw-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="bw-modal bw-card" role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title" onClick={(event) => event.stopPropagation()}><button type="button" className="bw-icon-button bw-modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button><RewardImage item={selected} className="large" /><div className="bw-modal-content"><span className="bw-category-label">{selected.category || "Travel"}</span><h2 id="reward-dialog-title">{selected.name}</h2><p>{selected.description || "A Bright Wings reward for your next journey."}</p><div className="bw-modal-summary"><span>Reward cost</span><strong>{Number(selected.wings_cost || 0).toLocaleString("en-IN")} Wings</strong><span>Balance after request</span><strong>{Math.max(0, balance - Number(selected.wings_cost || 0)).toLocaleString("en-IN")} Wings</strong></div><label className="bw-check-row"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /> I agree to the eligibility, availability and usage terms for this reward.</label><button type="button" className="bw-button primary full" disabled={busy === selected.id || balance < Number(selected.wings_cost || 0)} onClick={redeem}>{busy === selected.id ? "Submitting…" : `Redeem for ${Number(selected.wings_cost || 0).toLocaleString("en-IN")} Wings`}</button><p className="bw-muted small-copy">Your available balance is debited at request submission. Approval does not debit again; rejection refunds once.</p></div></section></div>}
    </div>
  );
};

export default RewardsPage;
