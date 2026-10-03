"use client";

import { useState } from "react";
import { apiPatch } from "@/lib/api";
import { useAuth, type User } from "@/store/auth";
import { Card, BRAND, PinInput } from "@/lib/ui";

const input = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, width: "100%" };

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
  });
  const [pin, setPin] = useState({ current_pin: "", new_pin: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!user) return null;

  function flash(setOk: string) {
    setMsg(setOk);
    setErr("");
    setTimeout(() => setMsg(""), 2500);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const updated = (await apiPatch("/users/me", {
        first_name: profile.first_name,
        last_name: profile.last_name || null,
        phone: profile.phone,
      })) as User;
      setUser(updated);
      flash("Profile saved.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function savePin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pin.new_pin.length !== 4) {
      setErr("New PIN must be 4 digits.");
      return;
    }
    try {
      await apiPatch("/users/me/pin", {
        current_pin: pin.current_pin,
        new_pin: pin.new_pin,
      });
      setPin({ current_pin: "", new_pin: "" });
      flash("PIN changed.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Profile</h1>
      {msg && <div style={{ color: "#16a34a", marginBottom: 12 }}>{msg}</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Personal details" style={{ flex: "1 1 320px" }}>
          <form onSubmit={saveProfile} style={{ display: "grid", gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>First name</div>
              <input
                style={input}
                required
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Last name</div>
              <input
                style={input}
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Phone</div>
              <input
                style={input}
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </label>
            <button className="gotur-btn" style={{ background: BRAND, justifySelf: "start" }}>
              Save
            </button>
          </form>
        </Card>

        <Card title="Change PIN" style={{ flex: "1 1 320px" }}>
          <form onSubmit={savePin} style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Current PIN</div>
              <PinInput
                value={pin.current_pin}
                onChange={(v) => setPin({ ...pin, current_pin: v })}
                ariaLabel="Current PIN"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>New PIN (4 digits)</div>
              <PinInput
                value={pin.new_pin}
                onChange={(v) => setPin({ ...pin, new_pin: v })}
                ariaLabel="New PIN"
              />
            </div>
            <button className="gotur-btn" style={{ background: BRAND, justifySelf: "start" }}>
              Update PIN
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
