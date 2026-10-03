import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminBooking } from "../../contexts/AdminBookingContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "motion/react";
import "./AdminDashboard.css";
import BrightLogo from "../../assets/BrightLogo.png";
import MyTasksPanel from "./MyTasksPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import FinancialsPanel from "./FinancialsPanel";
import EmployeesPanel from "./EmployeesPanel";
import RewardsAdminPanel from "./RewardsAdminPanel";
import PinInput from "../Common/PinInput";

const ACTIVE_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "awaiting_approval",
  "awaiting_payment",
  "payment_received",
];
const ALL_STATUSES = [
  ...ACTIVE_STATUSES,
  "booking_confirmed",
  "completed",
  "cancelled",
];

const BOOKING_TYPE_ICONS = {
  flight: "plane",
  hotel: "bed",
  tour: "map-marked-alt",
  visa: "passport",
  airport_transfer: "shuttle-van",
  cruise: "ship",
  insurance: "shield-alt",
  activity: "ticket-alt",
  car_rental: "car",
  custom: "concierge-bell",
};
const getBookingTypeIcon = (type) => BOOKING_TYPE_ICONS[type] || "suitcase";

const BTN_BASE =
  "inline-flex items-center justify-center gap-[8px] rounded-[8px] font-medium border-none cursor-pointer transition-all duration-[250ms] no-underline disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN_BASE} px-[24px] py-[12px] text-[12px] bg-primary text-white hover:bg-primary-hover hover:-translate-y-px hover:shadow-[var(--shadow-md)]`;
const BTN_OUTLINE = `${BTN_BASE} px-[24px] py-[12px] text-[12px] bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-secondary)]`;
const BTN_PRIMARY_SM = `${BTN_BASE} px-[16px] py-[8px] text-[11px] bg-primary text-white hover:bg-primary-hover hover:-translate-y-px hover:shadow-[var(--shadow-md)]`;
const BTN_OUTLINE_SM = `${BTN_BASE} px-[16px] py-[8px] text-[11px] bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-secondary)]`;
const BTN_SUCCESS_SM = `${BTN_BASE} px-[16px] py-[8px] text-[11px] bg-[#10b981] text-white`;

const STATUS_BASE = "px-[12px] py-[4px] rounded-full text-[11px] font-[550] capitalize";
const STATUS_COLOR = {
  // Matches AdminDashboard.css's `.status.confirmed/.pending/.cancelled` exactly.
  // Real booking.status values are mostly "booking_confirmed"/"completed"/etc,
  // which never matched `.confirmed` in the original CSS either -- replicated as-is, not "fixed".
  confirmed: "bg-[rgba(var(--color-success-rgb),0.15)] text-[var(--color-success)]",
  pending: "bg-[rgba(var(--color-warning-rgb),0.15)] text-[var(--color-warning)]",
  cancelled: "bg-[rgba(var(--color-error-rgb),0.15)] text-[var(--color-error)]",
};
const statusCls = (status) => `${STATUS_BASE} ${STATUS_COLOR[status] || ""}`;

const MEMBERSHIP_BADGE_BASE = "px-[12px] py-[4px] rounded-full text-[11px] font-[550] uppercase";
const MEMBERSHIP_BADGE_COLOR = {
  bronze: "bg-[rgba(var(--color-warning-rgb),0.15)] text-[var(--color-warning)]",
  gold: "bg-[rgba(var(--color-warning-rgb),0.15)] text-[var(--color-warning)]",
  silver: "bg-[var(--color-secondary)] text-[var(--color-text-secondary)]",
  platinum: "bg-[rgba(33,128,141,0.15)] text-primary",
};
const membershipBadgeCls = (tier) => `${MEMBERSHIP_BADGE_BASE} ${MEMBERSHIP_BADGE_COLOR[tier?.toLowerCase()] || MEMBERSHIP_BADGE_COLOR.bronze}`;

