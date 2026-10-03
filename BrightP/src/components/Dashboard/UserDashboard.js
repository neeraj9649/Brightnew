import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import MembershipCard from "../Profile/MembershipCard";
import Navbar from "../../components/Layout/Navbar";
import { api } from "../../services/api";

// Display labels/icons for the service keys returned by /rewards/points-config.
const SERVICE_LABELS = {
  flight: { label: "Flight", icon: "fa-plane" },
  hotel: { label: "Hotel", icon: "fa-hotel" },
  holiday_package: { label: "Holiday Package", icon: "fa-umbrella-beach" },
  tour: { label: "Tour Package", icon: "fa-map-marked-alt" },
  visa: { label: "Visa", icon: "fa-passport" },
  airport_transfer: { label: "Airport Transfer", icon: "fa-shuttle-van" },
  activity: { label: "Activity Tickets", icon: "fa-ticket-alt" },
  car_rental: { label: "Car Rental", icon: "fa-car" },
  office_visit: { label: "Office Visit", icon: "fa-building" },
  referral_booking: { label: "Referral Booking", icon: "fa-user-plus" },
};

// Per-kind accent backgrounds for notification icons (replaces .notification-icon.<kind>).
const NOTIF_ICON_BG = {
  success: "bg-[var(--color-success)]",
  info: "bg-[var(--color-info)]",
  warning: "bg-[var(--color-warning)]",
  error: "bg-[var(--color-error)]",
};

