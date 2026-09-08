'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Loader2 } from 'lucide-react';
import { findMatch, getActiveMatch } from '@/lib/api/arena';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ArenaLobbyPage() {
  const router = useRouter();
  const [isCheckingActive, setIsCheckingActive] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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

    // Clear any stale localStorage on lobby load
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wordle_active_arena_match');
    }

    checkActiveMatch();

    return () => {
      mounted.current = false;
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
    </div>
  );
}