// Matches AdminDashboard.css's `.type-badge.flight/.hotel/.tour/.visa` exactly.
// Other booking types (airport_transfer, cruise, insurance, ...) get no color, same as the original CSS.
const TYPE_BADGE_COLOR = {
  flight: "bg-[#dbeafe] text-[#1e40af]",
  hotel: "bg-[#dcfce7] text-[#166534]",
  tour: "bg-[#fef3c7] text-[#92400e]",
  visa: "bg-[#f3e8ff] text-[#7c3aed]",
};
const getLabel = (value) =>
  (value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const AdminDashboard = () => {
  const { userData, logout, isAdmin, isStaff, changePassword } =
    useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navBtnCls = (tab) =>
    `flex items-center gap-[8px] px-[20px] py-[12px] rounded-[8px] font-medium text-[12px] cursor-pointer transition-all duration-[250ms] max-[480px]:px-[16px] max-[480px]:py-[8px] max-[480px]:text-[11px] ${
      activeTab === tab
        ? "bg-[var(--color-secondary)] text-primary font-[550]"
        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]"
    }`;
  // User Details Modal States

  // Add person (admin-created account) states
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [addPersonForm, setAddPersonForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });
  const [addPersonLoading, setAddPersonLoading] = useState(false);

  // Self-service password (PIN) reset for the logged-in staff/admin account.
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Booking management states
  const [searchTerm, setSearchTerm] = useState("");

  // Get booking management functions and REAL DATA
  const {
    allBookings,
    allUsers,
    employees,
    searchResults,
    loading: bookingLoading,
    updateBookingStatus,
    assignEmployee,
    searchUsers,
    createUser,
  } = useAdminBooking();

  // Booking CRM detail panel (notes/tasks/quotations/assignment)

  // Calculate REAL stats from actual data
  const realStats = useMemo(() => {
    if (!allBookings || !allUsers) {
      return {
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeUsers: 0,
        newUsersToday: 0,
        recentBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        rejectedBookings: 0,
      };
    }

    const today = new Date();
    const todayStr = today.toDateString();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate real statistics
    const totalUsers = allUsers.length;
    const totalBookings = allBookings.length;

    // Revenue is counted once a booking is actually completed.
    const totalRevenue = allBookings
      .filter(
        (booking) =>
          booking.status === "completed" &&
          (booking.finalCost || booking.estimatedCost),
      )
      .reduce(
        (sum, booking) =>
          sum + (booking.finalCost || booking.estimatedCost || 0),
        0,
      );

    // Count new users today
    const newUsersToday = allUsers.filter((user) => {
      const userDate = user.joinedAt;
      if (!userDate) return false;

      let joinDate;
      if (userDate.seconds) {
        joinDate = new Date(userDate.seconds * 1000);
      } else if (typeof userDate === "string") {
        joinDate = new Date(userDate);
      } else {
        joinDate = userDate;
      }

      return joinDate.toDateString() === todayStr;
    }).length;

    // Count recent bookings (last 7 days)
    const recentBookings = allBookings.filter((booking) => {
      const bookingDate = booking.createdAt;
      if (!bookingDate) return false;

      let createdDate;
      if (bookingDate.seconds) {
        createdDate = new Date(bookingDate.seconds * 1000);
      } else if (typeof bookingDate === "string") {
        createdDate = new Date(bookingDate);
      } else {
        createdDate = bookingDate;
      }

      return createdDate >= weekAgo;
    }).length;

    // Count active users (users with activity in last 30 days)
    const activeUsers = allUsers.filter((user) => {
      const lastActive = user.lastActive;
      if (!lastActive) return false;

      let lastActiveDate;
      if (lastActive.seconds) {
        lastActiveDate = new Date(lastActive.seconds * 1000);
      } else if (typeof lastActive === "string") {
        lastActiveDate = new Date(lastActive);
      } else {
        lastActiveDate = lastActive;
      }

      return lastActiveDate >= thirtyDaysAgo;
    }).length;

    // Booking status counts
    const pendingBookings = allBookings.filter((b) =>
      ACTIVE_STATUSES.includes(b.status),
    ).length;
    const confirmedBookings = allBookings.filter(
      (b) => b.status === "booking_confirmed" || b.status === "completed",
    ).length;
    const rejectedBookings = allBookings.filter(
      (b) => b.status === "cancelled",
    ).length;

    return {
      totalUsers,
      totalBookings,
      totalRevenue,
      activeUsers,
      newUsersToday,
      recentBookings,
      pendingBookings,
      confirmedBookings,
      rejectedBookings,
    };
  }, [allBookings, allUsers]);

  // Get real recent users (sorted by join date)
  const recentUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];

    return [...allUsers]
      .sort((a, b) => {
        const dateA = a.joinedAt?.seconds
          ? new Date(a.joinedAt.seconds * 1000)
          : new Date(a.joinedAt || 0);
        const dateB = b.joinedAt?.seconds
          ? new Date(b.joinedAt.seconds * 1000)
          : new Date(b.joinedAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((user) => ({
        ...user,
        id: user.uid,
        displayName: user.displayName || user.name || "Unknown User",
        joinedAt: user.joinedAt?.seconds
          ? new Date(user.joinedAt.seconds * 1000)
          : new Date(user.joinedAt || Date.now()),
      }));
  }, [allUsers]);

  // Get real recent bookings (sorted by creation date)
  const recentBookings = useMemo(() => {
    if (!allBookings || allBookings.length === 0) return [];

    return [...allBookings]
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds
          ? new Date(a.createdAt.seconds * 1000)
          : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds
          ? new Date(b.createdAt.seconds * 1000)
          : new Date(b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((booking) => ({
        ...booking,
        bookingDate: booking.createdAt?.seconds
          ? new Date(booking.createdAt.seconds * 1000)
          : new Date(booking.createdAt || Date.now()),
        amount: booking.finalCost || booking.estimatedCost || 0,
        destination:
          booking.destination || booking.to || booking.country || "N/A",
      }));
  }, [allBookings]);

  // User Details: now a routed page (replaces the old in-dashboard modal).
  const handleViewUserDetails = (user) => {
    navigate(`/admin/users/${user.uid}`);
  };

  const handleAddPersonSubmit = async (e) => {
    e.preventDefault();
    const { firstName, email, phone, dateOfBirth } = addPersonForm;
    if (!firstName || !email || !phone || !dateOfBirth) {
      toast.error("Please fill in name, email, phone, and date of birth");
      return;
    }

    setAddPersonLoading(true);
    const created = await createUser(addPersonForm);
    setAddPersonLoading(false);

    if (created) {
      setAddPersonForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
      });
      setShowAddPersonModal(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.current.length !== 4 || pwForm.next.length !== 4) {
      toast.error("PINs must be 4 digits");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New PINs do not match");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setShowPasswordModal(false);
    } catch (_) {
      // changePassword() already surfaces a toast on failure
    } finally {
      setPwSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  // User search functionality with REAL data
  const handleUserSearch = async (term) => {
    setSearchTerm(term);
    if (term.length >= 3) {
      try {
        await searchUsers(term);
      } catch (error) {
        console.error("Search error:", error);
      }
    }
  };

  // Booking action handlers with REAL functions
  const handleStatusChange = async (bookingId, status) => {
    await updateBookingStatus(bookingId, { status });
  };

  const handleAssignEmployee = async (bookingId, employeeId) => {
    await assignEmployee(bookingId, employeeId || null);
  };

  // Show loading state only if we're actually loading data
  if (bookingLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-[16px]">
        <div className="loading-spinner"></div>
        <p className="text-[var(--color-text-secondary)] text-[14px] font-medium">Loading admin dashboard...</p>
        <small>Fetching real-time data from database...</small>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-5 lg:max-w-[95%] mx-auto">
      {/* Header */}
      <header className="py-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[12px] text-[20px] font-semibold text-primary">
            <div className="h-[3rem] sm:h-[5rem]">
              <img
                src={BrightLogo}
                alt="BrightLogo"
                className="h-full w-full"
              />
            </div>
            <span>Bright Wings {isAdmin ? "Admin" : "Staff"}</span>
          </div>

          <div className="max-[1200px]:hidden min-[1201px]:flex gap-[8px]">
            <button
              className={navBtnCls("overview")}
              onClick={() => setActiveTab("overview")}
            >
              <i className="fas fa-tachometer-alt text-[12px]"></i>
              <span className="max-[480px]:hidden">Overview</span>
            </button>
            {isAdmin && (
              <button
                className={navBtnCls("users")}
                onClick={() => setActiveTab("users")}
              >
                <i className="fas fa-users text-[12px]"></i>
                <span className="max-[480px]:hidden">Users</span>
              </button>
            )}
            {isAdmin && (
              <button
                className={navBtnCls("employees")}
                onClick={() => setActiveTab("employees")}
              >
                <i className="fas fa-user-tie text-[12px]"></i>
                <span className="max-[480px]:hidden">Employees</span>
              </button>
            )}
            <button
              className={navBtnCls("bookings")}
              onClick={() => setActiveTab("bookings")}
            >
              <i className="fas fa-calendar-check text-[12px]"></i>
              <span className="max-[480px]:hidden">{isAdmin ? "Bookings" : "My Leads"}</span>
            </button>
            <button
              className={navBtnCls("tasks")}
              onClick={() => setActiveTab("tasks")}
            >
              <i className="fas fa-list-check text-[12px]"></i>
              <span className="max-[480px]:hidden">My Tasks</span>
            </button>
            {isStaff && (
              <button
                className={navBtnCls("rewards")}
                onClick={() => setActiveTab("rewards")}
              >
                <i className="fas fa-gift text-[12px]"></i>
                <span className="max-[480px]:hidden">Rewards</span>
              </button>
            )}
            {isAdmin && (
              <button
                className={navBtnCls("analytics")}
                onClick={() => setActiveTab("analytics")}
              >
                <i className="fas fa-chart-line text-[12px]"></i>
                <span className="max-[480px]:hidden">Analytics</span>
              </button>
            )}
            <button
              className={navBtnCls("financials")}
              onClick={() => setActiveTab("financials")}
            >
              <i className="fas fa-coins text-[12px]"></i>
              <span className="max-[480px]:hidden">Financials</span>
            </button>
            {isAdmin && (
              <button
                className={navBtnCls("search")}
                onClick={() => setActiveTab("search")}
              >
                <i className="fas fa-search text-[12px]"></i>
                <span className="max-[480px]:hidden">Search Users</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate("/dashboard")}
              className="max-[768px]:hidden min-[769px]:flex items-center gap-[8px] px-[16px] py-[8px] bg-primary text-white rounded-[6px] font-medium cursor-pointer transition-all duration-[250ms] text-[12px] hover:bg-primary-hover hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
            >
              <i className="fas fa-user"></i>
              <span>User View</span>
            </button>
            <div className="flex items-center gap-[12px]">
              <span className="max-[1200px]:hidden font-[550] text-[var(--color-text)] text-[12px]">
                {userData?.displayName || "Admin"}
              </span>
              <div className="w-[40px] h-[40px] rounded-full bg-primary flex items-center justify-center text-white overflow-hidden border-2 border-[var(--color-border)] [&>img]:w-full [&>img]:h-full [&>img]:object-cover">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Admin" />
                ) : (
                  <i className="fas fa-user-shield"></i>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="max-[1200px]:hidden p-[8px] bg-transparent border-none text-[var(--color-text-secondary)] cursor-pointer rounded-[6px] transition-all duration-[250ms] hover:bg-[rgba(var(--color-error-rgb),0.15)] hover:text-[var(--color-error)]"
              title="Change password"
            >
              <i className="fas fa-key"></i>
            </button>
            <button
              onClick={handleLogout}
              className="max-[1200px]:hidden p-[8px] bg-transparent border-none text-[var(--color-text-secondary)] cursor-pointer rounded-[6px] transition-all duration-[250ms] hover:bg-[rgba(var(--color-error-rgb),0.15)] hover:text-[var(--color-error)]"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>

            <div className=" lg:hidden ">
              <button onClick={() => setIsMenuOpen(true)}>
                <i className="fas fa-bars fa-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0 transition-transform duration-300 bg-white p-5 text-lg flex flex-col gap-3 items-start h-full w-full z-[99999]"
          >
            <div className="w-full flex justify-end px-7">
              <button onClick={() => setIsMenuOpen(false)}>
                <i className="fas fa-close fa-xl"></i>
              </button>
            </div>

            <button
              className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                activeTab === "overview" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("overview");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </button>

            {isAdmin && (
              <button
                className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                  activeTab === "users" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("users");
                  setIsMenuOpen(false);
                }}
              >
                <i className="fas fa-users"></i>
                <span>Users</span>
              </button>
            )}
            {isAdmin && (
              <button
                className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                  activeTab === "employees" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("employees");
                  setIsMenuOpen(false);
                }}
              >
                <i className="fas fa-user-tie"></i>
                <span>Employees</span>
              </button>
            )}
            <button
              className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                activeTab === "bookings" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("bookings");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-calendar-check"></i>
              <span>{isAdmin ? "Bookings" : "My Leads"}</span>
            </button>
            <button
              className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                activeTab === "tasks" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("tasks");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-list-check"></i>
              <span>My Tasks</span>
            </button>
            {isStaff && (
              <button
                className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                  activeTab === "rewards" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("rewards");
                  setIsMenuOpen(false);
                }}
              >
                <i className="fas fa-gift"></i>
                <span>Rewards</span>
              </button>
            )}
            {isAdmin && (
              <button
                className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                  activeTab === "analytics" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("analytics");
                  setIsMenuOpen(false);
                }}
              >
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
              </button>
            )}
            <button
              className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                activeTab === "financials" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("financials");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-coins"></i>
              <span>Financials</span>
            </button>
            {isAdmin && (
              <button
                className={`flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer  ${
                  activeTab === "search" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("search");
                  setIsMenuOpen(false);
                }}
              >
                <i className="fas fa-search"></i>
                <span>Search Users</span>
              </button>
            )}
            <button
              className="flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer"
              onClick={() => {
                setShowPasswordModal(true);
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-key"></i>
              <span>Change Password</span>
            </button>
            <button
              className="flex gap-2 hover:bg-slate-200 w-full p-1 items-center rounded-md cursor-pointer"
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-2">
        {activeTab === "overview" && (
          <div>
            <div
              className="mb-[32px]"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <h1 className="text-[24px] font-[600] text-[var(--color-text)] mb-[8px]">{isAdmin ? "Admin Dashboard" : "Staff Dashboard"}</h1>
                <p className="text-[var(--color-text-secondary)] text-[16px] m-0">Real-time overview of your travel portal performance</p>
                <small style={{ color: "#6b7280" }}>
                  Last updated: {new Date().toLocaleTimeString()}
                </small>
              </div>
              <button
                className={BTN_PRIMARY}
                onClick={() => setShowAddPersonModal(true)}
              >
                <i className="fas fa-user-plus"></i> Add Customer
              </button>
            </div>

            {/* REAL Stats Cards with INR */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[24px] mb-[32px] max-[768px]:grid-cols-2 max-[768px]:gap-[16px] max-[480px]:grid-cols-1 max-[480px]:mb-[24px]">
              <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-[12px] p-[24px] max-[480px]:p-[16px] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-[4px] before:h-full before:bg-[var(--color-info)]">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-[var(--color-info)] text-white flex items-center justify-center text-[20px]">
                  <i className="fas fa-users"></i>
                </div>
                <div>
                  <h3 className="text-[var(--color-text)] text-[24px] max-[480px]:text-[20px] font-[600] mb-[4px]">{realStats.totalUsers.toLocaleString()}</h3>
                  <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">Total Users</p>
                  <span className="text-[11px] text-[var(--color-success)] font-medium">
                    +{realStats.newUsersToday} today
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-[12px] p-[24px] max-[480px]:p-[16px] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-[4px] before:h-full before:bg-[var(--color-success)]">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-[var(--color-success)] text-white flex items-center justify-center text-[20px]">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div>
                  <h3 className="text-[var(--color-text)] text-[24px] max-[480px]:text-[20px] font-[600] mb-[4px]">{realStats.totalBookings.toLocaleString()}</h3>
                  <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">Total Bookings</p>
                  <span className="text-[11px] text-[var(--color-success)] font-medium">
                    +{realStats.recentBookings} this week
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-[12px] p-[24px] max-[480px]:p-[16px] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-[4px] before:h-full before:bg-[var(--color-warning)]">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-[var(--color-warning)] text-white flex items-center justify-center text-[20px]">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div>
                  <h3 className="text-[var(--color-text)] text-[24px] max-[480px]:text-[20px] font-[600] mb-[4px]">{formatCurrency(realStats.totalRevenue)}</h3>
                  <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">Total Revenue</p>
                  <span className="text-[11px] text-[var(--color-success)] font-medium">
                    From {realStats.confirmedBookings} confirmed bookings
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[var(--color-surface)] rounded-[12px] p-[24px] max-[480px]:p-[16px] border border-[var(--color-card-border)] flex items-center gap-[16px] transition-all duration-[250ms] shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-[4px] before:h-full before:bg-[var(--color-error)]">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-[var(--color-error)] text-white flex items-center justify-center text-[20px]">
                  <i className="fas fa-user-check"></i>
                </div>
                <div>
                  <h3 className="text-[var(--color-text)] text-[24px] max-[480px]:text-[20px] font-[600] mb-[4px]">{realStats.activeUsers}</h3>
                  <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">Active Users</p>
                  <span className="text-[11px] text-[var(--color-success)] font-medium">Last 30 days</span>
                </div>
              </div>
            </div>

            {/* Dashboard Grid with REAL DATA */}
            <div className="grid grid-cols-2 gap-[32px] max-[1200px]:grid-cols-1 max-[480px]:gap-[24px]">
              {/* Recent Users - REAL DATA */}
              <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-card-border)] shadow-[var(--shadow-sm)] transition-all duration-[250ms] overflow-hidden hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]">
                <div className="w-full flex items-center justify-between p-3">
                  <h2 className="text-xl">Recent Users</h2>
                  <div>
                    <button
                      className="flex items-center gap-[8px] text-primary bg-transparent border-none font-medium cursor-pointer transition-all duration-[250ms] text-[12px] hover:text-primary-hover hover:translate-x-[2px]"
                      onClick={() => setActiveTab("users")}
                    >
                      View All <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <div className="flex flex-col gap-3">
                    {recentUsers.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "#6b7280",
                        }}
                      >
                        <i
                          className="fas fa-users"
                          style={{
                            fontSize: "2rem",
                            marginBottom: "1rem",
                            opacity: 0.5,
                          }}
                        ></i>
                        <p>No users found</p>
                      </div>
                    ) : (
                      recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-[16px] p-[16px] border border-[var(--color-card-border-inner)] rounded-[10px] transition-all duration-[250ms] hover:bg-[var(--color-secondary)] hover:border-[var(--color-border)]">
                          <div className="w-[50px] h-[50px] rounded-full bg-[var(--color-bg-1)] text-[var(--color-info)] flex items-center justify-center text-[16px] shrink-0 overflow-hidden [&>img]:w-full [&>img]:h-full [&>img]:object-cover">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} />
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[var(--color-text)] text-[14px] font-[550] mb-[4px]">{user.displayName}</h4>
                            <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">{user.email}</p>
                            <span className="text-[var(--color-text-secondary)] text-[11px]">
                              Joined {user.joinedAt.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-[8px]">
                            <span className={membershipBadgeCls(user.membershipTier)}>
                              {user.membershipTier || "Bronze"}
                            </span>
                            <span className="text-[var(--color-text-secondary)] text-[11px]">
                              {user.totalBookings || 0} bookings
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Bookings - REAL DATA with INR */}
              <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-card-border)] shadow-[var(--shadow-sm)] transition-all duration-[250ms] overflow-hidden hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]">
                <div className="flex items-center justify-between py-2 px-4">
                  <h2 className="text-xl">Recent Bookings</h2>
                  <div>
                    <button
                      className="flex items-center gap-[8px] text-primary bg-transparent border-none font-medium cursor-pointer transition-all duration-[250ms] text-[12px] hover:text-primary-hover hover:translate-x-[2px]"
                      onClick={() => setActiveTab("bookings")}
                    >
                      View All <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex flex-col gap-3">
                    {recentBookings.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "#6b7280",
                        }}
                      >
                        <i
                          className="fas fa-calendar-check"
                          style={{
                            fontSize: "2rem",
                            marginBottom: "1rem",
                            opacity: 0.5,
                          }}
                        ></i>
                        <p>No recent bookings found</p>
                      </div>
                    ) : (
                      recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center gap-[16px] p-[16px] border border-[var(--color-card-border-inner)] rounded-[10px] transition-all duration-[250ms] hover:bg-[var(--color-secondary)] hover:border-[var(--color-border)]">
                          <div className="w-[50px] h-[50px] rounded-full bg-[var(--color-bg-1)] text-[var(--color-info)] flex items-center justify-center text-[16px] shrink-0">
                            <i
                              className={`fas fa-${getBookingTypeIcon(
                                booking.type,
                              )}`}
                            ></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[var(--color-text)] text-[14px] font-[550] mb-[4px]">{booking.destination}</h4>
                            <p className="text-[var(--color-text-secondary)] text-[12px] mb-[4px]">{booking.userEmail}</p>
                            <span className="text-[var(--color-text-secondary)] text-[11px]">
                              {booking.bookingDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-[8px]">
                            <span className={statusCls(booking.status)}>
                              {getLabel(booking.status)}
                            </span>
                            <span className="text-[var(--color-text)] font-[550] text-[14px]">
                              {formatCurrency(booking.amount)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && isAdmin && (
          <div>
            <div className="flex flex-col items-center justify-between text-center max-w-[800px] mx-auto mb-[32px]">
              <div>
                <h1 className="text-[24px] font-[600] text-[var(--color-text)] mb-[8px]">User Management</h1>
                <p className="text-[var(--color-text-secondary)] text-[16px] m-0">Manage user accounts and permissions</p>
              </div>
              <button
                className={BTN_PRIMARY}
                onClick={() => setShowAddPersonModal(true)}
              >
                <i className="fas fa-user-plus"></i> Add Person
              </button>
            </div>

            <div className=" overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Membership</th>
                    <th className="px-4 py-2 text-left">Wings</th>
                    <th className="px-4 py-2 text-left">Total Spent</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(allUsers || []).slice(0, 10).map((user) => (
                    <tr key={user.uid} className="border-b">
                      {/* User */}
                      <td className="px-4 py-2 flex items-center gap-[12px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <i className="fas fa-user text-gray-500"></i>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {user.displayName || user.name || "Unknown User"}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Joined{" "}
                              {user.joinedAt
                                ? user.joinedAt.seconds
                                  ? new Date(
                                      user.joinedAt.seconds * 1000,
                                    ).toLocaleDateString()
                                  : new Date(user.joinedAt).toLocaleDateString()
                                : "Unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-2">{user.email}</td>

                      {/* Membership */}
                      <td className="px-4 py-2">
                        <span className={membershipBadgeCls(user.membershipTier)}>
                          {user.membershipTier || "Bronze"}
                        </span>
                      </td>

                      {/* Tokens */}
                      <td className="px-4 py-2">
                        <span>{user.tokens || 0}</span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-4 py-2">
                        <span>
                          {formatCurrency(user.totalSpent || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2">
                        <span className="px-[12px] py-[4px] rounded-full text-[11px] font-[550] uppercase bg-[rgba(var(--color-success-rgb),0.15)] text-[var(--color-success)]">
                          {getLabel(user.role) || "Customer"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2">
                        <button
                          className={BTN_PRIMARY_SM}
                          onClick={() => handleViewUserDetails(user)}
                        >
                          <i className="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="p-2">
            <div className="flex flex-col text-center max-w-[800px] mx-auto mb-[32px]">
              <h1 className="text-[24px] font-[600] text-[var(--color-text)] mb-[8px]">{isAdmin ? "Booking Management" : "My Assigned Leads"}</h1>
              <p className="text-[var(--color-text-secondary)] text-[16px] m-0">
                {isAdmin
                  ? "Manage all travel bookings and requests"
                  : "Bookings assigned to you"}
              </p>
            </div>

            {/* REAL Booking Statistics with INR */}
            <div className="mb-10">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 ">
                <div className="bg-white p-[21px] rounded-[10.5px] border border-[#e5e7eb] text-center">
                  <span className="block text-[22.4px] font-bold text-[#3b82f6] mb-[7px]">{realStats.totalBookings}</span>
                  <span className="text-[#6b7280] text-[12.25px] font-medium">Total Bookings</span>
                </div>
                <div className="bg-white p-[21px] rounded-[10.5px] border border-[#e5e7eb] text-center">
                  <span className="block text-[22.4px] font-bold text-[#3b82f6] mb-[7px]">
                    {realStats.pendingBookings}
                  </span>
                  <span className="text-[#6b7280] text-[12.25px] font-medium">In Progress</span>
                </div>
                <div className="bg-white p-[21px] rounded-[10.5px] border border-[#e5e7eb] text-center">
                  <span className="block text-[22.4px] font-bold text-[#3b82f6] mb-[7px]">
                    {realStats.confirmedBookings}
                  </span>
                  <span className="text-[#6b7280] text-[12.25px] font-medium">Confirmed/Completed</span>
                </div>
                <div className="bg-white p-[21px] rounded-[10.5px] border border-[#e5e7eb] text-center">
                  <span className="block text-[22.4px] font-bold text-[#3b82f6] mb-[7px]">
                    {formatCurrency(realStats.totalRevenue)}
                  </span>
                  <span className="text-[#6b7280] text-[12.25px] font-medium">Total Revenue</span>
                </div>
              </div>
            </div>

            <div className="rounded-md w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Booking ID</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Details</th>
                    <th className="px-4 py-2 text-left">Cost (INR)</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    {isAdmin && (
                      <th className="px-4 py-2 text-left">Assigned To</th>
                    )}
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(allBookings || []).map((booking) => (
                    <tr key={booking.id} className="border-b">
                      {/* Booking ID */}
                      <td className="px-4 py-2">
                        <span className="[font-family:'Courier_New',monospace] font-semibold text-[#7c3aed]">#{booking.id}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-[3.5px]">
                          <strong className="text-[#1f2937]">
                            {booking.userName ||
                              booking.userEmail?.split("@")[0] ||
                              "Unknown"}
                          </strong>
                          <br />
                          <small className="text-[#6b7280] text-[10.5px]">{booking.userEmail}</small>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-2">
                        <span className={`flex items-center gap-[7px] py-[3.5px] px-[10.5px] rounded-[14px] text-[10.5px] font-medium ${TYPE_BADGE_COLOR[booking.type] || ""}`}>
                          <i
                            className={`fas fa-${getBookingTypeIcon(
                              booking.type,
                            )}`}
                          ></i>{" "}
                          {getLabel(booking.type)}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-2">
                        <span>
                          {booking.from && booking.to
                            ? `${booking.from} → ${booking.to}`
                            : booking.destination || booking.country || "—"}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-[3.5px]">
                          <span className="text-[#6b7280] text-[12.25px]">
                            Est: {formatCurrency(booking.estimatedCost || 0)}
                          </span>
                          {booking.finalCost > 0 && (
                            <span className="block text-[#059669] font-semibold text-[12.25px]">
                              Final: {formatCurrency(booking.finalCost)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2">
                        {booking.createdAt
                          ? booking.createdAt.seconds
                            ? new Date(
                                booking.createdAt.seconds * 1000,
                              ).toLocaleDateString()
                            : new Date(booking.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Assigned To (admin only) */}
                      {isAdmin && (
                        <td className="px-4 py-2">
                          <select
                            className="form-control"
                            value={booking.assignedEmployeeId || ""}
                            onChange={(e) =>
                              handleAssignEmployee(booking.id, e.target.value)
                            }
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.uid} value={emp.uid}>
                                {emp.displayName}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-4 py-2">
                        <select
                          className={statusCls(booking.status)}
                          value={booking.status}
                          onChange={(e) =>
                            handleStatusChange(booking.id, e.target.value)
                          }
                        >
                          {ALL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            className={BTN_OUTLINE_SM}
                            onClick={() => navigate(`/admin/bookings/${booking.docId}`)}
                          >
                            <i className="fas fa-clipboard-list"></i> Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tasks" && <MyTasksPanel />}

        {activeTab === "analytics" && isAdmin && <AnalyticsPanel />}

        {activeTab === "financials" && (
          <div className="p-4">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              Financials &amp; PnL
            </h2>
            <FinancialsPanel />
          </div>
        )}

        {activeTab === "employees" && isAdmin && <EmployeesPanel />}

        {activeTab === "rewards" && isStaff && <RewardsAdminPanel />}

        {activeTab === "search" && isAdmin && (
          <div>
            <div className="flex flex-col text-center max-w-[800px] mx-auto mb-[32px]">
              <h1 className="text-[24px] font-[600] text-[var(--color-text)] mb-[8px]">User Search</h1>
              <p className="text-[var(--color-text-secondary)] text-[16px] m-0">Search users by membership card, phone, or email</p>
            </div>

            <div className="max-w-[800px]">
              <div className="relative mb-[28px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by card number (BW-XXX-XXXX), phone, email, or name..."
                  className="w-full pt-[14px] pr-[42px] pb-[14px] pl-[14px] border-2 border-[#e5e7eb] rounded-[10.5px] text-[14px] transition-all duration-200 focus:outline-none focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
                <i className="fas fa-search absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
              </div>

              {searchResults.length > 0 && (
                <div>
                  <h3>Search Results ({searchResults.length})</h3>

                  {searchResults.map((user) => (
                    <div key={user.uid} className="flex items-center gap-[21px] p-[21px] bg-white border border-[#e5e7eb] rounded-[10.5px] mb-[14px] transition-all duration-200 hover:shadow-[0_4px_6px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1]">
                      <div>
                        <div className="w-[60px] h-[60px] rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] text-[21px] overflow-hidden shrink-0 [&>img]:w-full [&>img]:h-full [&>img]:object-cover">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} />
                          ) : (
                            <i className="fas fa-user"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[#1f2937] text-[15.75px] font-semibold mb-[7px]">
                            {user.displayName || user.name || "Unknown User"}
                          </h4>
                          <p className="text-[#6b7280] mb-[7px]">{user.email}</p>
                          <span className="block text-[#7c3aed] font-medium text-[12.25px] mb-[3.5px]">
                            <strong>{user.membershipCode || "N/A"}</strong> •{" "}
                            {user.membershipTier || "Bronze"} Member
                          </span>
                          <span className="text-[#10b981] text-[12.25px] flex items-start gap-[7px]">
                            <i className="fas fa-credit-card"></i>{" "}
                            {user.cardNumber || "No card number"}
                          </span>
                          <span className="text-[#10b981] text-[12.25px] flex items-start gap-[7px]">
                            <i className="fas fa-phone"></i>{" "}
                            {user.profile?.phone || "No phone"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-[14px]">
                        <div className="text-center">
                          <span className="text-[17.5px] font-semibold text-[#3b82f6] block">
                            {user.tokens || 0}
                          </span>
                          <span className="text-[10.5px] text-[#6b7280]">Wings</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[17.5px] font-semibold text-[#3b82f6] block">
                            {user.totalBookings || 0}
                          </span>
                          <span className="text-[10.5px] text-[#6b7280]">Bookings</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[17.5px] font-semibold text-[#3b82f6] block">
                            {formatCurrency(user.totalSpent || 0)}
                          </span>
                          <span className="text-[10.5px] text-[#6b7280]">Spent</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <button
                          className={BTN_PRIMARY_SM}
                          onClick={() => handleViewUserDetails(user)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length > 0 && searchResults.length === 0 && (
                <div className="text-center p-[42px] text-[#6b7280]">
                  <i className="fas fa-search text-[42px] mb-[14px] opacity-50"></i>
                  <p>No users found matching "{searchTerm}"</p>
                  <span>
                    Try searching by membership code, card number, phone number,
                    email, or name
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>


      {/* Add Person Modal */}
      {showAddPersonModal && (
        <div className="fixed top-0 left-0 w-full h-full z-[1000]">
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1]"
            onClick={() => setShowAddPersonModal(false)}
          ></div>
          <div className="relative z-[2] bg-white rounded-[14px] w-[90%] max-w-[600px] max-h-[85vh] overflow-y-auto mx-auto my-[5vh] p-[21px]">
            <div className="flex justify-between items-center p-[21px] border-b border-[#e5e7eb]">
              <h3>Add Person</h3>
              <button
                className="bg-transparent border-none text-[#6b7280] cursor-pointer text-[17.5px] p-[7px]"
                onClick={() => setShowAddPersonModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddPersonSubmit}>
              <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>
                Their login PIN is set to the last 4 digits of their phone
                number. They can change it later from their profile.
              </p>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={addPersonForm.firstName}
                  onChange={(e) =>
                    setAddPersonForm((f) => ({
                      ...f,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={addPersonForm.lastName}
                  onChange={(e) =>
                    setAddPersonForm((f) => ({
                      ...f,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={addPersonForm.email}
                  onChange={(e) =>
                    setAddPersonForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Phone (last 4 digits become their PIN) *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={addPersonForm.phone}
                  onChange={(e) =>
                    setAddPersonForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Date of Birth *</label>
                <input
                  type="date"
                  className="form-control"
                  value={addPersonForm.dateOfBirth}
                  onChange={(e) =>
                    setAddPersonForm((f) => ({
                      ...f,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="flex gap-[10.5px]">
                <button
                  type="button"
                  className={BTN_OUTLINE}
                  onClick={() => setShowAddPersonModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={BTN_SUCCESS_SM}
                  disabled={addPersonLoading}
                >
                  <i className="fas fa-user-plus"></i>
                  {addPersonLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password (PIN) Modal -- staff/admin self-service reset */}
      {showPasswordModal && (
        <div className="fixed top-0 left-0 w-full h-full z-[1000]">
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1]"
            onClick={() => !pwSaving && setShowPasswordModal(false)}
          ></div>
          <div className="relative z-[2] bg-white rounded-[14px] w-[90%] max-w-[600px] max-h-[85vh] overflow-y-auto mx-auto my-[5vh] p-[21px]">
            <div className="flex justify-between items-center p-[21px] border-b border-[#e5e7eb]">
              <h3>Change Password</h3>
              <button
                className="bg-transparent border-none text-[#6b7280] cursor-pointer text-[17.5px] p-[7px]"
                onClick={() => setShowPasswordModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form
              onSubmit={handleChangePasswordSubmit}
            >
              <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>
                Enter your current PIN, then your new PIN twice to confirm.
              </p>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Current PIN</label>
                <PinInput
                  value={pwForm.current}
                  onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                  ariaLabel="Current PIN"
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">New PIN</label>
                <PinInput
                  value={pwForm.next}
                  onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                  ariaLabel="New PIN"
                />
              </div>
              <div className="mb-[14px]">
                <label className="block mb-[5.25px] font-medium">Confirm New PIN</label>
                <PinInput
                  value={pwForm.confirm}
                  onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                  ariaLabel="Confirm New PIN"
                />
              </div>
              <div className="flex gap-[10.5px]">
                <button
                  type="button"
                  className={BTN_OUTLINE}
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={BTN_PRIMARY}
                  disabled={pwSaving}
                >
                  <i className="fas fa-key"></i>
                  {pwSaving ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
