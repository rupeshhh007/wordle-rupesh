"use client";

import { useState, useEffect } from "react";
import { getMe } from "@/lib/api/users";
import { useAuthStore } from "@/stores/auth-store";
import type { UserResponse } from "@/types/api";
import { User, Star, Mail, LogOut } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [user, setLocalUser] = useState<UserResponse | null>(storeUser);
  const [isLoading, setIsLoading] = useState(!storeUser);

  useEffect(() => {
    getMe()
      .then((u) => {
        setLocalUser(u);
        setUser(u);
      })
      .catch(() => {
        // Use store user as fallback
      })
      .finally(() => setIsLoading(false));
  }, [setUser]);

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-display font-black text-3xl sm:text-4xl flex items-center gap-3 text-border uppercase tracking-wide">
        <div className="p-2 bg-pastel-purple rounded-brutal border-2 border-border shadow-brutal-sm">
          <User className="w-6 h-6 text-border" />
        </div>
        Profile
      </h1>

      <div className="card-brutal p-8">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar username={user.username} size="lg" />
          <div>
            <h2 className="font-display font-bold text-2xl text-border">{user.username}</h2>
            <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-display font-bold text-sm text-border">
                {user.rating} rating
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-bg rounded-sm">
            <User className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-xs font-display uppercase text-text-secondary font-semibold">
                Username
              </p>
              <p className="font-body font-medium">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg rounded-sm">
            <Mail className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-xs font-display uppercase text-text-secondary font-semibold">
                Email
              </p>
              <p className="font-body font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg rounded-sm">
            <Star className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-display uppercase text-text-secondary font-semibold">
                Rating
              </p>
              <p className="font-display font-black text-2xl">
                {user.rating}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn-brutal w-full bg-surface text-danger mt-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
