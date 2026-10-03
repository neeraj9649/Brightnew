import React, { useCallback, useEffect, useState } from "react";
import { format, isPast } from "date-fns";
import { useCrm } from "../../contexts/CrmContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  cls,
  Badge,
  Spinner,
  EmptyState,
  ErrorState,
  taskStatusColor,
  humanize,
} from "./ui";

const emptyForm = { title: "", description: "", dueAt: "" };

const MyTasksPanel = () => {
  const { listMyTasks, createTask, completeTask, cancelTask } = useCrm();
  const { userData } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setTasks(await listMyTasks());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [listMyTasks]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const task = await createTask({
      assignedTo: userData?.uid,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
    });
    setSaving(false);
    if (task) {
      setTasks((prev) => [task, ...prev]);
      setForm(emptyForm);
    }
  };

  const mutate = (updated) =>
    updated &&
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const pending = tasks.filter((t) => t.status === "pending");
  const closed = tasks.filter((t) => t.status !== "pending");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-sm text-gray-500">
            Follow-ups and to-dos assigned to you.
          </p>
        </div>
        <button
          onClick={load}
          className={`${cls.btn} ${cls.btnOutline} ${cls.btnSm}`}
        >
          <i className="fas fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* New task */}
      <form
        onSubmit={handleCreate}
        className={`${cls.card} mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto]`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={cls.input}
            placeholder="Task title *"
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
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className={`${cls.btn} ${cls.btnPrimary} self-start`}
        >
          <i className="fas fa-plus" /> Add Task
        </button>
      </form>

      {loading ? (
        <Spinner label="Loading tasks…" />
      ) : error ? (
        <ErrorState message="Couldn't load your tasks." onRetry={load} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="fa-list-check"
          title="No tasks yet"
          hint="Add a follow-up above to get started."
        />
      ) : (
        <div className="space-y-6">
          <TaskGroup title={`Open (${pending.length})`} tasks={pending}>
            {(t) => (
              <div className="flex shrink-0 gap-2">
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
          </TaskGroup>
          {closed.length > 0 && (
            <TaskGroup title={`Closed (${closed.length})`} tasks={closed} muted />
          )}
        </div>
      )}
    </div>
  );
};

const TaskGroup = ({ title, tasks, children, muted }) => {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      <div className="space-y-2">
        {tasks.map((t) => {
          const overdue =
            t.status === "pending" && t.dueAt && isPast(new Date(t.dueAt));
          return (
            <div
              key={t.id}
              className={`${cls.card} flex items-start justify-between gap-4 p-4 ${
                muted ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-800">{t.title}</span>
                  <Badge color={taskStatusColor(t.status)}>
                    {humanize(t.status)}
                  </Badge>
                  {overdue && <Badge color="bg-red-100 text-red-700">Overdue</Badge>}
                </div>
                {t.description && (
                  <p className="mt-1 text-sm text-gray-600">{t.description}</p>
                )}
                {t.dueAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    <i className="far fa-clock mr-1" />
                    Due {format(new Date(t.dueAt), "MMM d, yyyy h:mm a")}
                  </p>
                )}
              </div>
              {children && children(t)}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MyTasksPanel;
