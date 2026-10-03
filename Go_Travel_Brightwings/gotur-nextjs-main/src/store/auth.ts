import { create } from "zustand";

// Mirrors backend UserDTO (modules/auth api/dto/user.rs).
export interface User {
  id: string;
  phone: string;
  email: string | null;
  first_name: string;
  last_name: string | null;
  role: string;
  membership_tier: string;
  membership_code: string;
  referral_code: string | null;
  tokens: number;
  lifetime_points_earned: number;
  total_bookings: number;
  total_spent: number;
  profile_image_url: string | null;
  joined_at: string;
  last_active: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // loading = bootstrap not done yet (avoids redirect flash); auth/anon = resolved.
  status: "loading" | "auth" | "anon";
  setSession: (accessToken: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  setSession: (accessToken, user) => set({ accessToken, user, status: "auth" }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: "anon" }),
}));
