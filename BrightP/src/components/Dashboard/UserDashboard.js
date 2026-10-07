import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import { api } from "../../services/api";
import "../Layout/CustomerPortal.css";

const serviceNames = {
  flight: "Flight",
  hotel: "Hotel",
  car_rental: "Car rental",
  visa: "Visa",
  tour: "Tour package",
  cruise: "Cruise",
  custom: "Customized travel",
  airport_transfer: "Airport transfer",
  insurance: "Travel insurance",
  activity: "Activity tickets",
};

const tierSteps = [
  ["Silver", 0, "fa-feather-pointed"],
  ["Gold", 1000, "fa-crown"],
  ["Platinum", 5000, "fa-gem"],
  ["Titanium", 20000, "fa-diamond"],
];

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date to be confirmed";
const title = (value) => serviceNames[value] || String(value || "Travel request").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function Status({ value }) {
  const kind = ["completed", "booking_confirmed"].includes(value) ? "" : value === "cancelled" ? "danger" : value === "new" || value === "assigned" ? "pending" : "info";
  return <span className={`bw-status ${kind}`}><i className="fas fa-circle" style={{ fontSize: 5 }} /> {String(value || "Requested").replace(/_/g, " ")}</span>;
}

function TierProgress({ tier, onOpen }) {
  const current = tier?.current || "Silver";
  const next = tier?.next_tier;
  const threshold = tier?.next_threshold || 0;
  const lifetime = Number(tier?.lifetime_wings || 0);
  const remaining = Math.max(0, threshold - lifetime);
  return (
    <section className="bw-card bw-tier-card">
      <div className="bw-card-heading">
        <div><h2>Your tier progress</h2><p>Tier is based on lifetime Wings and never decreases.</p></div>
        <button className="bw-text-link" onClick={onOpen}>View benefits <i className="fas fa-arrow-right" /></button>
      </div>
      <div className="bw-tier-track">
        {tierSteps.map(([name, value, icon]) => (
          <div className={`bw-tier-node ${name === current ? "active" : value < (tierSteps.find(([tierName]) => tierName === current)?.[1] || 0) ? "active" : ""}`} key={name}>
            <span className="dot"><i className={`fas ${icon}`} /></span><span>{name}</span><small>{value.toLocaleString("en-IN") || "Starting"}</small>
          </div>
        ))}
      </div>
      <div className="bw-tier-copy"><span><strong>{current} member</strong> · {lifetime.toLocaleString("en-IN")} lifetime Wings</span><span>{next ? `${remaining.toLocaleString("en-IN")} to ${next}` : "Highest tier"}</span></div>
      <div className="bw-progress" style={{ marginTop: 12, background: "#e9eceb" }}><span style={{ width: `${tier?.progress_percent || 100}%`, background: "linear-gradient(90deg,#c9963e,#e3bb62)" }} /></div>
    </section>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { bookings, loading: bookingsLoading, loadUserBookings } = useBooking();
  const [summary, setSummary] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get("/loyalty/summary").then(setSummary).catch(() => {});
    api.get("/rewards/points-config").then(setConfig).catch(() => {});
    if (userData) loadUserBookings();
    // Provider refresh is intentionally tied to the authenticated member.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const memberName = summary?.member?.name || userData?.displayName || "Traveler";
  const balance = Number(summary?.balance ?? userData?.tokens ?? 0);
  const lifetime = Number(summary?.tier?.lifetime_wings ?? userData?.lifetimePointsEarned ?? 0);
  const tier = summary?.tier || { current: userData?.membershipTier || "Silver", lifetime_wings: lifetime, progress_percent: 0 };
  const upcoming = useMemo(() => (bookings || []).filter((item) => item.status !== "cancelled" && item.status !== "completed").slice(0, 2), [bookings]);
  const rewards = (summary?.catalog || []).slice(0, 3);

  return (
    <div className="bw-portal-root">
      <Navbar />
      <main className="bw-page">
        <div className="bw-page-inner">
          <section className="bw-hero">
            <div className="bw-hero-content">
              <div>
                <div className="bw-eyebrow">Member home · Bright Wings</div>
                <h1>Good morning,<br />{memberName}</h1>
                <p>More journeys. Brighter rewards. Keep your next adventure moving with a travel advisor who knows what matters to you.</p>
                <div className="bw-hero-actions">
                  <button className="bw-primary-button" style={{ background: "#fff", color: "#10283f", borderColor: "#fff" }} onClick={() => navigate("/bookings?new=1")}><i className="fas fa-plane-departure" /> Book a trip</button>
                  <button className="bw-secondary-button" onClick={() => navigate("/membership")}><i className="fas fa-id-card" /> Membership card</button>
                </div>
              </div>
              <div className="bw-gold-badge"><i className="fas fa-crown" /> {tier.current || "Silver"} member</div>
            </div>
          </section>

          <div className="bw-dashboard-grid">
            <div className="bw-dashboard-primary">
              <section className="bw-balance-card">
                <div className="bw-balance-top"><div><div className="bw-balance-label">Your available Wings</div><div className="bw-balance-value">{balance.toLocaleString("en-IN")} <span style={{ fontSize: 18, letterSpacing: 0 }}>Wings</span></div></div><i className="fas fa-coins" style={{ color: "#edc878", fontSize: 28 }} /></div>
                <div className="bw-balance-bottom"><div><strong>{lifetime.toLocaleString("en-IN")}</strong><small>Lifetime Wings</small></div><button className="bw-secondary-button" onClick={() => navigate("/rewards")}><i className="fas fa-arrow-right" /> View wallet</button></div>
              </section>

              <TierProgress tier={tier} onOpen={() => navigate("/tier-benefits")} />

              <section className="bw-card bw-card-pad">
                <div className="bw-card-heading"><div><h2>Plan your next journey</h2><p>Choose a service and request a quote from our travel advisors.</p></div><button className="bw-text-link" onClick={() => navigate("/bookings?new=1")}>Start booking <i className="fas fa-arrow-right" /></button></div>
                <div className="bw-action-grid">
                  {[["fa-plane", "Flight", "100 Wings", "flight"], ["fa-hotel", "Hotel", "100 Wings", "hotel"], ["fa-car", "Car rental", "100 Wings", "car_rental"], ["fa-passport", "Visa", "200 Wings", "visa"]].map(([icon, label, earn, type]) => <button className="bw-action-card" key={type} onClick={() => navigate(`/bookings?service=${type}`)}><i className={`fas ${icon}`} /><strong>{label}</strong><small>Earn {earn}</small></button>)}
                </div>
              </section>

              <section className="bw-card bw-card-pad">
                <div className="bw-card-heading"><div><h2>Upcoming journeys</h2><p>Track your requests, quotes, and confirmed trips.</p></div><button className="bw-text-link" onClick={() => navigate("/bookings")}>View all <i className="fas fa-arrow-right" /></button></div>
                {bookingsLoading ? <div className="bw-empty"><i className="fas fa-spinner fa-spin" /> Loading your journeys…</div> : upcoming.length === 0 ? <div className="bw-empty"><i className="fas fa-suitcase-rolling" /><div>No upcoming journeys yet.</div><button className="bw-text-link" onClick={() => navigate("/bookings?new=1")}>Start a booking request</button></div> : <div className="bw-booking-list">{upcoming.map((booking) => <button className="bw-booking-row" key={booking.docId || booking.id} onClick={() => navigate(`/bookings/${booking.docId}`)}><span className="bw-booking-thumb" /><span className="bw-booking-meta"><strong>{booking.type === "flight" ? `${booking.from || "Departure"} → ${booking.to || "Destination"}` : booking.destination || title(booking.type)}</strong><small>{title(booking.type)} · {date(booking.departureDate || booking.checkIn || booking.startDate || booking.createdAt)} · {booking.id}</small></span><Status value={booking.status} /><i className="fas fa-chevron-right" style={{ color: "#a2acb6" }} /></button>)}</div>}
              </section>
            </div>

            <aside className="bw-dashboard-side">
              <section className="bw-card bw-card-pad">
                <div className="bw-card-heading"><div><h2>Member shortcuts</h2><p>Everything you need in one place.</p></div></div>
                <div style={{ display: "grid", gap: 9 }}>
                  {[["fa-wallet", "Wings wallet", "/rewards"], ["fa-user-group", "Refer a friend", "/referrals"], ["fa-bell", "Notifications", "/notifications"], ["fa-circle-question", "Help & support", "/support"]].map(([icon, label, path]) => <button className="bw-secondary-button" style={{ justifyContent: "space-between" }} key={path} onClick={() => navigate(path)}><span><i className={`fas ${icon}`} style={{ width: 22, color: "#c9963e" }} /> {label}</span><i className="fas fa-arrow-right" /></button>)}
                </div>
              </section>

              <section className="bw-card bw-card-pad">
                <div className="bw-card-heading"><div><h2>Featured rewards</h2><p>Use Wings for brighter moments.</p></div><button className="bw-text-link" onClick={() => navigate("/rewards")}>See all</button></div>
                {rewards.length === 0 ? <div className="bw-empty"><i className="fas fa-gift" />Rewards will appear here.</div> : <div className="bw-reward-grid">{rewards.map((reward) => <button className="bw-reward-card" key={reward.id} onClick={() => navigate("/rewards")}><div className="bw-reward-image" /><div className="bw-reward-content"><strong>{reward.name}</strong><small>{reward.description || "A member-only travel benefit."}</small><span className="bw-reward-cost"><i className="fas fa-coins" /> {Number(reward.wings_cost || 0).toLocaleString("en-IN")} Wings</span></div></button>)}</div>}
              </section>

              <section className="bw-card bw-card-pad">
                <div className="bw-card-heading"><div><h2>How you earn</h2><p>Credits are awarded after a booking is completed.</p></div><i className="fas fa-circle-info" style={{ color: "#2b6f9f" }} /></div>
                <div className="bw-inline-alert gold"><i className="fas fa-gift" /> <span><strong>{config?.welcome_bonus || 200} Wings</strong> welcome bonus<br /><strong>{config?.first_booking || 300} Wings</strong> first completed booking bonus when eligible.</span></div>
                <button className="bw-text-link" style={{ marginTop: 14 }} onClick={() => navigate("/rewards")}>View all earning rules <i className="fas fa-arrow-right" /></button>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
