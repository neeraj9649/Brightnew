"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/store/auth";
import { apiGet } from "@/lib/api";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 20,
        flex: "1 1 200px",
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const [bookingCount, setBookingCount] = useState<number | null>(null);

  useEffect(() => {
    apiGet("/bookings")
      .then((d) => setBookingCount((d as unknown[]).length))
      .catch(() => setBookingCount(0));
  }, []);

  if (!user) return null;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome, {user.first_name}</h1>

      {/* Membership card (render only, no QR) */}
      <div
        style={{
          background: "linear-gradient(135deg, #b45309, #f59e0b)",
          color: "#fff",
          borderRadius: 16,
          padding: 24,
          maxWidth: 420,
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(180,83,9,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, letterSpacing: 1 }}>BRIGHT WINGS</span>
          <span style={{ textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}>
            {user.membership_tier}
          </span>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: 3,
            margin: "28px 0 6px",
          }}
        >
          {user.membership_code}
        </div>
        <div style={{ opacity: 0.9 }}>
          {user.first_name} {user.last_name ?? ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Membership">
          <div style={{ fontSize: 22, fontWeight: 700 }}>{user.membership_tier}</div>
          <div style={{ opacity: 0.6, fontFamily: "monospace" }}>
            {user.membership_code}
          </div>
        </Card>
        <Card title="Wings wallet">
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {user.tokens}{" "}
            <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>Wings</span>
          </div>
        </Card>
        <Card title="Lifetime Wings">
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {user.lifetime_points_earned}
          </div>
        </Card>
        <Card title="Referral code">
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>
            {user.referral_code ?? "—"}
          </div>
        </Card>
        <Card title="Bookings">
          <div style={{ fontSize: 28, fontWeight: 700 }}>{bookingCount ?? "—"}</div>
        </Card>
      </div>
    </div>
  );
}
