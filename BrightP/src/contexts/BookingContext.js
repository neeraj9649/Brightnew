import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};

// Maps the backend BookingDTO onto the flat, Firestore-flavoured shape
// BookingsPage/AdminDashboard already expect: type-specific fields
// (from/to/destination/checkIn/...) spread at the top level, `id` holding
// the human-readable display code, and `docId` holding the real row id.
const mapBookingDTO = (dto) => ({
  docId: dto.id,
  id: dto.display_code,
  userId: dto.user_id,
  type: dto.type,
  status: dto.status,
  membershipTier: dto.membership_tier_snapshot,
  estimatedCost: dto.estimated_cost,
  finalCost: dto.final_cost,
  paymentStatus: dto.payment_status,
  specialRequests: dto.special_requests,
  adminNotes: dto.admin_notes,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
  ...dto.details,
});

export const BookingProvider = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const submitBooking = async (bookingData) => {
    try {
      setLoading(true);
      const { type, estimatedCost, specialRequests, ...details } = bookingData;

      const dto = await api.post("/bookings", {
        type,
        estimated_cost: estimatedCost || 0,
        special_requests: specialRequests || null,
        membership_tier_snapshot: userData?.membershipTier || null,
        details,
      });

      const createdBooking = mapBookingDTO(dto);
      setBookings((prev) => [createdBooking, ...prev]);

      toast.success(
        "Booking submitted! Wings are credited when the booking is completed.",
      );

      return createdBooking;
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const dtos = await api.get("/bookings");
      const userBookings = dtos.map(mapBookingDTO);
      setBookings(userBookings);
      return userBookings;
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      const dto = await api.post(`/bookings/${booking.docId}/cancel`);
      const updated = mapBookingDTO(dto);

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b)),
      );

      toast.success("Booking cancelled successfully");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  useEffect(() => {
    if (currentUser && userData) {
      loadUserBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userData]);

  const contextValue = {
    bookings,
    loading,
    submitBooking,
    loadUserBookings,
    cancelBooking,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};
