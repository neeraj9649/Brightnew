import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import Navbar from "../components/Layout/Navbar";
import { useAdminBooking } from "../contexts/AdminBookingContext";
import { useCrm } from "../contexts/CrmContext";
import {
  cls,
  Badge,
  Spinner,
  EmptyState,
  bookingStatusColor,
  formatINR,
  humanize,
} from "../components/Dashboard/ui";

const BOOKING_TYPES = [
  "flight",
  "hotel",
  "tour",
  "visa",
  "airport_transfer",
  "cruise",
  "insurance",
  "activity",
  "car_rental",
  "custom",
];

const TABS = [
  { id: "detail", label: "Detail", icon: "fa-id-card" },
  { id: "bookings", label: "Bookings", icon: "fa-suitcase" },
  { id: "wings", label: "Wings History", icon: "fa-coins" },
  { id: "behalf", label: "Book on Behalf", icon: "fa-plus" },
];

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserDetails, getUserBookings, fetchUser, loading } =
    useAdminBooking();
  const [tab, setTab] = useState("detail");
  const [fetched, setFetched] = useState(null);

  const fromContext = getUserDetails(id);
  const user = fromContext || fetched;
  const bookings = getUserBookings(id);

  // Employees don't preload the user list — fetch the single customer.
  useEffect(() => {
    if (!fromContext) fetchUser(id).then(setFetched);
  }, [fromContext, id, fetchUser]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          {loading ? (
            <Spinner label="Loading customer…" />
          ) : (
            <EmptyState
              icon="fa-user-slash"
              title="Customer not found"
              hint="Open it from the Users list so it loads into the dashboard."
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-arrow-left" /> Back
          </button>

          {/* Header */}
          <div className={`${cls.card} mb-4 flex flex-wrap items-center justify-between gap-4 p-5`}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700">
                {(user.displayName || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {user.displayName || "Customer"}
                </h1>
                <p className="text-sm text-gray-500">
                  {user.profile?.phone}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge color="bg-amber-100 text-amber-800">
                    {user.membershipTier || "—"}
                  </Badge>
                  <span className="font-mono text-xs text-gray-400">
                    {user.membershipCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">
                {user.tokens || 0}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Wings balance
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className={cls.card}>
            <div className="flex flex-wrap gap-1 border-b border-gray-100 px-3 pt-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                    tab === t.id
                      ? "border-b-2 border-amber-500 text-amber-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <i className={`fas ${t.icon}`} /> {t.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === "detail" && <DetailTab user={user} />}
              {tab === "bookings" && <BookingsTab bookings={bookings} />}
              {tab === "wings" && <WingsTab userId={id} />}
              {tab === "behalf" && (
                <BehalfTab userId={id} onCreated={(b) => navigate(`/admin/bookings/${b.docId}`)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------------- Detail + token management ---------------- */
const Field = ({ label, value }) => (
  <div>
    <dt className={cls.label}>{label}</dt>
    <dd className="text-sm text-gray-800">{value || "—"}</dd>
  </div>
);

const DetailTab = ({ user }) => {
  const { addUserTokens, removeUserTokens } = useAdminBooking();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const adjust = async (sign) => {
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) return;
    setBusy(true);
    if (sign > 0) await addUserTokens(user.uid, amt, reason || "Admin Added");
    else await removeUserTokens(user.uid, amt, reason || "Admin Removed");
    setBusy(false);
    setAmount("");
    setReason("");
  };

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Phone" value={user.profile?.phone} />
        <Field label="Email" value={user.email} />
        <Field
          label="Date of birth"
          value={
            user.profile?.dateOfBirth
              ? format(new Date(user.profile.dateOfBirth), "MMM d, yyyy")
              : "—"
          }
        />
        <Field label="Membership tier" value={user.membershipTier} />
        <Field label="Membership code" value={user.membershipCode} />
        <Field label="Referral code" value={user.referralCode} />
        <Field label="Wings balance" value={user.tokens} />
        <Field label="Lifetime Wings" value={user.lifetimePointsEarned} />
        <Field label="Total bookings" value={user.totalBookings} />
        <Field label="Total spent" value={formatINR(user.totalSpent)} />
        <Field
          label="Joined"
          value={user.joinedAt ? format(new Date(user.joinedAt), "MMM d, yyyy") : "—"}
        />
      </dl>

      <div className={`${cls.card} p-4`}>
        <h3 className="mb-3 text-sm font-bold text-gray-700">
          Adjust Wings balance
        </h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className={cls.label}>Amount</label>
            <input
              type="number"
              className={cls.input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={cls.label}>Reason</label>
            <input
              className={cls.input}
              placeholder="e.g. Goodwill credit"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            onClick={() => adjust(1)}
            disabled={busy || !amount}
            className={`${cls.btn} ${cls.btnPrimary}`}
          >
            <i className="fas fa-plus" /> Add
          </button>
          <button
            onClick={() => adjust(-1)}
            disabled={busy || !amount}
            className={`${cls.btn} ${cls.btnDanger}`}
          >
            <i className="fas fa-minus" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Bookings ---------------- */
const BookingsTab = ({ bookings }) => {
  if (!bookings || bookings.length === 0) {
    return <EmptyState icon="fa-suitcase" title="No bookings yet" />;
  }
  return (
    <ul className="space-y-2">
      {bookings.map((b) => (
        <li key={b.docId}>
          <Link
            to={`/admin/bookings/${b.docId}`}
            className={`${cls.card} flex items-center justify-between gap-3 p-3 transition hover:border-amber-300 hover:shadow`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-gray-700">{b.id}</span>
                <Badge color="bg-gray-100 text-gray-600">
                  {humanize(b.type)}
                </Badge>
                <Badge color={bookingStatusColor(b.status)}>
                  {humanize(b.status)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {format(new Date(b.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">
                {formatINR(b.finalCost || b.estimatedCost || 0)}
              </p>
              <i className="fas fa-chevron-right text-gray-300" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

/* ---------------- Wings history ---------------- */
const WingsTab = ({ userId }) => {
  const { getUserWingsHistory } = useCrm();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setHistory(await getUserWingsHistory(userId));
    setLoading(false);
  }, [userId, getUserWingsHistory]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading Wings history…" />;
  if (history.length === 0)
    return <EmptyState icon="fa-coins" title="No Wings activity yet" />;

  return (
    <ul className="space-y-2">
      {history.map((h) => (
        <li
          key={h.id}
          className={`${cls.card} flex items-center justify-between gap-3 p-3`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Badge color="bg-gray-100 text-gray-600">
                {humanize(h.reason)}
              </Badge>
              <span className="text-sm text-gray-600">{h.description || ""}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {format(new Date(h.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <span
            className={`text-lg font-bold ${h.points >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {h.points >= 0 ? "+" : ""}
            {h.points}
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ---------------- Book on behalf ---------------- */
const BehalfTab = ({ userId, onCreated }) => {
  const { staffCreateBooking } = useAdminBooking();
  const [type, setType] = useState("flight");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const created = await staffCreateBooking({
      userId,
      type,
      estimatedCost,
      specialRequests,
      details: {},
    });
    setSaving(false);
    if (created) onCreated(created);
  };

  return (
    <form onSubmit={submit} className="max-w-lg space-y-3">
      <p className="text-sm text-gray-500">
        Create a booking request for this customer. You can add schedules,
        expenses and documents on the booking page afterwards.
      </p>
      <div>
        <label className={cls.label}>Service type</label>
        <select
          className={cls.input}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {BOOKING_TYPES.map((t) => (
            <option key={t} value={t}>
              {humanize(t)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={cls.label}>Estimated cost (₹)</label>
        <input
          type="number"
          className={cls.input}
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
        />
      </div>
      <div>
        <label className={cls.label}>Special requests</label>
        <textarea
          rows={3}
          className={cls.input}
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className={`${cls.btn} ${cls.btnPrimary}`}
      >
        <i className={`fas ${saving ? "fa-spinner fa-spin" : "fa-plus"}`} />
        Create booking
      </button>
    </form>
  );
};

export default AdminUserDetailPage;
