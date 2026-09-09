"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stompManager } from "@/lib/socket/stomp-client";
import { useAuthStore } from "@/stores/auth-store";
import { ChallengeEventDto } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { respondToChallenge, getPendingChallenges } from "@/lib/api/arena";
import { Swords, Check, X, Loader2 } from "lucide-react";

export function ChallengeNotificationToast() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeEventDto | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const dismissedMatchIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.username) return;

    if (token) {
      stompManager.setToken(token);
      stompManager.connect(token);
    }

    // 1. WebSocket real-time subscription
    const unsubscribe = stompManager.subscribeToUserChallenges(user.username, (event) => {
      if (event.type === "CHALLENGE_RECEIVED") {
        if (!dismissedMatchIdsRef.current.has(event.matchId)) {
          setActiveChallenge(event);
        }
      } else if (event.type === "CHALLENGE_CANCELLED") {
        setActiveChallenge((prev) => (prev?.matchId === event.matchId ? null : prev));
      }
    });

    // 2. Periodic polling backup (every 4s) to guarantee zero missed challenges
    const checkPending = async () => {
      try {
        const pending = await getPendingChallenges();
        if (pending && pending.length > 0) {
          const fresh = pending.find((c) => !dismissedMatchIdsRef.current.has(c.matchId));
          if (fresh) {
            setActiveChallenge((prev) => (prev?.matchId === fresh.matchId ? prev : fresh));
          } else {
            setActiveChallenge(null);
          }
        } else {
          setActiveChallenge(null);
        }
      } catch {
        // ignore background poll errors
      }
    };

    checkPending();
    const pollTimer = setInterval(checkPending, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollTimer);
    };
  }, [user?.username, token]);

  // Auto-dismiss challenge after 30 seconds
  useEffect(() => {
    if (!activeChallenge) return;
    const timer = setTimeout(() => {
      if (activeChallenge) {
        dismissedMatchIdsRef.current.add(activeChallenge.matchId);
      }
      setActiveChallenge(null);
    }, 30000);
    return () => clearTimeout(timer);
  }, [activeChallenge]);

  if (!activeChallenge) return null;

  const handleAccept = async () => {
    if (isResponding) return;
    try {
      setIsResponding(true);
      await respondToChallenge(activeChallenge.matchId, true);
      const matchId = activeChallenge.matchId;
      setActiveChallenge(null);
      router.push(`/arena/${matchId}`);
    } catch {
      setActiveChallenge(null);
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    if (isResponding) return;
    try {
      setIsResponding(true);
      dismissedMatchIdsRef.current.add(activeChallenge.matchId);
      await respondToChallenge(activeChallenge.matchId, false);
    } catch {
      // Ignore
    } finally {
      setIsResponding(false);
      setActiveChallenge(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="card-brutal bg-pastel-yellow border-3 border-border rounded-brutal p-4 shadow-brutal flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary text-border font-display font-black text-xs border border-border">
            <Swords className="w-3.5 h-3.5" />
            1v1 DUEL CHALLENGE
          </span>
          <button
            onClick={handleDecline}
            className="text-border/60 hover:text-border p-1"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Avatar username={activeChallenge.challenger} size="md" />
          <div>
            <p className="font-display font-black text-base text-border leading-tight">
              {activeChallenge.challenger}
            </p>
            {activeChallenge.challengerRating !== undefined && (
              <p className="font-body text-xs font-bold text-border/70">
                Rating: {activeChallenge.challengerRating}
              </p>
            )}
          </div>
        </div>

        <p className="font-body text-xs font-semibold text-border/80">
          Challenged you to a 1v1 Arena duel! Ready to battle?
        </p>

        <div className="flex gap-2 mt-1">
          <button
            onClick={handleAccept}
            disabled={isResponding}
            className="btn-brutal flex-1 py-2 bg-pastel-green text-border font-display font-black text-xs flex items-center justify-center gap-1.5"
          >
            {isResponding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Accept
              </>
            )}
          </button>
          <button
            onClick={handleDecline}
            disabled={isResponding}
            className="btn-brutal py-2 px-4 bg-pastel-pink text-border font-display font-black text-xs flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
