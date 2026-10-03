import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

const relTime = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const dotColor = (kind) =>
  kind === "success" ? "#10b981" : kind === "warning" ? "#f59e0b" : "#3b82f6";

// Bell + dropdown. Feed and unread count come from GET /notifications/me;
// opening the dropdown marks everything seen (POST /notifications/mark-seen).
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await api.get("/notifications/me");
      setItems(d.items || []);
      setUnread(d.unread || 0);
    } catch {
      /* leave empty on failure */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await api.post("/notifications/mark-seen", {});
      } catch {
        /* badge already cleared optimistically */
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="relative cursor-pointer rounded-[8px] border-none bg-transparent p-[8px] text-[20px] text-[var(--color-text-secondary)] transition-all duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]"
        onClick={toggle}
      >
        <i className="fas fa-bell"></i>
        {unread > 0 && (
          <span className="absolute right-[4px] top-[4px] flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[var(--color-error)] text-[11px] font-semibold text-[var(--color-btn-primary-text)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "130%",
              width: 340,
              maxHeight: 440,
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,.18)",
              border: "1px solid #eee",
              zIndex: 50,
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                fontWeight: 700,
                color: "#1f2937",
                borderBottom: "1px solid #f1f1f1",
                position: "sticky",
                top: 0,
                background: "#fff",
              }}
            >
              Notifications
            </div>
            {items.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                <i className="fas fa-bell-slash" style={{ fontSize: "1.5rem" }} />
                <p style={{ marginTop: 8 }}>No notifications yet</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: "1px solid #f7f7f7",
                    background: n.read ? "#fff" : "#fffaf0",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: dotColor(n.kind) + "22",
                      color: dotColor(n.kind),
                    }}
                  >
                    <i className={`fas ${n.icon}`} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: ".85rem", color: "#1f2937" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: ".8rem", color: "#4b5563" }}>{n.message}</div>
                    <div style={{ fontSize: ".7rem", color: "#9ca3af", marginTop: 2 }}>
                      {relTime(n.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
