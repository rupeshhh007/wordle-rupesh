'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Loader2, Eye, UserPlus } from 'lucide-react';
import {
  findMatch,
  getActiveMatch,
  getLiveMatches,
  createPrivateMatch,
  joinPrivateMatch,
} from '@/lib/api/arena';
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
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [hasInviteFromUrl, setHasInviteFromUrl] = useState(false);
  const [liveMatches, setLiveMatches] = useState<ArenaMatchResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Check for room invite code in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || params.get('join');
      if (code) {
        setInviteCodeInput(code.toUpperCase().trim());
        setHasInviteFromUrl(true);
      }
    }

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
  }, [router, setUser]);

  const handleFindMatch = async () => {
    if (isSearching || isCreatingPrivate || isJoiningPrivate) return;
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

  const handleCreatePrivateMatch = async () => {
    if (isCreatingPrivate || isSearching || isJoiningPrivate) return;
    try {
      setIsCreatingPrivate(true);
      setError(null);
      const response = await createPrivateMatch();

      if (!mounted.current) return;

      router.push(`/arena/${response.id}`);
    } catch (err: any) {
      if (mounted.current) {
        setIsCreatingPrivate(false);
        setError(err.message || 'Failed to create private room');
      }
    }
  };

  const handleJoinPrivateMatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      setError('Please enter a 6-character room code');
      return;
    }
    if (isJoiningPrivate || isSearching || isCreatingPrivate) return;
    try {
      setIsJoiningPrivate(true);
      setError(null);
      const response = await joinPrivateMatch(code);

      if (!mounted.current) return;

      router.push(`/arena/${response.id}`);
    } catch (err: any) {
      if (mounted.current) {
        setIsJoiningPrivate(false);
        setError(err.message || 'Failed to join private room');
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
        <div className="w-full max-w-2xl mb-6 p-4 rounded-brutal border-3 border-border shadow-brutal bg-pastel-pink text-border font-bold text-center text-sm">
          {error}
        </div>
      )}

      {/* Duel Options: Public Queue & Play with Friend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        {/* Card 1: Quick Match (Public Matchmaking) */}
        <div className="card-brutal p-6 text-center bg-surface border-3 border-border shadow-brutal flex flex-col items-center justify-between">
          <div className="flex flex-col items-center w-full">
            <div className="p-4 bg-pastel-pink rounded-brutal border-3 border-border shadow-brutal-sm mb-4">
              <Swords className="w-10 h-10 text-border" strokeWidth={2} />
            </div>
            <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-pink border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-2">
              PUBLIC QUEUE
            </span>
            <h2 className="font-display font-black text-2xl mb-2 text-border tracking-tight">
              Quick Match
            </h2>
            <p className="mb-6 font-body text-border/70 text-xs font-medium max-w-xs">
              Jump into the matchmaking queue to face a random opponent in real time. Winner earns rating points.
            </p>
          </div>

          <button
            onClick={handleFindMatch}
            disabled={isSearching || isCreatingPrivate || isJoiningPrivate}
            className="btn-brutal bg-primary px-6 py-3 w-full font-bold flex items-center justify-center gap-2 text-border text-sm shadow-brutal-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching for opponent...
              </>
            ) : (
              'Find Public Match'
            )}
          </button>
        </div>

        {/* Card 2: Play with Friend (Private Room) */}
        <div className={`card-brutal p-6 text-center bg-surface border-3 border-border shadow-brutal flex flex-col items-center justify-between ${hasInviteFromUrl ? 'ring-4 ring-primary' : ''}`}>
          <div className="flex flex-col items-center w-full">
            <div className="p-4 bg-pastel-purple rounded-brutal border-3 border-border shadow-brutal-sm mb-4">
              <UserPlus className="w-10 h-10 text-border" strokeWidth={2} />
            </div>
            <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-purple border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-2">
              PRIVATE DUEL
            </span>
            <h2 className="font-display font-black text-2xl mb-2 text-border tracking-tight">
              Play with a Friend
            </h2>
            <p className="mb-4 font-body text-border/70 text-xs font-medium max-w-xs">
              Create a private room to share a direct link with a friend, or enter a 6-letter room code to join.
            </p>

            {/* Create Lobby Button */}
            <button
              onClick={handleCreatePrivateMatch}
              disabled={isCreatingPrivate || isSearching || isJoiningPrivate}
              className="btn-brutal bg-pastel-purple px-6 py-2.5 w-full font-bold flex items-center justify-center gap-2 text-border text-xs mb-4 shadow-brutal-sm disabled:opacity-70"
            >
              {isCreatingPrivate ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating room...
                </>
              ) : (
                'Create Private Room'
              )}
            </button>

            {/* Divider */}
            <div className="w-full flex items-center gap-2 my-2">
              <div className="flex-1 h-0.5 bg-border/20"></div>
              <span className="text-[10px] font-display font-black uppercase tracking-wider text-border/50">
                or enter code
              </span>
              <div className="flex-1 h-0.5 bg-border/20"></div>
            </div>

            {/* Join Code Input Form */}
            <form onSubmit={handleJoinPrivateMatch} className="w-full flex gap-2 mt-2">
              <input
                type="text"
                maxLength={6}
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="CODE"
                className="input-brutal flex-1 py-2 px-3 text-center uppercase tracking-widest font-mono font-black text-sm text-border bg-white"
              />
              <button
                type="submit"
                disabled={!inviteCodeInput.trim() || isJoiningPrivate || isSearching || isCreatingPrivate}
                className="btn-brutal bg-primary px-4 py-2 font-bold text-xs text-border flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isJoiningPrivate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
              </button>
            </form>
          </div>

          {hasInviteFromUrl && (
            <p className="text-[11px] font-display font-bold text-correct mt-3">
              Invite code detected! Click Join to start the duel.
            </p>
          )}
        </div>
      </div>

      {/* Live Duels / Spectator Section */}
      <div className="w-full max-w-4xl">
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
