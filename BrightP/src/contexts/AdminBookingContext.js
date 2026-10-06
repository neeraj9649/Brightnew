import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const AdminBookingContext = createContext();

export const useAdminBooking = () => {
  const context = useContext(AdminBookingContext);
  if (context === undefined) {
    throw new Error(
      "useAdminBooking must be used within an AdminBookingProvider",
    );
  }
  return context;
};

const mapUserDTO = (dto) => ({
  uid: dto.id,
  displayName: [dto.first_name, dto.last_name].filter(Boolean).join(" "),
  email: dto.email,
  role: dto.role,
  isAdmin: dto.role === "admin",
  isStaff: dto.role === "admin" || dto.role === "employee",
  isActive: dto.is_active !== false,
  membershipTier: dto.membership_tier,
  membershipCode: dto.membership_code,
  referralCode: dto.referral_code,
  tokens: dto.tokens,
  lifetimePointsEarned: dto.lifetime_points_earned,
  totalBookings: dto.total_bookings,
  totalSpent: dto.total_spent,
  profile: { phone: dto.phone || "", dateOfBirth: dto.date_of_birth || "" },
  joinedAt: new Date(dto.joined_at),
  lastActive: new Date(dto.last_active),
  photoURL: dto.profile_image_url,
});

// A BookingDTO only carries `userId` - the rest of the admin UI
// (AdminDashboard) expects userEmail/userName/userPhone/membershipCode
// directly on the booking, so we join against the already-loaded user list.
const mapBookingDTO = (dto, usersById) => {
  const user = usersById.get(dto.user_id);
  return {
    docId: dto.id,
    id: dto.display_code,
    userId: dto.user_id,
    type: dto.type,
    status: dto.status,
    membershipTier: dto.membership_tier_snapshot || user?.membershipTier,
    estimatedCost: dto.estimated_cost,
    finalCost: dto.final_cost,
    paymentStatus: dto.payment_status,
    specialRequests: dto.special_requests,
    adminNotes: dto.admin_notes,
    assignedEmployeeId: dto.assigned_employee_id,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    userEmail: user?.email,
    userName: user?.displayName,
    userPhone: user?.profile?.phone,
    membershipCode: user?.membershipCode,
    ...dto.details,
  };
};

