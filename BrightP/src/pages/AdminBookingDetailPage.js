import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import Navbar from "../components/Layout/Navbar";
import { useAdminBooking } from "../contexts/AdminBookingContext";
import { useCrm } from "../contexts/CrmContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { fileUrl } from "../services/storage";
import {
  cls,
  Badge,
  Spinner,
  EmptyState,
  bookingStatusColor,
  taskStatusColor,
  formatINR,
  humanize,
} from "../components/Dashboard/ui";

const STATUSES = [
  "new",
  "assigned",
  "contacted",
  "awaiting_approval",
  "awaiting_payment",
  "payment_received",
  "booking_confirmed",
  "completed",
  "cancelled",
];
const PAYMENT_STATUSES = ["pending", "paid", "refunded", "cancelled"];
const EXPENSE_CATEGORIES = ["flight", "hotel", "cab", "visa", "activity", "other"];
const DOC_KINDS = ["ticket", "voucher", "invoice", "quotation", "other"];

const TABS = [
  { id: "schedule", label: "Schedules & Expenses", icon: "fa-route" },
  { id: "documents", label: "Documents", icon: "fa-paperclip" },
  { id: "notes", label: "Notes", icon: "fa-note-sticky" },
  { id: "followups", label: "Follow-ups", icon: "fa-list-check" },
];

