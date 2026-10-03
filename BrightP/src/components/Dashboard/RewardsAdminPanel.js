import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { fileUrl, uploadProfileImage, validateFile } from "../../services/storage";
import { cls, Badge, Spinner, EmptyState, ErrorState, humanize } from "./ui";

// Admin Reward Redemption management: a catalog editor (the redeemable rewards
// + their Wings cost) and the redemption queue (advance request -> approval ->
// voucher -> delivery, or reject with a refund).

const STATUS_FLOW = [
  "requested",
  "approved",
  "voucher_issued",
  "delivered",
  "rejected",
  "cancelled",
];

const statusColor = (s) =>
  ({
    requested: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    voucher_issued: "bg-violet-100 text-violet-700",
    delivered: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-200 text-gray-500",
  })[s] || "bg-gray-100 text-gray-700";

const EMPTY_ITEM = {
  name: "",
  category: "",
  description: "",
  wings_cost: "",
  image_file_id: "",
  is_active: true,
};

const RewardsAdminPanel = () => {
  // Employees can process the redemption queue; editing the catalog is
  // admin-only (the /admin/reward-items endpoints are ADMIN_ONLY server-side).
  const { isAdmin } = useAuth();
  const [view, setView] = useState("queue"); // queue | catalog
  const [redemptions, setRedemptions] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | {mode:"add"} | {mode:"edit", id}
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Wings-per-service config (admin-only). {welcome_bonus, first_booking, services:[{booking_type, points}]}
  const [pointsCfg, setPointsCfg] = useState(null);
  const [savingPoints, setSavingPoints] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const reds = await api.get("/admin/redemptions");
      setRedemptions(reds || []);
      // Catalog + Wings config are admin-only; employees skip them (403 otherwise).
      setItems(isAdmin ? (await api.get("/admin/reward-items")) || [] : []);
      setPointsCfg(isAdmin ? await api.get("/rewards/points-config") : null);
    } catch (e) {
      setError(e.message || "Failed to load");
      setRedemptions([]);
      setItems([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (r, status) => {
    if (status === r.status) return;
    let admin_note;
    if (status === "rejected") {
      admin_note = window.prompt("Reason for rejecting (optional):") || undefined;
    }
    try {
      await api.post(`/admin/redemptions/${r.id}/status`, { status, admin_note });
      toast.success(
        status === "rejected"
          ? "Rejected — Wings refunded"
          : status === "voucher_issued"
            ? "Voucher issued"
            : `Marked ${humanize(status)}`,
      );
      await load();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  const openAdd = () => {
    setForm(EMPTY_ITEM);
    setModal({ mode: "add" });
  };
  const openEdit = (it) => {
    setForm({
      name: it.name,
      category: it.category || "",
      description: it.description || "",
      wings_cost: String(it.wings_cost),
      image_file_id: it.image_file_id || "",
      is_active: it.is_active,
    });
    setModal({ mode: "edit", id: it.id });
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateFile(file, 5 * 1024 * 1024, ["image/jpeg", "image/png", "image/jpg"]);
      setUploading(true);
      const { file_id } = await uploadProfileImage(file); // reused: stores + returns id
      setForm((f) => ({ ...f, image_file_id: file_id }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitItem = async (e) => {
    e.preventDefault();
    const cost = parseInt(form.wings_cost, 10);
    if (!form.name.trim() || !cost || cost <= 0) {
      toast.error("Name and a positive Wings cost are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        wings_cost: cost,
        image_file_id: form.image_file_id || null,
        is_active: form.is_active,
      };
      if (modal.mode === "add") {
        await api.post("/admin/reward-items", payload);
        toast.success("Reward added");
      } else {
        await api.patch(`/admin/reward-items/${modal.id}`, payload);
        toast.success("Reward updated");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (it) => {
    try {
      await api.patch(`/admin/reward-items/${it.id}`, { is_active: !it.is_active });
      await load();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  const setSvcPoints = (bt, val) =>
    setPointsCfg((c) => ({
      ...c,
      services: c.services.map((s) =>
        s.booking_type === bt ? { ...s, points: val } : s,
      ),
    }));

  const savePoints = async () => {
    const norm = (n) => Math.max(0, parseInt(n, 10) || 0);
    const payload = {
      welcome_bonus: norm(pointsCfg.welcome_bonus),
      first_booking: norm(pointsCfg.first_booking),
      services: pointsCfg.services.map((s) => ({
        booking_type: s.booking_type,
        points: norm(s.points),
      })),
    };
    setSavingPoints(true);
    try {
      const updated = await api.put("/admin/points-config", payload);
      setPointsCfg(updated);
      toast.success("Wings config saved");
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSavingPoints(false);
    }
  };

  if (redemptions === null || items === null) return <Spinner label="Loading rewards…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const pending = redemptions.filter((r) => r.status === "requested").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Reward Redemptions</h2>
          <p className="text-sm text-gray-500">
            {pending} pending{isAdmin ? ` · ${items.length} catalog rewards` : ""}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              className={`${cls.btn} ${view === "queue" ? cls.btnPrimary : cls.btnOutline} ${cls.btnSm}`}
              onClick={() => setView("queue")}
            >
              <i className="fas fa-list-check" /> Queue
            </button>
            <button
              className={`${cls.btn} ${view === "catalog" ? cls.btnPrimary : cls.btnOutline} ${cls.btnSm}`}
              onClick={() => setView("catalog")}
            >
              <i className="fas fa-gift" /> Catalog
            </button>
            <button
              className={`${cls.btn} ${view === "points" ? cls.btnPrimary : cls.btnOutline} ${cls.btnSm}`}
              onClick={() => setView("points")}
            >
              <i className="fas fa-coins" /> Wings
            </button>
          </div>
        )}
      </div>

      {view === "queue" &&
        (redemptions.length === 0 ? (
          <EmptyState icon="fa-receipt" title="No redemptions yet" hint="Customer requests will appear here." />
        ) : (
          <div className={`${cls.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Reward</th>
                    <th className="px-4 py-3 text-center">Wings</th>
                    <th className="px-4 py-3">Voucher</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {redemptions.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{r.user_name}</div>
                        <div className="text-xs text-gray-400">
                          {r.membership_code} · {r.user_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.item_name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{r.wings_cost}</td>
                      <td className="px-4 py-3">
                        {r.voucher_code ? (
                          <span className="font-mono text-violet-700">{r.voucher_code}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor(r.status)}>{humanize(r.status)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {["delivered", "rejected", "cancelled"].includes(r.status) ? (
                          <span className="text-xs text-gray-400">closed</span>
                        ) : (
                          <select
                            className={cls.input}
                            value={r.status}
                            onChange={(e) => setStatus(r, e.target.value)}
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s} value={s}>
                                {humanize(s)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {view === "catalog" && (
        <>
          <div className="flex justify-end">
            <button className={`${cls.btn} ${cls.btnPrimary}`} onClick={openAdd}>
              <i className="fas fa-plus" /> Add Reward
            </button>
          </div>
          {items.length === 0 ? (
            <EmptyState icon="fa-gift" title="No rewards yet" hint="Add your first redeemable reward." />
          ) : (
            <div className={`${cls.card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Reward</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-center">Wings cost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((it) => (
                      <tr key={it.id} className={it.is_active ? "" : "bg-gray-50/70"}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {it.image_file_id ? (
                              <img
                                src={fileUrl(it.image_file_id)}
                                alt={it.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-400">
                                <i className="fas fa-gift" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-800">{it.name}</div>
                              {it.description && (
                                <div className="text-xs text-gray-400 line-clamp-1">
                                  {it.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{it.category || "—"}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-600">
                          {it.wings_cost}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={it.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}>
                            {it.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                              onClick={() => openEdit(it)}
                            >
                              <i className="fas fa-pen" /> Edit
                            </button>
                            <button
                              className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                              onClick={() => toggleActive(it)}
                            >
                              <i className={`fas ${it.is_active ? "fa-eye-slash" : "fa-eye"}`} />{" "}
                              {it.is_active ? "Hide" : "Show"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {view === "points" &&
        (!pointsCfg ? (
          <Spinner label="Loading Wings config…" />
        ) : (
          <div className={`${cls.card} space-y-5 p-5`}>
            <div>
              <h3 className="text-base font-bold text-gray-800">Wings per service</h3>
              <p className="text-sm text-gray-500">
                How many Wings each completed booking awards, plus the signup bonuses.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={cls.label}>Welcome bonus (on signup)</label>
                <input
                  type="number"
                  min="0"
                  className={cls.input}
                  value={pointsCfg.welcome_bonus}
                  onChange={(e) => setPointsCfg({ ...pointsCfg, welcome_bonus: e.target.value })}
                />
              </div>
              <div>
                <label className={cls.label}>First booking bonus</label>
                <input
                  type="number"
                  min="0"
                  className={cls.input}
                  value={pointsCfg.first_booking}
                  onChange={(e) => setPointsCfg({ ...pointsCfg, first_booking: e.target.value })}
                />
              </div>
            </div>
            <div>
              <div className={`${cls.label} mb-2`}>Per service (on completed booking)</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pointsCfg.services.map((s) => (
                  <div
                    key={s.booking_type}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">{humanize(s.booking_type)}</span>
                    <input
                      type="number"
                      min="0"
                      className={`${cls.input} w-24 text-right`}
                      value={s.points}
                      onChange={(e) => setSvcPoints(s.booking_type, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className={`${cls.btn} ${cls.btnPrimary}`}
                onClick={savePoints}
                disabled={savingPoints}
              >
                {savingPoints ? "Saving…" : "Save Wings config"}
              </button>
            </div>
          </div>
        ))}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !saving && setModal(null)}
        >
          <form
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitItem}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {modal.mode === "add" ? "Add Reward" : "Edit Reward"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className={cls.label}>Name</label>
                <input
                  className={cls.input}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cls.label}>Category</label>
                  <input
                    className={cls.input}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className={cls.label}>Wings cost</label>
                  <input
                    type="number"
                    min="1"
                    className={cls.input}
                    required
                    value={form.wings_cost}
                    onChange={(e) => setForm({ ...form, wings_cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={cls.label}>Description</label>
                <textarea
                  className={cls.input}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className={cls.label}>Image</label>
                <div className="flex items-center gap-3">
                  {form.image_file_id && (
                    <img
                      src={fileUrl(form.image_file_id)}
                      alt="reward"
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <input type="file" accept="image/*" onChange={onPickImage} disabled={uploading} />
                </div>
                {uploading && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active (visible to customers)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className={`${cls.btn} ${cls.btnOutline}`}
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className={`${cls.btn} ${cls.btnPrimary}`} disabled={saving || uploading}>
                {saving ? "Saving…" : modal.mode === "add" ? "Add Reward" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RewardsAdminPanel;
