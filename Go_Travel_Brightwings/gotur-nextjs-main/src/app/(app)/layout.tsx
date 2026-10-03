"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/store/auth";
import { tryRefresh, apiPost } from "@/lib/api";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/rewards", label: "Rewards" },
  { href: "/referral", label: "Referral" },
  { href: "/profile", label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  // Bootstrap session once from the httpOnly refresh cookie.
  useEffect(() => {
    if (useAuth.getState().status === "loading") {
      tryRefresh().then((t) => {
        if (!t) useAuth.getState().clear();
      });
    }
  }, []);

  // Guard: kick anonymous users to login.
  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  async function logout() {
    try {
      await apiPost("/auth/logout");
    } catch {
      /* ignore network errors on logout */
    }
    useAuth.getState().clear();
    router.replace("/login");
  }

  return (
    <html lang="en">
      <body className={jakartaSans.variable}>
        {status !== "auth" ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            Loading…
          </div>
        ) : (
          <div style={{ minHeight: "100vh", background: "#f6f7f9" }}>
            <header
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                padding: "14px 24px",
                background: "#fff",
                borderBottom: "1px solid #eee",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <Link
                href="/dashboard"
                style={{ fontWeight: 800, fontSize: 18, color: "#b45309" }}
              >
                Bright Wings
              </Link>
              <nav style={{ display: "flex", gap: 18, flex: 1, flexWrap: "wrap" }}>
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} style={{ color: "#333" }}>
                    {n.label}
                  </Link>
                ))}
              </nav>
              <span style={{ opacity: 0.7 }}>{user?.first_name}</span>
              <button className="gotur-btn" onClick={logout}>
                Logout
              </button>
            </header>
            <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