export const AdminBookingProvider = ({ children }) => {
  const { isAdmin, isStaff } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Only admins can list every user (GET /admin/users is admin-only); an
  // employee's booking list is auto-scoped server-side to their own
  // assignments, so it doesn't need this.
  const loadAllUsers = useCallback(async () => {
    if (!isAdmin) return [];

    try {
      setLoading(true);
      const dtos = await api.get("/admin/users");
      const users = dtos.items.map(mapUserDTO);
      setAllUsers(users);
      return users;
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // GET /admin/bookings auto-scopes to "assigned to me" server-side for an
  // employee caller, and returns everything for an admin -- no client-side
  // filtering needed either way.
  const loadAllBookings = useCallback(
    async (usersOverride) => {
      if (!isStaff) return [];

      try {
        setLoading(true);
        const dtos = await api.get("/admin/bookings");
        const users = usersOverride || allUsers;
        const usersById = new Map(users.map((u) => [u.uid, u]));
        const bookings = dtos.map((dto) => mapBookingDTO(dto, usersById));
        setAllBookings(bookings);
        return bookings;
      } catch (error) {
        console.error("Error loading bookings:", error);
        toast.error("Failed to load bookings");
        return [];
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, allUsers],
  );

  const addUserTokens = useCallback(
    async (userId, amount, reason = "Admin Added") => {
      if (!isAdmin) return false;
      const user = allUsers.find((u) => u.uid === userId);
      if (!user) {
        toast.error("User not found");
        return false;
      }

      try {
        const dto = await api.patch("/admin/users", {
          id: userId,
          tokens: (user.tokens || 0) + amount,
        });
        const updated = mapUserDTO(dto);
        setAllUsers((prev) =>
          prev.map((u) => (u.uid === userId ? updated : u)),
        );
        toast.success(
          `Added ${amount} tokens to ${user.displayName}'s account. Reason: ${reason}`,
        );
        return true;
      } catch (error) {
        console.error("Error adding tokens:", error);
        toast.error("Failed to add tokens");
        return false;
      }
    },
    [isAdmin, allUsers],
  );

  const removeUserTokens = useCallback(
    async (userId, amount, reason = "Admin Removed") => {
      if (!isAdmin) return false;
      const user = allUsers.find((u) => u.uid === userId);
      if (!user) {
        toast.error("User not found");
        return false;
      }

      try {
        const dto = await api.patch("/admin/users", {
          id: userId,
          tokens: Math.max(0, (user.tokens || 0) - amount),
        });
        const updated = mapUserDTO(dto);
        setAllUsers((prev) =>
          prev.map((u) => (u.uid === userId ? updated : u)),
        );
        toast.success(
          `Removed ${amount} tokens from ${user.displayName}'s account. Reason: ${reason}`,
        );
        return true;
      } catch (error) {
        console.error("Error removing tokens:", error);
        toast.error("Failed to remove tokens");
        return false;
      }
    },
    [isAdmin, allUsers],
  );

  const createUser = useCallback(
    async ({ firstName, lastName, email, phone, dateOfBirth }) => {
      // Both admins and front-desk employees can sign up a walk-in customer.
      // The /staff/users endpoint always creates a plain customer account.
      if (!isStaff) return null;

      try {
        const dto = await api.post("/staff/users", {
          email: email || undefined,
          first_name: firstName,
          last_name: lastName || null,
          phone,
          pin: phone.replace(/\D/g, "").slice(-4).padEnd(4, "0"),
          date_of_birth: dateOfBirth || undefined,
        });
        const created = mapUserDTO(dto);
        setAllUsers((prev) => [created, ...prev]);
        toast.success(
          `Account created. Membership code: ${created.membershipCode}`,
        );
        return created;
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error(error.message || "Failed to create account");
        return null;
      }
    },
    [isStaff],
  );

  const getUserDetails = useCallback(
    (userId) => allUsers.find((user) => user.uid === userId) || null,
    [allUsers],
  );

  const updateBookingStatus = useCallback(
    async (bookingId, updates) => {
      if (!isStaff) return;
      const booking = allBookings.find((b) => b.id === bookingId);
      if (!booking) {
        toast.error("Booking not found");
        return;
      }

      try {
        const dto = await api.patch("/admin/bookings", {
          id: booking.docId,
          status: updates.status,
          final_cost: updates.finalCost,
          payment_status: updates.paymentStatus,
          admin_notes: updates.adminNotes,
          assigned_employee_id: updates.assignedEmployeeId,
        });
        const usersById = new Map(allUsers.map((u) => [u.uid, u]));
        const updated = mapBookingDTO(dto, usersById);
        setAllBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? updated : b)),
        );
        toast.success("Booking updated successfully");
      } catch (error) {
        console.error("Error updating booking:", error);
        toast.error(error.message || "Failed to update booking");
      }
    },
    [isStaff, allBookings, allUsers],
  );

  const confirmBooking = useCallback(
    async (bookingId, finalCost, adminNotes = "") => {
      await updateBookingStatus(bookingId, {
        status: "booking_confirmed",
        finalCost: finalCost || 0,
        adminNotes,
        paymentStatus: "pending",
      });
    },
    [updateBookingStatus],
  );

  const rejectBooking = useCallback(
    async (bookingId, reason = "") => {
      await updateBookingStatus(bookingId, {
        status: "cancelled",
        adminNotes: reason,
        paymentStatus: "cancelled",
      });
    },
    [updateBookingStatus],
  );

  // Admin-only: pick which employee a booking/lead belongs to.
  const assignEmployee = useCallback(
    async (bookingId, employeeId) => {
      await updateBookingStatus(bookingId, { assignedEmployeeId: employeeId });
    },
    [updateBookingStatus],
  );

  const searchUsers = useCallback(
    async (searchTerm) => {
      if (!isAdmin || !searchTerm) {
        setSearchResults([]);
        return [];
      }

      const searchTermLower = searchTerm.toLowerCase();
      const results = allUsers.filter(
        (user) =>
          user.membershipCode?.toLowerCase().includes(searchTermLower) ||
          user.profile?.phone?.includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTermLower) ||
          user.displayName?.toLowerCase().includes(searchTermLower),
      );

      setSearchResults(results);
      return results;
    },
    [isAdmin, allUsers],
  );

  const getUserBookings = useCallback(
    (userId) => allBookings.filter((booking) => booking.userId === userId),
    [allBookings],
  );

  // Staff (employee/admin) creating a booking on behalf of a customer.
  const staffCreateBooking = useCallback(
    async ({ userId, type, estimatedCost, details, specialRequests }) => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/admin/bookings", {
          user_id: userId,
          type,
          estimated_cost: Number(estimatedCost) || 0,
          special_requests: specialRequests || undefined,
          details: details || {},
        });
        const usersById = new Map(allUsers.map((u) => [u.uid, u]));
        const created = mapBookingDTO(dto, usersById);
        setAllBookings((prev) => [created, ...prev]);
        toast.success("Booking created");
        return created;
      } catch (error) {
        toast.error(error.message || "Failed to create booking");
        return null;
      }
    },
    [isStaff, allUsers],
  );

  const getBookingByDocId = useCallback(
    (docId) => allBookings.find((b) => b.docId === docId) || null,
    [allBookings],
  );

  // Fetch a single customer by id (employees don't load the full user list).
  // Caches into allUsers so booking joins pick up the name too.
  const fetchUser = useCallback(
    async (id) => {
      if (!isStaff) return null;
      try {
        const dto = await api.get(`/staff/users/${id}`);
        const u = mapUserDTO(dto);
        setAllUsers((prev) =>
          prev.some((x) => x.uid === u.uid) ? prev : [u, ...prev],
        );
        return u;
      } catch {
        return null;
      }
    },
    [isStaff],
  );

  const getBookingStats = useCallback(() => {
    const pendingStatuses = [
      "new",
      "assigned",
      "contacted",
      "awaiting_approval",
      "awaiting_payment",
      "payment_received",
    ];
    return {
      total: allBookings.length,
      pending: allBookings.filter((b) => pendingStatuses.includes(b.status))
        .length,
      confirmed: allBookings.filter((b) => b.status === "booking_confirmed")
        .length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
      totalRevenue: allBookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.finalCost || b.estimatedCost || 0), 0),
      pendingRevenue: allBookings
        .filter((b) => pendingStatuses.includes(b.status))
        .reduce((sum, b) => sum + (b.finalCost || b.estimatedCost || 0), 0),
    };
  }, [allBookings]);

  // Admin-only employee directory, derived from the already-loaded user
  // list -- used for the booking-assignment dropdown.
  const employees = allUsers.filter((u) => u.role === "employee");

  useEffect(() => {
    if (isStaff && !dataLoaded) {
      (async () => {
        try {
          const users = isAdmin ? await loadAllUsers() : [];
          await loadAllBookings(users);
        } finally {
          setDataLoaded(true);
        }
      })();
    } else if (!isStaff) {
      setAllBookings([]);
      setAllUsers([]);
      setSearchResults([]);
      setDataLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, isAdmin, dataLoaded]);

  const contextValue = {
    allBookings,
    allUsers,
    employees,
    searchResults,
    loading,
    loadAllBookings,
    loadAllUsers,
    updateBookingStatus,
    confirmBooking,
    rejectBooking,
    assignEmployee,
    searchUsers,
    getUserBookings,
    getUserDetails,
    getBookingByDocId,
    fetchUser,
    staffCreateBooking,
    addUserTokens,
    removeUserTokens,
    createUser,
    getBookingStats,
  };

  return (
    <AdminBookingContext.Provider value={contextValue}>
      {children}
    </AdminBookingContext.Provider>
  );
};
