"use client";

import { useEffect } from "react";
import { stompManager } from "@/lib/socket/stomp-client";
import { getOnlineUsers } from "@/lib/api/presence";
import { usePresenceStore } from "@/stores/presence-store";
import { useAuthStore } from "@/stores/auth-store";

export function PresenceListener() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setInitialOnline = usePresenceStore((s) => s.setInitialOnline);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);

  useEffect(() => {
    // 1. Initial snapshot of online users
    getOnlineUsers()
      .then((users) => {
        setInitialOnline(users);
      })
      .catch(() => {
        // ignore snapshot fetch error
      });

    // 2. Ensure WebSocket is connected with current auth token
    if (token) {
      stompManager.setToken(token);
      stompManager.connect(token);
    }

    // If current user is logged in, mark self as online locally immediately
    if (user?.username) {
      setUserOnline(user.username);
    }

    // 3. Real-time presence updates via STOMP WebSocket topic
    const unsubscribe = stompManager.subscribeToPresence((event) => {
      if (event.status === "ONLINE") {
        setUserOnline(event.username);
      } else if (event.status === "OFFLINE") {
        setUserOffline(event.username);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, user?.username, setInitialOnline, setUserOnline, setUserOffline]);

  return null;
}
