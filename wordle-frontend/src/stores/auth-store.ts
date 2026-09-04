"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse, LoginResponse } from "@/types/api";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  setUser: (user: UserResponse) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (response: LoginResponse) =>
        set({
          token: response.token,
          user: response.user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),

      setUser: (user: UserResponse) => set({ user }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "wordle-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
