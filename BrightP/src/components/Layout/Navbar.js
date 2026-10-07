import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BrightLogo from "../../assets/BrightLogo.png";
import NotificationBell from "./NotificationBell";
import "./CustomerPortal.css";

const customerLinks = [
  { path: "/dashboard", label: "Home", icon: "fa-house" },
  { path: "/bookings", label: "Bookings", icon: "fa-calendar-days" },
  { path: "/rewards", label: "Wings", icon: "fa-feather-pointed" },
  { path: "/referrals", label: "Refer", icon: "fa-user-group" },
  { path: "/profile", label: "Account", icon: "fa-user" },
];

const displayName = (user) => user?.displayName || user?.name || "Traveler";

export default function Navbar() {
  const { userData, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isStaff) {
    return (
      <header className="bw-context-bar">
        <button className="bw-context-brand" onClick={() => navigate("/admin")}>
          <img src={BrightLogo} alt="Bright Wings" />
          <span>BrightP <small>{isAdmin ? "Admin" : "Employee workspace"}</small></span>
        </button>
        <div className="bw-context-actions">
          <span>{displayName(userData)}</span>
          <button className="bw-icon-button" aria-label="Sign out" onClick={async () => { await logout(); navigate("/auth"); }}>
            <i className="fas fa-arrow-right-from-bracket" />
          </button>
        </div>
      </header>
    );
  }

  const active = (path) => location.pathname === path || (path === "/rewards" && location.pathname.startsWith("/membership"));

  return (
    <>
      <header className="bw-customer-topbar">
        <button className="bw-customer-brand" onClick={() => navigate("/dashboard")} aria-label="Bright Wings home">
          <img src={BrightLogo} alt="" />
          <span>Bright Wings <small>LOYALTY PORTAL</small></span>
        </button>

        <nav className="bw-customer-desktop-nav" aria-label="Primary navigation">
          {customerLinks.map((link) => (
            <button key={link.path} className={active(link.path) ? "active" : ""} onClick={() => navigate(link.path)}>
              <i className={`fas ${link.icon}`} /> {link.label}
            </button>
          ))}
        </nav>

        <div className="bw-customer-top-actions">
          <NotificationBell />
          <button className="bw-wings-pill" onClick={() => navigate("/rewards")}>
            <i className="fas fa-coins" /> {Number(userData?.tokens || 0).toLocaleString("en-IN")} Wings
          </button>
          <button className="bw-avatar-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
            <span>{displayName(userData).slice(0, 1).toUpperCase()}</span>
            <span className="bw-avatar-copy"><strong>{displayName(userData)}</strong><small>{userData?.membershipTier || "Silver"} member</small></span>
            <i className={`fas fa-chevron-${menuOpen ? "up" : "down"}`} />
          </button>
          {menuOpen && (
            <div className="bw-user-menu">
              <div className="bw-user-menu-header"><strong>{displayName(userData)}</strong><small>{userData?.membershipCode || "Bright Wings member"}</small></div>
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }}><i className="fas fa-user" /> Profile & preferences</button>
              <button onClick={() => { navigate("/membership"); setMenuOpen(false); }}><i className="fas fa-id-card" /> Membership card</button>
              <button onClick={() => { navigate("/support"); setMenuOpen(false); }}><i className="fas fa-circle-question" /> Help & support</button>
              {isAdmin && <button onClick={() => { navigate("/admin"); setMenuOpen(false); }}><i className="fas fa-shield-halved" /> Admin workspace</button>}
              <button className="danger" onClick={async () => { await logout(); navigate("/auth"); }}><i className="fas fa-arrow-right-from-bracket" /> Sign out</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bw-customer-mobile-nav" aria-label="Mobile navigation">
        {customerLinks.map((link) => (
          <button key={link.path} className={active(link.path) ? "active" : ""} onClick={() => navigate(link.path)}>
            <i className={`fas ${link.icon}`} /><span>{link.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