const AdminBookingDetailPage = () => {
  const { id } = useParams(); // docId (uuid)
  const navigate = useNavigate();
  const { getBookingByDocId, updateBookingStatus, employees, loading } =
    useAdminBooking();
  const { listExpenses } = useCrm();
  const [tab, setTab] = useState("schedule");
  const [expenses, setExpenses] = useState([]);

  const booking = getBookingByDocId(id);

  const reloadExpenses = useCallback(async () => {
    if (!id) return;
    setExpenses(await listExpenses(id));
  }, [id, listExpenses]);

  useEffect(() => {
    reloadExpenses();
  }, [reloadExpenses]);

  const expenseTotal = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses],
  );

  if (!booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          {loading ? (
            <Spinner label="Loading booking…" />
          ) : (
            <EmptyState
              icon="fa-circle-question"
              title="Booking not found"
              hint="It may not be loaded yet — go back and open it from the list."
            />
          )}
        </div>
      </>
    );
  }

  const revenue = Number(booking.finalCost || 0);
  const profit = revenue - expenseTotal;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-arrow-left" /> Back
          </button>

          {/* Header */}
          <div className={`${cls.card} mb-4 overflow-hidden`}>
            <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm opacity-90">
                    {booking.id}
                  </span>
                  <Badge color="bg-white/20 text-white">
                    {humanize(booking.type)}
                  </Badge>
                  <Badge color={bookingStatusColor(booking.status)}>
                    {humanize(booking.status)}
                  </Badge>
                </div>
                <h1 className="mt-2 text-xl font-bold">
                  {booking.userName || "Customer"}
                </h1>
                <p className="text-sm opacity-90">
                  {booking.userPhone && (
                    <span className="mr-3">
                      <i className="fas fa-phone mr-1" />
                      {booking.userPhone}
                    </span>
                  )}
                  {booking.userId && (
                    <Link
                      to={`/admin/users/${booking.userId}`}
                      className="underline decoration-white/50 hover:decoration-white"
                    >
                      View customer
                    </Link>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide opacity-80">
                  Created
                </p>
                <p className="text-sm">
                  {format(new Date(booking.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Status editor + PnL */}
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <StatusEditor
                booking={booking}
                employees={employees}
                onSave={updateBookingStatus}
              />
              <PnlCard revenue={revenue} expense={expenseTotal} profit={profit} />
            </div>

            {booking.specialRequests && (
              <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-700">
                  Special requests:{" "}
                </span>
                {booking.specialRequests}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className={`${cls.card}`}>
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
              {tab === "schedule" && (
                <ExpensesTab
                  bookingId={id}
                  expenses={expenses}
                  onChanged={reloadExpenses}
                />
              )}
              {tab === "documents" && <DocumentsTab bookingId={id} />}
              {tab === "notes" && <NotesTab bookingId={id} />}
              {tab === "followups" && <FollowupsTab booking={booking} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------------- Status editor ---------------- */
const StatusEditor = ({ booking, employees, onSave }) => {
  const [status, setStatus] = useState(booking.status);
  const [finalCost, setFinalCost] = useState(booking.finalCost || 0);
  const [paymentStatus, setPaymentStatus] = useState(
    booking.paymentStatus || "pending",
  );
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    booking.assignedEmployeeId || "",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(booking.id, {
      status,
      finalCost: Number(finalCost) || 0,
      paymentStatus,
      assignedEmployeeId: assignedEmployeeId || undefined,
    });
    setSaving(false);
  };

  return (
    <div className={`${cls.card} p-4`}>
      <h3 className="mb-3 text-sm font-bold text-gray-700">Manage</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={cls.label}>Status</label>
          <select
            className={cls.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cls.label}>Payment</label>
          <select
            className={cls.input}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cls.label}>Final cost (₹)</label>
          <input
            type="number"
            className={cls.input}
            value={finalCost}
            onChange={(e) => setFinalCost(e.target.value)}
          />
        </div>
        {employees && employees.length > 0 && (
          <div>
            <label className={cls.label}>Assigned</label>
            <select
              className={cls.input}
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {employees.map((e) => (
                <option key={e.uid} value={e.uid}>
                  {e.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className={`${cls.btn} ${cls.btnPrimary} ${cls.btnSm} mt-3`}
      >
        <i className={`fas ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
        Save changes
      </button>
    </div>
  );
};

/* ---------------- PnL card (staff only) ---------------- */
const PnlCard = ({ revenue, expense, profit }) => (
  <div className={`${cls.card} p-4`}>
    <h3 className="mb-3 text-sm font-bold text-gray-700">
      Profit &amp; Loss
    </h3>
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-gray-500">Revenue (final cost)</dt>
        <dd className="font-semibold text-gray-800">{formatINR(revenue)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-gray-500">Expenses (package cost)</dt>
        <dd className="font-semibold text-gray-800">{formatINR(expense)}</dd>
      </div>
      <div className="flex justify-between border-t border-gray-100 pt-2">
        <dt className="font-semibold text-gray-700">Profit</dt>
        <dd
          className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
        >
          {formatINR(profit)}
        </dd>
      </div>
    </dl>
  </div>
);

/* ---------------- Schedules & Expenses ---------------- */
const emptyExpense = {
  category: "hotel",
  amount: "",
  vendor: "",
  description: "",
  startDate: "",
  endDate: "",
};
const ExpensesTab = ({ bookingId, expenses, onChanged }) => {
  const { addExpense, deleteExpense } = useCrm();
  const [form, setForm] = useState(emptyExpense);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    const res = await addExpense({ bookingId, ...form });
    setSaving(false);
    if (res) {
      setForm(emptyExpense);
      onChanged();
    }
  };

  const remove = async (id) => {
    if (await deleteExpense(id)) onChanged();
  };

  // group by category
  const groups = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    items: expenses.filter((e) => e.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <form
        onSubmit={submit}
        className="mb-5 grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-3"
      >
        <select
          className={cls.input}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {humanize(c)}
            </option>
          ))}
        </select>
        <input
          className={cls.input}
          type="number"
          placeholder="Amount (₹) *"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className={cls.input}
          placeholder="Vendor"
          value={form.vendor}
          onChange={(e) => setForm({ ...form, vendor: e.target.value })}
        />
        <input
          className={`${cls.input} sm:col-span-3`}
          placeholder="Description (e.g. 2 nights, DXB→DEL leg)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="text-xs text-gray-500">
          From
          <input
            type="date"
            className={cls.input}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </label>
        <label className="text-xs text-gray-500">
          To
          <input
            type="date"
            className={cls.input}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={saving || !form.amount}
          className={`${cls.btn} ${cls.btnPrimary} self-end`}
        >
          <i className="fas fa-plus" /> Add line
        </button>
      </form>

      {groups.length === 0 ? (
        <EmptyState
          icon="fa-route"
          title="No schedule or expense lines yet"
          hint="Add cab/hotel/flight legs — dated lines double as the itinerary."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.cat}>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {humanize(g.cat)} ({g.items.length})
              </h4>
              <ul className="space-y-2">
                {g.items.map((e) => (
                  <li
                    key={e.id}
                    className={`${cls.card} flex items-start justify-between gap-3 p-3`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {formatINR(e.amount)}
                        </span>
                        {e.vendor && (
                          <Badge color="bg-gray-100 text-gray-600">
                            {e.vendor}
                          </Badge>
                        )}
                      </div>
                      {e.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {e.description}
                        </p>
                      )}
                      {(e.startDate || e.endDate) && (
                        <p className="mt-1 text-xs text-gray-400">
                          <i className="far fa-calendar mr-1" />
                          {e.startDate
                            ? format(new Date(e.startDate), "MMM d")
                            : "—"}
                          {e.endDate
                            ? ` → ${format(new Date(e.endDate), "MMM d, yyyy")}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(e.id)}
                      className={`${cls.btn} ${cls.btnDanger} ${cls.btnSm} shrink-0`}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Documents ---------------- */
const DocumentsTab = ({ bookingId }) => {
  const { listDocuments, addDocument, deleteDocument } = useCrm();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("ticket");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDocs(await listDocuments(bookingId));
    setLoading(false);
  }, [bookingId, listDocuments]);

  useEffect(() => {
    load();
  }, [load]);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { file_id } = await api.upload("/uploads/booking-document", fd);
      const doc = await addDocument({
        bookingId,
        kind,
        fileId: file_id,
        label: file.name,
      });
      if (doc) setDocs((prev) => [doc, ...prev]);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (id) => {
    if (await deleteDocument(id)) setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label className={cls.label}>Type</label>
          <select
            className={cls.input}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {DOC_KINDS.map((k) => (
              <option key={k} value={k}>
                {humanize(k)}
              </option>
            ))}
          </select>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={onPick}
          disabled={uploading}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`${cls.btn} ${cls.btnPrimary}`}
        >
          <i className={`fas ${uploading ? "fa-spinner fa-spin" : "fa-upload"}`} />
          {uploading ? "Uploading…" : "Upload document"}
        </button>
        <p className="text-xs text-gray-400">
          Tickets / vouchers / invoices are visible to the customer.
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading documents…" />
      ) : docs.length === 0 ? (
        <EmptyState icon="fa-paperclip" title="No documents attached" />
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className={`${cls.card} flex items-center justify-between gap-3 p-3`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <i className="fas fa-file text-amber-500" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color="bg-amber-100 text-amber-800">
                      {humanize(d.kind)}
                    </Badge>
                    <span className="truncate text-sm text-gray-700">
                      {d.label || "Document"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(d.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={fileUrl(d.fileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                >
                  <i className="fas fa-eye" /> View
                </a>
                <a
                  href={fileUrl(d.fileId)}
                  download
                  className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                >
                  <i className="fas fa-download" />
                </a>
                <button
                  onClick={() => remove(d.id)}
                  className={`${cls.btn} ${cls.btnDanger} ${cls.btnSm}`}
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ---------------- Notes (communication + support) ---------------- */
const NotesTab = ({ bookingId }) => {
  const { listNotes, addNote } = useCrm();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [noteType, setNoteType] = useState("communication");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotes(await listNotes(bookingId));
    setLoading(false);
  }, [bookingId, listNotes]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const note = await addNote(bookingId, text.trim(), noteType);
    setSaving(false);
    if (note) {
      setNotes((prev) => [note, ...prev]);
      setText("");
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex flex-col gap-2">
        <textarea
          rows={2}
          className={cls.input}
          placeholder="Communication or support note…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <select
            className={`${cls.input} max-w-[200px]`}
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
          >
            <option value="communication">Communication</option>
            <option value="support">Support</option>
          </select>
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className={`${cls.btn} ${cls.btnPrimary}`}
          >
            <i className="fas fa-plus" /> Add note
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner label="Loading notes…" />
      ) : notes.length === 0 ? (
        <EmptyState icon="fa-note-sticky" title="No notes yet" />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className={`${cls.card} p-3`}>
              <div className="mb-1">
                <Badge
                  color={
                    n.noteType === "support"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-sky-100 text-sky-700"
                  }
                >
                  {humanize(n.noteType)}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{n.note}</p>
              <p className="mt-1 text-xs text-gray-400">
                {format(new Date(n.createdAt), "MMM d, yyyy h:mm a")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ---------------- Follow-ups (tasks) ---------------- */
const emptyTask = { title: "", description: "", dueAt: "" };
const FollowupsTab = ({ booking }) => {
  const { listTasksForBooking, createTask, completeTask, cancelTask } = useCrm();
  const { userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyTask);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setTasks(await listTasksForBooking(booking.docId));
    setLoading(false);
  }, [booking.docId, listTasksForBooking]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const task = await createTask({
      bookingId: booking.docId,
      assignedTo: booking.assignedEmployeeId || userData?.uid,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
    });
    setSaving(false);
    if (task) {
      setTasks((prev) => [task, ...prev]);
      setForm(emptyTask);
    }
  };

  const mutate = (u) =>
    u && setTasks((prev) => prev.map((t) => (t.id === u.id ? u : t)));

  return (
    <div>
      <form onSubmit={submit} className="mb-4 grid gap-2 sm:grid-cols-2">
        <input
          className={cls.input}
          placeholder="Follow-up title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="datetime-local"
          className={cls.input}
          value={form.dueAt}
          onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
        />
        <input
          className={`${cls.input} sm:col-span-2`}
          placeholder="Notes (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className={`${cls.btn} ${cls.btnPrimary} sm:col-span-2`}
        >
          <i className="fas fa-plus" /> Schedule follow-up
        </button>
      </form>

      {loading ? (
        <Spinner label="Loading follow-ups…" />
      ) : tasks.length === 0 ? (
        <EmptyState icon="fa-list-check" title="No follow-ups scheduled" />
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const overdue =
              t.status === "pending" && t.dueAt && isPast(new Date(t.dueAt));
            return (
              <li
                key={t.id}
                className={`${cls.card} flex items-start justify-between gap-3 p-3`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-800">{t.title}</span>
                    <Badge color={taskStatusColor(t.status)}>
                      {humanize(t.status)}
                    </Badge>
                    {overdue && (
                      <Badge color="bg-red-100 text-red-700">Overdue</Badge>
                    )}
                  </div>
                  {t.description && (
                    <p className="mt-1 text-sm text-gray-600">{t.description}</p>
                  )}
                  {t.dueAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      <i className="far fa-clock mr-1" />
                      {format(new Date(t.dueAt), "MMM d, yyyy h:mm a")}
                    </p>
                  )}
                </div>
                {t.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={async () => mutate(await completeTask(t.id))}
                      className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm} !text-emerald-600`}
                    >
                      <i className="fas fa-check" /> Done
                    </button>
                    <button
                      onClick={async () => mutate(await cancelTask(t.id))}
                      className={`${cls.btn} ${cls.btnDanger} ${cls.btnSm}`}
                    >
                      <i className="fas fa-xmark" /> Cancel
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminBookingDetailPage;
