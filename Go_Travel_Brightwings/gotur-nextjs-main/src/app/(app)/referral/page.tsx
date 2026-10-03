"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, BRAND } from "@/lib/ui";

interface ReferralInfo {
  referral_code: string | null;
  direct_referrals_count: number;
}

export default function ReferralPage() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    apiGet("/referrals/me")
      .then((d) => setInfo(d as ReferralInfo))
      .catch((e) => setError(e.message));
  }, []);

  const code = info?.referral_code ?? "";
  const link =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/login?ref=${code}`
      : "";

  function copy(text: string, which: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Refer & Earn</h1>
      {error && <div style={{ color: "#dc2626" }}>{error}</div>}
      {!info && !error && <div style={{ opacity: 0.6 }}>Loading…</div>}
      {info && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card title="Your referral code" style={{ flex: "1 1 240px" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: 2,
              }}
            >
              {code || "—"}
            </div>
            {code && (
              <button
                className="gotur-btn"
                style={{ marginTop: 12 }}
                onClick={() => copy(code, "code")}
              >
                {copied === "code" ? "Copied!" : "Copy code"}
              </button>
            )}
          </Card>

          <Card title="Direct referrals" style={{ flex: "1 1 200px" }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {info.direct_referrals_count}
            </div>
            <div style={{ opacity: 0.6, marginTop: 4 }}>
              You earn 1% of your referrals&apos; monthly Wings.
            </div>
          </Card>

          {link && (
            <Card title="Share link" style={{ flex: "1 1 100%" }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <code
                  style={{
                    flex: 1,
                    minWidth: 240,
                    background: "#f6f7f9",
                    padding: "10px 12px",
                    borderRadius: 8,
                    overflowX: "auto",
                  }}
                >
                  {link}
                </code>
                <button
                  className="gotur-btn"
                  style={{ background: BRAND }}
                  onClick={() => copy(link, "link")}
                >
                  {copied === "link" ? "Copied!" : "Copy link"}
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
