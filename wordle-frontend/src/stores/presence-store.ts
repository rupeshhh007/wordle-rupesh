"use client";

import { create } from "zustand";

interface PresenceState {
  onlineUsers: Set<string>;
  setInitialOnline: (usernames: string[]) => void;
  setUserOnline: (username: string) => void;
  setUserOffline: (username: string) => void;
  isUserOnline: (username?: string | null) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),

  setInitialOnline: (usernames: string[]) => {
    const setObj = new Set<string>();
    usernames.forEach((u) => {
      if (u) setObj.add(u.toLowerCase());
    });
    set({ onlineUsers: setObj });
  },

  setUserOnline: (username: string) => {
    if (!username) return;
    const lower = username.toLowerCase();
    const current = get().onlineUsers;
    if (current.has(lower)) return;
    const next = new Set(current);
    next.add(lower);
    set({ onlineUsers: next });
  },

  setUserOffline: (username: string) => {
    if (!username) return;
    const lower = username.toLowerCase();
    const current = get().onlineUsers;
    if (!current.has(lower)) return;
    const next = new Set(current);
    next.delete(lower);
    set({ onlineUsers: next });
  },

  isUserOnline: (username?: string | null) => {
    if (!username) return false;
    return get().onlineUsers.has(username.toLowerCase());
  },
}));
