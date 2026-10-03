import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { cls, Badge, Spinner, EmptyState, ErrorState } from "./ui";
import PinInput from "../Common/PinInput";

// Admin-only Employees tab: list employees with their workload, add a new
// employee, edit their details, and toggle active/inactive. Self-contained --
// fetches its own data so it doesn't widen the shared admin context.
//
// "Add employee" reuses the existing admin-create endpoint (which makes a
// customer) then promotes the new account to role=employee via admin-update.
// No customer management lives here; roles aren't promoted/demoted beyond that.

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  hr_code: "",
  pin: "",
  date_of_birth: "",
};

const STAFF_ROLES = ["employee", "admin"];

const fullName = (u) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

const EmployeesPanel = () => {
  const [employees, setEmployees] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", id }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [usersRes, workload] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/analytics/employees"),
      ]);
      const workById = new Map((workload || []).map((w) => [w.user_id, w]));
      const list = (usersRes.items || [])
        .filter((u) => STAFF_ROLES.includes(u.role))
        .map((u) => ({
          ...u,
          work: workById.get(u.id) || { assigned: 0, completed: 0, open_tasks: 0 },
        }));
      setEmployees(list);
    } catch (e) {
      setError(e.message || "Failed to load employees");
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  };

  const openEdit = (emp) => {
    setForm({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      phone: emp.phone || "",
      email: emp.email || "",
      hr_code: emp.hr_code || "",
      pin: "",
      date_of_birth: emp.date_of_birth || "",
    });
    setModal({ mode: "edit", id: emp.id });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (modal.mode === "add") {
      if (form.pin.length !== 4) {
        toast.error("PIN must be 4 digits");
        return;
      }
      if (!form.hr_code.trim()) {
        toast.error("HR code is required");
        return;
      }
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const created = await api.post("/admin/users", {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          hr_code: form.hr_code.trim(),
          pin: form.pin,
          date_of_birth: form.date_of_birth,
        });
        await api.patch("/admin/users", { id: created.id, role: "employee" });
        toast.success("Employee added");
      } else {
        await api.patch("/admin/users", {
          id: modal.id,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim(),
        });
        toast.success("Employee updated");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api.patch("/admin/users", { id: emp.id, is_active: !emp.is_active });
      toast.success(emp.is_active ? "Employee deactivated" : "Employee activated");
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  // Promote an employee to admin (full access). One-way here: admin rows
  // expose no demote/deactivate control, to avoid locking out the last admin.
  const makeAdmin = async (emp) => {
    if (
      !window.confirm(
        `Promote ${fullName(emp)} to ADMIN? They will gain full admin access.`,
      )
    )
      return;
    try {
      await api.patch("/admin/users", { id: emp.id, role: "admin" });
      toast.success(`${fullName(emp)} is now an admin`);
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  if (employees === null) return <Spinner label="Loading employees…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Employees</h2>
          <p className="text-sm text-gray-500">{employees.length} total</p>
        </div>
        <button className={`${cls.btn} ${cls.btnPrimary}`} onClick={openAdd}>
          <i className="fas fa-user-plus" /> Add Employee
        </button>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon="fa-user-tie"
          title="No employees yet"
          hint="Add your first employee to get started."
        />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Assigned</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Open tasks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className={emp.is_active ? "" : "bg-gray-50/70"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{fullName(emp)}</div>
                      <div className="text-xs text-gray-400">
                        {emp.hr_code ? `HR: ${emp.hr_code}` : emp.membership_code}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          emp.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {emp.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          emp.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-500"
                        }
                      >
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{emp.work.assigned}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{emp.work.completed}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{emp.work.open_tasks}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                          onClick={() => openEdit(emp)}
                        >
                          <i className="fas fa-pen" /> Edit
                        </button>
                        {emp.role === "employee" && (
                          <>
                            <button
                              className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
                              onClick={() => makeAdmin(emp)}
                            >
                              <i className="fas fa-user-shield" /> Make Admin
                            </button>
                            <button
                              className={`${cls.btn} ${
                                emp.is_active ? cls.btnDanger : cls.btnOutline
                              } ${cls.btnSm}`}
                              onClick={() => toggleActive(emp)}
                            >
                              <i
                                className={`fas ${
                                  emp.is_active ? "fa-user-slash" : "fa-user-check"
                                }`}
                              />{" "}
                              {emp.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !saving && setModal(null)}
        >
          <form
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {modal.mode === "add" ? "Add Employee" : "Edit Employee"}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cls.label}>First name</label>
                  <input
                    className={cls.input}
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={cls.label}>Last name</label>
                  <input
                    className={cls.input}
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={cls.label}>Phone</label>
                <input
                  className={cls.input}
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {modal.mode === "add" && (
                <>
                  <div>
                    <label className={cls.label}>Email</label>
                    <input
                      type="email"
                      className={cls.input}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cls.label}>HR code</label>
                    <input
                      className={cls.input}
                      required
                      value={form.hr_code}
                      onChange={(e) => setForm({ ...form, hr_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cls.label}>Date of birth</label>
                    <input
                      type="date"
                      className={cls.input}
                      required
                      value={form.date_of_birth}
                      onChange={(e) =>
                        setForm({ ...form, date_of_birth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={cls.label}>PIN (4 digits)</label>
                    <PinInput
                      value={form.pin}
                      onChange={(v) => setForm({ ...form, pin: v })}
                    />
                  </div>
                </>
              )}
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
              <button
                type="submit"
                className={`${cls.btn} ${cls.btnPrimary}`}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : modal.mode === "add"
                    ? "Add Employee"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeesPanel;
