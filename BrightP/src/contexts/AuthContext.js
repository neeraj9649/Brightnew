import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken, hasSessionHint, refreshSession } from "../services/api";
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
  isAdmin: dto.role === "admin" || dto.role === "super_admin",
  isStaff: ["admin", "super_admin", "employee"].includes(dto.role),
  isActive: dto.is_active !== false,
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const applyUserDTO = (dto) => {
    setCurrentUser({ uid: dto.id, email: dto.email });
    setUserData(mapUserDTO(dto));
    setIsAdmin(dto.role === "admin" || dto.role === "super_admin");
    setIsSuperAdmin(dto.role === "super_admin");
    setIsStaff(["admin", "super_admin", "employee"].includes(dto.role));
  };

  // Sends a 4-digit code by SMS. purpose: "login" or "register".
  // Resolves to { channel, code_length, expires_in_seconds, resend_after_seconds, dev_code? }.
  const requestOtp = (phone, purpose, referredByCode) =>
    api.post("/auth/otp/request", {
      phone,
      purpose,
      referred_by_code: referredByCode || undefined,
    });

  // Joining: `code` (texted by requestOtp(..., "register")) proves the phone, `pin` is the
  // 4-digit passcode the member signs in with from now on.
  const signUp = async (phone, code, pin, additionalData = {}) => {
    const [first_name, ...rest] = (additionalData.name || "Customer").split(" ");
    const data = await api.post("/auth/register", {
      phone,
      code,
      pin,
      first_name,
      last_name: rest.join(" ") || null,
      date_of_birth: additionalData.dob,
      referred_by_code: additionalData.referredByCode || undefined,
    });
    setAccessToken(data.access_token);
    applyUserDTO(data.user);
    return data.user;
  };

  // Signing in is phone + 4-digit passcode (no SMS).
  const signIn = async (phone, pin) => {
    const data = await api.post("/auth/login", { phone, pin });
    setAccessToken(data.access_token);
    applyUserDTO(data.user);
    return data.user;
  };

  // Forgot passcode: `code` comes from requestOtp(..., "reset"). Signs out every other device
  // and signs in here.
  const resetPasscode = async (phone, code, pin) => {
    const data = await api.post("/auth/passcode/reset", { phone, code, pin });
    setAccessToken(data.access_token);
    applyUserDTO(data.user);
    return data.user;
  };

  // Google sign-in was retired with the move off Firebase Auth.
  const signInWithGoogle = async () => {
    throw new Error(
      "Google sign-in is no longer available. Please sign in with your phone number.",
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
      setIsSuperAdmin(false);
      setIsStaff(false);
    }
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
      // Never signed in on this browser: there is no refresh cookie, so don't call the API at all.
      if (!hasSessionHint()) {
        setLoading(false);
        return;
      }
      // Only a definite 401 means "no session". Network errors and 5xx get a few retries
      // so a server hiccup does not sign the user out.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const data = await refreshSession();
          setAccessToken(data.access_token);
          applyUserDTO(data.user);
          break;
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            setAccessToken(null);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }
      setLoading(false);
    })();
  }, []);

  const contextValue = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isSuperAdmin,
    isStaff,
    // Login.js/AuthPage.js gate their old Firebase-demo-credentials banner
    // on this flag; there's always a real backend now, so keep it hidden.
    isFirebaseConfigured: true,
    requestOtp,
    signUp,
    signIn,
    resetPasscode,
    signInWithGoogle,
    logout,
    updateUserProfile,
    addTokens,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
