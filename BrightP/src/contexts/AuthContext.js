import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Maps the backend UserDTO (snake_case) onto the shape the rest of the app
// already expects (camelCase, Firestore-flavoured `profile.phone`, etc.)
// so BookingsPage/AdminDashboard/ProfilePage need no further changes.
const mapUserDTO = (dto) => ({
  uid: dto.id,
  email: dto.email,
  phone: dto.phone,
  displayName: [dto.first_name, dto.last_name].filter(Boolean).join(" "),
  photoURL: dto.profile_image_url,
  role: dto.role,
  isAdmin: dto.role === "admin",
  isStaff: dto.role === "admin" || dto.role === "employee",
  membershipTier: dto.membership_tier,
  membershipCode: dto.membership_code,
  referralCode: dto.referral_code,
  tokens: dto.tokens,
  lifetimePointsEarned: dto.lifetime_points_earned,
  totalBookings: dto.total_bookings,
  totalSpent: dto.total_spent,
  joinedAt: new Date(dto.joined_at),
  lastActive: new Date(dto.last_active),
  profile: { phone: dto.phone || "" },
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const applyUserDTO = (dto) => {
    setCurrentUser({ uid: dto.id, email: dto.email });
    setUserData(mapUserDTO(dto));
    setIsAdmin(dto.role === "admin");
    setIsStaff(dto.role === "admin" || dto.role === "employee");
  };

  const signUp = async (phone, pin, additionalData = {}) => {
    setLoading(true);
    try {
      const [first_name, ...rest] = (additionalData.name || "Customer").split(
        " ",
      );
      const data = await api.post("/auth/register", {
        phone,
        pin,
        first_name,
        last_name: rest.join(" ") || null,
        date_of_birth: additionalData.dob,
        referred_by_code: additionalData.referredByCode || undefined,
      });
      setAccessToken(data.access_token);
      applyUserDTO(data.user);
      toast.success(
        `Account created successfully! Your membership code: ${data.user.membership_code}`,
      );
      return data.user;
    } catch (error) {
      toast.error(error.message || "Failed to create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (phone, pin) => {
    try {
      const data = await api.post("/auth/login", { phone, pin });
      setAccessToken(data.access_token);
      applyUserDTO(data.user);
      toast.success("Welcome back!");
      return data.user;
    } catch (error) {
      toast.error(error.message || "Invalid phone number or PIN");
      throw error;
    }
  };

  // Google sign-in was retired with the move off Firebase Auth.
  const signInWithGoogle = async () => {
    throw new Error(
      "Google sign-in is no longer available. Please sign in with your phone and PIN.",
    );
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      setIsStaff(false);
    }
  };

  // Password-reset email delivery isn't wired up on the new backend yet.
  const resetPassword = async () => {
    throw new Error(
      "Password reset is not available yet. Please contact support.",
    );
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;

    const [first_name, ...rest] = updates.displayName
      ? updates.displayName.split(" ")
      : [];

    try {
      const dto = await api.patch("/users/me", {
        first_name: updates.displayName ? first_name : undefined,
        last_name: updates.displayName ? rest.join(" ") || null : undefined,
        phone: updates.profile?.phone,
      });
      setUserData(mapUserDTO(dto));
      toast.success("Profile updated successfully!");
      return mapUserDTO(dto);
    } catch (error) {
      toast.error("Failed to update profile");
      throw error;
    }
  };

  const changePassword = async (currentPin, newPin) => {
    try {
      await api.patch("/users/me/pin", {
        current_pin: currentPin,
        new_pin: newPin,
      });
      toast.success("PIN changed successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to change PIN");
      throw error;
    }
  };

  const addTokens = async (amount, reason = "Reward") => {
    toast.success(`+${amount} Wings earned! (${reason})`);
  };

  // Re-pull the current user (e.g. after a redemption changes the Wings
  // balance) so the navbar/card reflect it without a full page reload.
  const refreshUser = async () => {
    try {
      const dto = await api.get("/users/me");
      setUserData(mapUserDTO(dto));
      return mapUserDTO(dto);
    } catch {
      return null;
    }
  };

  // Restore the session on page load using the httpOnly refresh-token cookie.
  useEffect(() => {
    (async () => {
      try {
        const data = await api.post("/auth/refresh");
        setAccessToken(data.access_token);
        applyUserDTO(data.user);
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const contextValue = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isStaff,
    // Login.js/AuthPage.js gate their old Firebase-demo-credentials banner
    // on this flag; there's always a real backend now, so keep it hidden.
    isFirebaseConfigured: true,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    addTokens,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
