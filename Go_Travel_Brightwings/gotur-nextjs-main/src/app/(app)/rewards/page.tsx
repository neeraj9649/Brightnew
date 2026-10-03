"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Card, fmtDate, humanize } from "@/lib/ui";

// Mirrors backend RewardTransactionDTO (modules/rewards api/dto/reward.rs).
interface RewardTx {
  id: string;
  points: number;
  reason: string;
  description: string | null;
  created_at: string;
}

export default function RewardsPage() {
  const user = useAuth((s) => s.user);
  const [history, setHistory] = useState<RewardTx[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/rewards/me")
      .then((d) => setHistory(d as RewardTx[]))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Rewards</h1>
      <Card title="Wallet balance" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>
          {user?.tokens ?? 0}{" "}
          <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>Wings</span>
        </div>
        <div style={{ opacity: 0.6, marginTop: 4 }}>
          {user?.lifetime_points_earned ?? 0} Wings earned lifetime
        </div>
      </Card>

      <Card title="History">
        {error && <div style={{ color: "#dc2626" }}>{error}</div>}
        {!history && !error && <div style={{ opacity: 0.6 }}>Loading…</div>}
        {history?.length === 0 && (
          <div style={{ opacity: 0.6 }}>No reward activity yet.</div>
        )}
        {history?.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{humanize(tx.reason)}</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                {tx.description || fmtDate(tx.created_at)}
              </div>
            </div>
            <div
              style={{
                fontWeight: 700,
                color: tx.points >= 0 ? "#16a34a" : "#dc2626",
              }}
            >
              {tx.points >= 0 ? "+" : ""}
              {tx.points}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
