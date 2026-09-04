'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Loader2 } from 'lucide-react';
import { findMatch, getMatch, cancelMatch } from '@/lib/api/arena';
import { ArenaMatchResponse, ArenaMatchStatus } from '@/types/api';

export default function ArenaLobbyPage() {
  const router = useRouter();
  const [match, setMatch] = useState<ArenaMatchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mounted = useRef(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const handleFindMatch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      const response = await findMatch();
      
      if (!mounted.current) return;
      
      setMatch(response);
      setIsSearching(false);
      
      if (response.status === 'IN_PROGRESS') {
        router.push(`/arena/${response.id}`);
      }
    } catch (err: any) {
      if (mounted.current) {
        setIsSearching(false);
        setError(err.message || 'Failed to find match');
      }
    }
  };

  const handleCancelMatch = async () => {
    if (!match) return;
    
    try {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      
      await cancelMatch(match.id);
      
      if (mounted.current) {
        setMatch(null);
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Failed to cancel match');
      }
    }
  };

  useEffect(() => {
    if (match?.status === 'WAITING') {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }

      pollInterval.current = setInterval(async () => {
        try {
          const updatedMatch = await getMatch(match.id);
          
          if (!mounted.current) return;
          
          if (updatedMatch.status === 'IN_PROGRESS') {
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
            }
            router.push(`/arena/${updatedMatch.id}`);
          } else if (updatedMatch.status === 'CANCELLED') {
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
            }
            setMatch(updatedMatch);
          } else {
            setMatch(updatedMatch);
          }
        } catch (err: any) {
          // Silent fail on poll
        }
      }, 3000);
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [match?.status, match?.id, router]);

  if (match?.status === 'CANCELLED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card-brutal p-8 text-center max-w-lg mx-auto bg-surface">
          <h2 className="font-display font-bold text-2xl mb-4 text-border">Match Cancelled</h2>
          <p className="mb-6 text-border">The match search was cancelled.</p>
          <button 
            onClick={() => setMatch(null)}
            className="btn-brutal bg-primary px-8 py-3 text-border font-bold"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-12">
        <Swords className="w-10 h-10 text-border" strokeWidth={3} />
        <h1 className="font-display font-bold text-3xl text-border">Arena</h1>
      </div>
      
      {error && (
        <div className="w-full max-w-lg mb-6 p-4 rounded-brutal border-3 border-border shadow-brutal bg-pastel-pink text-border font-bold text-center">
          {error}
        </div>
      )}

      {match?.status === 'WAITING' ? (
        <div className="card-brutal p-8 text-center max-w-lg mx-auto w-full border-3 border-border shadow-brutal animate-pulse">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <h2 className="font-display font-bold text-xl mb-2 text-border">Waiting for opponent...</h2>
          <p className="text-border/70 mb-8 font-body">Match #{match.id}</p>
          
          <button 
            onClick={handleCancelMatch}
            className="btn-brutal bg-pastel-pink px-8 py-3 w-full font-bold text-border"
          >
            Cancel Match
          </button>
        </div>
      ) : (
        <div className="card-brutal p-8 text-center max-w-lg mx-auto w-full bg-surface border-3 border-border shadow-brutal">
          <div className="flex justify-center mb-6">
            <Swords className="w-20 h-20 text-primary" strokeWidth={2} />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2 text-border">Arena Mode</h2>
          <p className="mb-8 font-body text-border">1v1 competitive matches. First to solve wins!</p>
          
          <button 
            onClick={handleFindMatch}
            disabled={isSearching}
            className="btn-brutal bg-primary px-8 py-3 w-full font-bold flex items-center justify-center gap-2 text-border disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding opponent...
              </>
            ) : (
              'Find Match'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
