"use client";

import { usePresenceStore } from "@/stores/presence-store";

interface OnlineBadgeProps {
  username?: string | null;
  isOnline?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineDot({
  username,
  isOnline: explicitOnline,
  size = "md",
  className = "",
}: {
  username?: string | null;
  isOnline?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const storeOnline = usePresenceStore((s) => s.isUserOnline(username));
  const active = explicitOnline !== undefined ? explicitOnline : storeOnline;

  const sizeClass = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-border ${
        active
          ? "bg-emerald-500 shadow-[1px_1px_0px_#1A1A2E]"
          : "bg-gray-400/80 border-border/50"
      } ${sizeClass} ${className}`}
      title={active ? "Online" : "Offline"}
      aria-label={active ? "Online" : "Offline"}
    />
  );
}

export function OnlineBadge({
  username,
  isOnline: explicitOnline,
  showText = true,
  size = "md",
  className = "",
}: OnlineBadgeProps) {
  const storeOnline = usePresenceStore((s) => s.isUserOnline(username));
  const active = explicitOnline !== undefined ? explicitOnline : storeOnline;

  const textSizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  if (!showText) {
    return <OnlineDot username={username} isOnline={active} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-display uppercase tracking-wider ${
        active
          ? "bg-emerald-100 text-emerald-950 border-2 border-border shadow-brutal-sm font-black"
          : "bg-surface text-border/60 border-2 border-border/40 shadow-brutal-sm font-bold"
      } ${textSizes[size]} ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full border border-border/80 shrink-0 ${
          active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
        }`}
      />
      {active ? "Online" : "Offline"}
    </span>
  );
}
