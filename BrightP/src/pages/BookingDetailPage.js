import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Layout/Navbar";
import { useBooking } from "../contexts/BookingContext";
import { api } from "../services/api";
import "../components/Layout/CustomerPortal.css";

const stages = ["new", "assigned", "contacted", "awaiting_approval", "awaiting_payment", "payment_received", "booking_confirmed", "completed"];
const labels = { new: "Requested", assigned: "Assigned", contacted: "Advisor contacted", awaiting_approval: "Quote ready", awaiting_payment: "Awaiting payment", payment_received: "Payment received", booking_confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };
const humanize = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, cancelBooking, loadUserBookings } = useBooking();
  const [booking, setBooking] = useState(bookings.find((item) => item.docId === id) || null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const value = await api.get(`/bookings/${id}`);
        if (live) setBooking({ docId: value.id, id: value.display_code, type: value.type, status: value.status, estimatedCost: value.estimated_cost, finalCost: value.final_cost, specialRequests: value.special_requests, createdAt: value.created_at, updatedAt: value.updated_at, ...value.details });
        const docs = await api.get(`/bookings/${id}/documents`).catch(() => []);
        if (live) setDocuments(docs || []);
      } catch { if (live) toast.error("We could not load this booking"); } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [id]);

  const stageIndex = useMemo(() => Math.max(0, stages.indexOf(booking?.status)), [booking]);
  if (loading) return <><Navbar /><main className="bw-page"><div className="bw-empty"><i className="fas fa-spinner fa-spin" /> Loading booking…</div></main></>;
  if (!booking) return <><Navbar /><main className="bw-page"><div className="bw-empty"><i className="fas fa-suitcase-rolling" /><h2>Booking not found</h2><button className="bw-secondary-button" onClick={() => navigate("/bookings")}>Back to bookings</button></div></main></>;

  const title = booking.type === "flight" ? `${booking.from || "Departure"} → ${booking.to || "Destination"}` : booking.destination || humanize(booking.type);
  const dateValue = booking.departureDate || booking.checkIn || booking.startDate || booking.travelDate;
  return <div className="bw-portal-root"><Navbar /><main className="bw-page"><div className="bw-page-inner"><button className="bw-text-link" onClick={() => navigate("/bookings")}><i className="fas fa-arrow-left" /> Back to bookings</button><div className="bw-page-heading" style={{ marginTop: 16 }}><div><div className="bw-eyebrow">Booking details · {booking.id}</div><h1>{title}</h1><p>{humanize(booking.type)} request · Created {fmtDate(booking.createdAt)}</p></div><span className="bw-status info">{labels[booking.status] || humanize(booking.status)}</span></div><div className="bw-dashboard-grid"><div className="bw-dashboard-primary"><section className="bw-card bw-card-pad"><div className="bw-card-heading"><div><h2>Your journey status</h2><p>We will update you as your travel advisor progresses the request.</p></div></div><div className="bw-tier-track" style={{ marginTop: 12 }}>{stages.map((stage, index) => <div className={`bw-tier-node ${index <= stageIndex ? "active" : ""}`} key={stage}><span className="dot">{index < stageIndex ? <i className="fas fa-check" /> : index === stageIndex ? <i className="fas fa-circle" style={{ fontSize: 9 }} /> : <span />}</span><span>{labels[stage]}</span><small>{index <= stageIndex ? fmtDate(booking.updatedAt || booking.createdAt) : "Pending"}</small></div>)}</div>{booking.status === "cancelled" && <div className="bw-inline-alert" style={{ background: "#fae9e6", color: "#9d4d44", marginTop: 14 }}><i className="fas fa-circle-xmark" /><span>This booking request was cancelled. Contact support if you need help starting a new journey.</span></div>}</section><section className="bw-card bw-card-pad"><div className="bw-card-heading"><div><h2>Request summary</h2><p>Details sent to your travel advisor.</p></div></div><div className="bw-form-grid">{[["Service", humanize(booking.type)], ["Travel date", fmtDate(dateValue)], ["Travellers", booking.travelers || booking.passengers || booking.guests || "To be confirmed"], ["Estimated Wings", booking.type === "flight" ? "100 Wings after completion" : "Based on completed service"], ["Special requests", booking.specialRequests || "None added"]].map(([label, value]) => <div className="bw-field" key={label}><label>{label}</label><div style={{ minHeight: 46, padding: "13px", borderRadius: 10, background: "#f8f7f3", color: "#526174", fontSize: 12 }}>{String(value)}</div></div>)}</div></section>{documents.length > 0 && <section className="bw-card bw-card-pad"><div className="bw-card-heading"><div><h2>Documents</h2><p>Files shared by your travel advisor.</p></div></div>{documents.map((doc) => <a key={doc.id} href={doc.file_url || "#"} target="_blank" rel="noreferrer" className="bw-secondary-button" style={{ justifyContent: "space-between", marginBottom: 8 }}><span><i className="fas fa-file-lines" /> {doc.label || doc.kind || "Booking document"}</span><i className="fas fa-arrow-up-right-from-square" /></a>)}</section>}</div><aside className="bw-dashboard-side"><section className="bw-card bw-card-pad"><div className="bw-card-heading"><div><h2>Quote snapshot</h2><p>Pricing is confirmed by your travel advisor.</p></div></div><div style={{ display: "flex", justifyContent: "space-between", gap: 15, padding: "13px 0", borderBottom: "1px solid #f0ece4", color: "#6b7888", fontSize: 12 }}><span>Estimated amount</span><strong style={{ color: "#10283f", fontSize: 20 }}>₹{Number(booking.finalCost || booking.estimatedCost || 0).toLocaleString("en-IN")}</strong></div><div className="bw-inline-alert gold" style={{ marginTop: 15 }}><i className="fas fa-clock" /><span>No payment is required at request stage. A quotation will appear here when your advisor sends one.</span></div></section><section className="bw-card bw-card-pad"><div className="bw-card-heading"><div><h2>Need a change?</h2><p>We are here to help with your request.</p></div></div><div style={{ display: "grid", gap: 9 }}>{booking.status !== "completed" && booking.status !== "cancelled" && <button className="bw-secondary-button" onClick={async () => { await cancelBooking(booking.id); await loadUserBookings(); navigate("/bookings"); }}><i className="fas fa-ban" /> Cancel request</button>}<button className="bw-primary-button" onClick={() => navigate("/support")}><i className="fas fa-headset" /> Contact support</button></div></section></aside></div></div></main></div>;
}