const relTime = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading } = useBooking();

  // How many tokens each service earns (env-configured on the backend).
  const [pointsConfig, setPointsConfig] = useState(null);
  useEffect(() => {
    api
      .get("/rewards/points-config")
      .then(setPointsConfig)
      .catch(() => {});
  }, []);

  // Calculate real stats from actual Firebase data
  const stats = useMemo(() => {
    if (!userData || !bookings) {
      return {
        totalBookings: 0,
        activeTrips: 0,
        tokensEarned: 0,
        membershipStatus: "Bronze",
      };
    }

    // Calculate active trips (confirmed bookings with future dates)
    const today = new Date();
    const activeTrips = bookings.filter((booking) => {
      if (booking.status !== "confirmed") return false;

      // Check based on booking type
      let tripDate;
      if (booking.type === "flight") {
        tripDate = booking.departureDate
          ? new Date(booking.departureDate)
          : null;
      } else if (booking.type === "hotel") {
        tripDate = booking.checkIn ? new Date(booking.checkIn) : null;
      } else if (booking.type === "tour") {
        tripDate = booking.startDate ? new Date(booking.startDate) : null;
      } else if (booking.type === "visa") {
        tripDate = booking.travelDate ? new Date(booking.travelDate) : null;
      }

      return tripDate && tripDate > today;
    }).length;

    return {
      totalBookings: bookings.length || 0,
      activeTrips: activeTrips,
      tokensEarned: userData.tokens || 0,
      membershipStatus: userData.membershipTier || "Bronze",
    };
  }, [userData, bookings]);

  // Get recent bookings (last 3 bookings)
  const recentBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    return [...bookings]
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds
          ? new Date(a.createdAt.seconds * 1000)
          : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds
          ? new Date(b.createdAt.seconds * 1000)
          : new Date(b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 3)
      .map((booking) => {
        // Format booking data for display
        let displayData = {
          id: booking.id,
          type: booking.type,
          status: booking.status,
          amount: booking.finalCost || booking.estimatedCost || 0,
          createdAt: booking.createdAt?.seconds
            ? new Date(booking.createdAt.seconds * 1000)
            : new Date(booking.createdAt || Date.now()),
        };

        // Set destination and date based on booking type
        switch (booking.type) {
          case "flight":
            displayData.destination =
              `${booking.from || ""} → ${booking.to || ""}`.trim();
            displayData.date = booking.departureDate || "TBD";
            break;
          case "hotel":
            displayData.destination = booking.destination || "Hotel Booking";
            displayData.date = booking.checkIn || "TBD";
            displayData.hotelName = booking.hotelName || "Hotel";
            displayData.location =
              booking.destination || booking.location || "";
            displayData.checkIn = booking.checkIn;
            break;
          case "tour":
            displayData.destination = booking.destination || "Tour Package";
            displayData.date = booking.startDate || "TBD";
            displayData.packageName = booking.packageName || "Tour Package";
            break;
          case "visa":
            displayData.destination = `${booking.country || "Unknown"} Visa`;
            displayData.date = booking.travelDate || "TBD";
            break;
          default:
            displayData.destination = "Booking";
            displayData.date = "TBD";
        }

        return displayData;
      });
  }, [bookings]);

  // Notifications come from the backend (GET /notifications/me derives them
  // from the user's bookings + reward ledger), mapped to this card's shape.
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    api
      .get("/notifications/me")
      .then((d) =>
        setNotifications(
          (d.items || []).slice(0, 6).map((n) => ({
            id: n.id,
            type: n.kind,
            title: n.title,
            message: n.message,
            icon: `fas ${n.icon}`,
            time: relTime(n.created_at),
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const quickActions = [
    {
      icon: "fas fa-plane",
      title: "Book Flight",
      description: "Find and book flights",
      color: "#3b82f6",
      action: () => navigate("/bookings?tab=flights"),
    },
    {
      icon: "fas fa-hotel",
      title: "Book Hotel",
      description: "Reserve accommodations",
      color: "#10b981",
      action: () => navigate("/bookings?tab=hotels"),
    },
    {
      icon: "fas fa-map-marked-alt",
      title: "Tour Packages",
      description: "Explore tour packages",
      color: "#f59e0b",
      action: () => navigate("/bookings?tab=tours"),
    },
    {
      icon: "fas fa-passport",
      title: "Visa Services",
      description: "Apply for visas",
      color: "#8b5cf6",
      action: () => navigate("/bookings?tab=visa"),
    },
  ];

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getMembershipColor = (tier) => {
    switch (tier) {
      case "Platinum":
        return "#e5e7eb";
      case "Gold":
        return "#fbbf24";
      case "Silver":
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  };

  // Show loading state
  if (authLoading || !userData) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-[12px] min-[481px]:p-[16px] min-[769px]:p-0 min-[769px]:px-[32px] min-[769px]:pb-[32px]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh] text-[18px] text-[var(--color-text-secondary)]">
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: "2rem", marginBottom: "1rem" }}
          ></i>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-[12px] min-[481px]:p-[16px] min-[769px]:p-0 min-[769px]:px-[32px] min-[769px]:pb-[32px]">
      <Navbar />

      {/* Header Section */}
      <header className="relative overflow-hidden rounded-[12px] p-[24px] mb-[32px] text-[var(--color-btn-primary-text)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] before:content-[''] before:absolute before:-top-1/2 before:-right-[20%] before:w-[120%] before:h-[200%] before:bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop')] before:bg-cover before:bg-center before:opacity-10 before:z-0 min-[481px]:p-[32px]">
        <div className="relative z-[1] flex max-[768px]:flex-col min-[769px]:flex-row items-center gap-[16px] text-center justify-between min-[769px]:gap-0 min-[769px]:text-left">
          <div className="flex max-[768px]:flex-col min-[769px]:flex-row items-center gap-[16px] min-[769px]:gap-[24px]">
            {userData.photoURL ? (
              <img
                src={userData.photoURL}
                alt="User Avatar"
                className="w-[60px] h-[60px] rounded-full object-cover border-[3px] border-[var(--color-btn-primary-text)] shadow-[var(--shadow-md)] min-[481px]:w-[80px] min-[481px]:h-[80px]"
              />
            ) : (
              <div
                className="w-[60px] h-[60px] rounded-full object-cover border-[3px] border-[var(--color-btn-primary-text)] shadow-[var(--shadow-md)] min-[481px]:w-[80px] min-[481px]:h-[80px]"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  fontSize: "2rem",
                }}
              >
                <i className="fas fa-user"></i>
              </div>
            )}
            <div>
              <h1 className="text-[20px] font-[600] mb-[8px] text-[var(--color-btn-primary-text)] min-[481px]:text-[24px] min-[769px]:text-[30px]">
                Welcome back, {userData.displayName || "Traveler"}!
              </h1>
              <p className="opacity-90 text-[16px] text-[var(--color-btn-primary-text)] m-0 min-[481px]:text-[18px]">
                Ready for your next adventure? Let's explore what's waiting for
                you.
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-[8px] py-[12px] px-[24px] rounded-full font-[550] backdrop-blur-[10px] text-[var(--color-btn-primary-text)]"
            style={{
              backgroundColor: getMembershipColor(
                userData.membershipTier || "Bronze",
              ),
            }}
          >
            <i className="fas fa-star text-[var(--color-warning)]"></i>
            <span>{userData.membershipTier || "Bronze"} Member</span>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="mb-[32px]">
        <div className="grid grid-cols-1 gap-[16px] min-[481px]:gap-[24px] min-[769px]:grid-cols-2 min-[1025px]:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
          <div className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] min-[481px]:p-[24px]">
            <div className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[20px]" style={{ background: "#3b82f6" }}>
              <i className="fas fa-calendar-check"></i>
            </div>
            <div>
              <h3 className="text-[30px] font-[600] text-[var(--color-text)] mb-[4px]">{stats.totalBookings}</h3>
              <p className="text-[var(--color-text-secondary)] text-[12px] font-medium m-0">Total Bookings</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] min-[481px]:p-[24px]">
            <div className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[20px]" style={{ background: "#10b981" }}>
              <i className="fas fa-plane-departure"></i>
            </div>
            <div>
              <h3 className="text-[30px] font-[600] text-[var(--color-text)] mb-[4px]">{stats.activeTrips}</h3>
              <p className="text-[var(--color-text-secondary)] text-[12px] font-medium m-0">Active Trips</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] min-[481px]:p-[24px]">
            <div className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[20px]" style={{ background: "#f59e0b" }}>
              <i className="fas fa-coins"></i>
            </div>
            <div>
              <h3 className="text-[30px] font-[600] text-[var(--color-text)] mb-[4px]">{stats.tokensEarned}</h3>
              <p className="text-[var(--color-text-secondary)] text-[12px] font-medium m-0">Wings Earned</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] min-[481px]:p-[24px]">
            <div className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[20px]" style={{ background: "#8b5cf6" }}>
              <i className="fas fa-crown"></i>
            </div>
            <div>
              <h3 className="text-[30px] font-[600] text-[var(--color-text)] mb-[4px]">{stats.membershipStatus}</h3>
              <p className="text-[var(--color-text-secondary)] text-[12px] font-medium m-0">Membership Tier</p>
            </div>
          </div>
        </div>
      </section>

      <main className="grid grid-cols-1 gap-[16px] min-[481px]:gap-[32px] min-[1025px]:grid-cols-[2fr_1fr]">
        {/* Left Column */}
        <div>
          {/* Quick Actions */}
          <section className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] mb-[24px] min-[481px]:p-[24px]">
            <div className="flex max-[480px]:flex-col min-[481px]:flex-row items-start gap-[8px] justify-between mb-[24px] min-[481px]:items-center min-[481px]:gap-0">
              <h2 className="text-[var(--color-primary)] text-[20px] font-[550]">Quick Actions</h2>
              <p className="text-[var(--color-text-secondary)] text-[12px] m-0">Book your next adventure</p>
            </div>
            <div className="grid grid-cols-1 gap-[12px] min-[481px]:gap-[16px] min-[769px]:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-[16px] p-[12px] border-2 border-[var(--color-border)] rounded-[10px] cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-primary)] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(33,128,141,0.15)] min-[481px]:p-[16px]"
                  onClick={action.action}
                >
                  <div
                    className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[20px]"
                    style={{ background: action.color }}
                  >
                    <i className={action.icon}></i>
                  </div>
                  <div>
                    <h3 className="text-[var(--color-text)] font-[550] mb-[4px]">{action.title}</h3>
                    <p className="text-[var(--color-text-secondary)] text-[12px] m-0">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Wings earned per service */}
          <section className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] mb-[24px] min-[481px]:p-[24px]">
            <div className="flex max-[480px]:flex-col min-[481px]:flex-row items-start gap-[8px] justify-between mb-[24px] min-[481px]:items-center min-[481px]:gap-0">
              <h2 className="text-[var(--color-primary)] text-[20px] font-[550]">Earn Wings</h2>
              <p className="text-[var(--color-text-secondary)] text-[12px] m-0">Wings are credited once your booking is completed</p>
            </div>
            {pointsConfig ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "0.6rem",
                  }}
                >
                  {pointsConfig.services.map((s) => {
                    const meta = SERVICE_LABELS[s.booking_type] || {
                      label: s.booking_type,
                      icon: "fa-suitcase",
                    };
                    return (
                      <div
                        key={s.booking_type}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid #f1e7d0",
                          borderRadius: "10px",
                          background: "#fffaf0",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#374151",
                            fontSize: "0.85rem",
                          }}
                        >
                          <i
                            className={`fas ${meta.icon}`}
                            style={{ color: "#b45309", width: "1rem" }}
                          />
                          {meta.label}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#b45309",
                            whiteSpace: "nowrap",
                          }}
                        >
                          +{s.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p
                  style={{
                    marginTop: "1rem",
                    marginBottom: 0,
                    fontSize: "0.85rem",
                    color: "#6b7280",
                  }}
                >
                  Plus a {pointsConfig.welcome_bonus}-Wing welcome bonus and{" "}
                  {pointsConfig.first_booking} Wings on your first booking.
                </p>
              </>
            ) : (
              <p style={{ color: "#6b7280" }}>Loading rewards…</p>
            )}
          </section>

          {/* Recent Bookings */}
          <section className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] mb-[24px] min-[481px]:p-[24px]">
            <div className="flex max-[480px]:flex-col min-[481px]:flex-row items-start gap-[8px] justify-between mb-[24px] min-[481px]:items-center min-[481px]:gap-0">
              <h2 className="text-[var(--color-primary)] text-[20px] font-[550]">Recent Bookings</h2>
              <button
                className="inline-flex items-center justify-center rounded-[8px] font-medium text-[14px] no-underline cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] border-none leading-[1.5] bg-transparent text-[var(--color-text-secondary)] py-[4px] px-[8px] hover:text-[var(--color-primary)]"
                onClick={() => navigate("/bookings")}
              >
                View All
              </button>
            </div>
            <div className="flex flex-col gap-[16px]">
              {bookingsLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                  }}
                >
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{ fontSize: "1.5rem", marginBottom: "1rem" }}
                  ></i>
                  <p>Loading your bookings...</p>
                </div>
              ) : recentBookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                  }}
                >
                  <i
                    className="fas fa-calendar-plus"
                    style={{
                      fontSize: "2rem",
                      marginBottom: "1rem",
                      opacity: 0.5,
                    }}
                  ></i>
                  <p>No bookings yet. Start planning your next trip!</p>
                  <button
                    className="inline-flex items-center justify-center rounded-[8px] font-medium text-[11px] no-underline cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] border leading-[1.5] bg-transparent text-[var(--color-primary)] border-[var(--color-primary)] py-[6px] px-[12px] hover:bg-[var(--color-primary)] hover:text-[var(--color-btn-primary-text)]"
                    onClick={() => navigate("/bookings")}
                    style={{ marginTop: "1rem" }}
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-[16px] p-[16px] bg-[var(--color-secondary)] rounded-[10px] border border-[var(--color-card-border)] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-secondary-hover)] hover:border-[var(--color-primary)]">
                    <div className="w-[40px] h-[40px] rounded-[8px] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[16px]">
                      <i
                        className={`fas fa-${
                          booking.type === "flight"
                            ? "plane"
                            : booking.type === "hotel"
                              ? "bed"
                              : booking.type === "tour"
                                ? "map-marked-alt"
                                : "passport"
                        }`}
                      ></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[var(--color-text)] font-[550] mb-[4px]">
                        {booking.type === "hotel" && booking.hotelName
                          ? booking.hotelName
                          : booking.type === "tour" && booking.packageName
                            ? booking.packageName
                            : booking.destination}
                      </h4>
                      <p className="text-[var(--color-text-secondary)] text-[12px] m-0">
                        {booking.type === "hotel" && booking.location
                          ? booking.location
                          : booking.type === "hotel" && booking.checkIn
                            ? `Check-in: ${booking.checkIn}`
                            : booking.date}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-[4px]">
                      <div
                        className="py-[4px] px-[12px] rounded-full text-[var(--color-btn-primary-text)] text-[11px] font-medium uppercase"
                        style={{
                          backgroundColor: getStatusColor(booking.status),
                        }}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </div>
                      <span className="text-[var(--color-text)] font-[550] text-[12px]">
                        {formatCurrency(booking.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div>
          {/* Membership Card */}
          <section className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] mb-[24px] min-[481px]:p-[24px]">
            <div className="flex max-[480px]:flex-col min-[481px]:flex-row items-start gap-[8px] justify-between mb-[24px] min-[481px]:items-center min-[481px]:gap-0">
              <h2 className="text-[var(--color-primary)] text-[20px] font-[550]">Your Membership</h2>
              <p className="text-[var(--color-text-secondary)] text-[12px] m-0">Card Details</p>
            </div>
            <div className="flex justify-center">
              <MembershipCard userData={userData} />
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-[var(--color-surface)] rounded-[12px] p-[16px] shadow-[var(--shadow-sm)] border border-[var(--color-card-border)] mb-[24px] min-[481px]:p-[24px]">
            <div className="flex max-[480px]:flex-col min-[481px]:flex-row items-start gap-[8px] justify-between mb-[24px] min-[481px]:items-center min-[481px]:gap-0">
              <h2 className="text-[var(--color-primary)] text-[20px] font-[550]">Notifications</h2>
              <p className="text-[var(--color-text-secondary)] text-[12px] m-0">Stay updated</p>
            </div>
            <div className="flex flex-col gap-[16px]">
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                  }}
                >
                  <i
                    className="fas fa-bell-slash"
                    style={{
                      fontSize: "2rem",
                      marginBottom: "1rem",
                      opacity: 0.5,
                    }}
                  ></i>
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-[16px] p-[16px] bg-[var(--color-secondary)] rounded-[10px] border border-[var(--color-card-border)]">
                    <div className={`w-[40px] h-[40px] rounded-[8px] flex items-center justify-center text-[var(--color-btn-primary-text)] text-[16px] shrink-0 ${NOTIF_ICON_BG[notification.type] || ""}`}>
                      <i className={notification.icon}></i>
                    </div>
                    <div>
                      <h4 className="text-[var(--color-text)] font-[550] mb-[4px] text-[12px]">{notification.title}</h4>
                      <p className="text-[var(--color-text-secondary)] text-[12px] mb-[8px]">{notification.message}</p>
                      <span className="text-[var(--color-text-secondary)] text-[11px] opacity-80">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
