'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Loader2, Eye } from 'lucide-react';
import { findMatch, getActiveMatch, getLiveMatches } from '@/lib/api/arena';
import { getMe } from '@/lib/api/users';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingState } from '@/components/ui/LoadingState';
import { Avatar } from '@/components/ui/Avatar';
import type { ArenaMatchResponse } from '@/types/api';

export default function ArenaLobbyPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [isCheckingActive, setIsCheckingActive] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [liveMatches, setLiveMatches] = useState<ArenaMatchResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function checkActiveMatch() {
      try {
        const activeMatch = await getActiveMatch();
        if (!mounted.current) return;

        if (
          activeMatch &&
          (activeMatch.status === 'WAITING' || activeMatch.status === 'IN_PROGRESS')
        ) {
          router.replace(`/arena/${activeMatch.id}`);
          return;
        }
      } catch {
        // Backend unavailable — show lobby
      } finally {
        if (mounted.current) {
          setIsCheckingActive(false);
        }
      }
    }

    async function loadLiveMatches() {
      try {
        const matches = await getLiveMatches();
        if (mounted.current) {
          setLiveMatches(matches);
        }
      } catch {
        // ignore
      }
    }

    async function refreshUser() {
      try {
        const me = await getMe();
        if (mounted.current) {
          setUser(me);
        }
      } catch {
        // ignore
      }
    }

    // Clear any stale localStorage on lobby load
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wordle_active_arena_match');
    }

    refreshUser();
    checkActiveMatch();
    loadLiveMatches();

    // Poll live matches every 10 seconds while on lobby
    const liveInterval = setInterval(loadLiveMatches, 10000);

    return () => {
      mounted.current = false;
      clearInterval(liveInterval);
    };
  }, [router]);

  const handleFindMatch = async () => {
    if (isSearching) return;
    try {
      setIsSearching(true);
      setError(null);
      const response = await findMatch();

      if (!mounted.current) return;

      router.push(`/arena/${response.id}`);
    } catch (err: any) {
      if (mounted.current) {
        setIsSearching(false);
        setError(err.message || 'Failed to find match');
      }
    }
  };

  if (isCheckingActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingState message="Checking for active match..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 bg-pastel-yellow rounded-brutal border-2 border-border shadow-brutal-sm">
          <Swords className="w-7 h-7 text-border" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-border uppercase tracking-wide">Arena</h1>
      </div>

      {error && (
        <div className="w-full max-w-lg mb-6 p-4 rounded-brutal border-3 border-border shadow-brutal bg-pastel-pink text-border font-bold text-center text-sm">
          {error}
        </div>
      )}

      <div className="card-brutal p-8 text-center max-w-lg mx-auto w-full bg-surface border-3 border-border shadow-brutal flex flex-col items-center">
        <div className="p-5 bg-pastel-pink rounded-brutal border-3 border-border shadow-brutal-sm mb-6">
          <Swords className="w-14 h-14 text-border" strokeWidth={2} />
        </div>

        <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-pink border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-2">
          1V1 RANKED DUEL
        </span>
        <h2 className="font-display font-black text-3xl mb-1 text-border tracking-tight">
          Competitive Match
        </h2>
        <p className="mb-8 font-body text-border/70 text-sm max-w-sm font-medium">
          Face off against an opponent in real time. First player to find the target word wins the match and earns rating points.
        </p>

        <button
          onClick={handleFindMatch}
          disabled={isSearching}
          className="btn-brutal bg-primary px-8 py-3.5 w-full font-bold flex items-center justify-center gap-2 text-border text-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching for opponent...
            </>
          ) : (
            'Find Match'
          )}
        </button>
      </div>

      {/* Live Duels / Spectator Section */}
      <div className="w-full max-w-lg mt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-border" />
            <h3 className="font-display font-black text-xl text-border uppercase tracking-tight">
              Live Duels
            </h3>
          </div>
          <span className="text-xs font-display font-bold text-border/60">
            {liveMatches.length} active {liveMatches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {liveMatches.length === 0 ? (
          <div className="bg-surface p-6 rounded-brutal border-3 border-border shadow-brutal text-center">
            <p className="font-body text-sm text-border/70 font-medium">
              No live duels happening right now. Click &quot;Find Match&quot; above to start one!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {liveMatches.map((m) => (
              <div
                key={m.id}
                className="bg-surface p-4 rounded-brutal border-3 border-border shadow-brutal flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-pastel-yellow border border-border text-xs font-display font-black text-border uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE
                    </span>
                    <span className="text-xs font-display font-semibold text-border/60">
                      Match #{m.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 my-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar username={m.player1} size="sm" />
                      <span className="font-display font-bold text-sm text-border truncate">
                        {m.player1}
                      </span>
                    </div>

                    <span className="font-display font-black text-xs text-border/40 shrink-0">
                      VS
                    </span>

                    <div className="flex items-center gap-2 min-w-0 justify-end">
                      <span className="font-display font-bold text-sm text-border truncate text-right">
                        {m.player2 || 'Waiting'}
                      </span>
                      <Avatar username={m.player2 || '?'} size="sm" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/arena/${m.id}`)}
                  className="btn-brutal bg-pastel-blue text-border px-4 py-2 w-full text-xs font-bold flex items-center justify-center gap-1.5 mt-2 shadow-brutal-sm"
                >
                  <Eye className="w-4 h-4" />
                  Watch Live
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
