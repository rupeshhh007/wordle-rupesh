'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getDailyGame, submitDailyGuess, getDailyResult } from '@/lib/api/daily';
import { getStats } from '@/lib/api/stats';
import { 
  BoardGuess, 
  toBoardGuess, 
  GuessResponse, 
  GameStatus, 
  LetterResult 
} from '@/types/api';
import { GameBoard } from '@/components/game/GameBoard';
import { Keyboard } from '@/components/game/Keyboard';
import { useGameInput } from '@/hooks/useGameInput';
import { Flame } from 'lucide-react';
import type { StatsResponse } from '@/types/api';

function updateKeyboardState(
  map: Map<string, LetterResult>, 
  guess: string, 
  result: LetterResult[]
): Map<string, LetterResult> {
  const newMap = new Map(map);
  const priority = { CORRECT: 3, PRESENT: 2, ABSENT: 1 };
  
  for (let i = 0; i < 5; i++) {
    const letter = guess[i].toUpperCase();
    const current = newMap.get(letter);
    if (!current || priority[result[i]] > priority[current]) {
      newMap.set(letter, result[i]);
    }
  }
  return newMap;
}

export default function DailyPage() {
  const [gameId, setGameId] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus>('IN_PROGRESS');
  const [guesses, setGuesses] = useState<GuessResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardState, setKeyboardState] = useState<Map<string, LetterResult>>(new Map());
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  



  const handleSubmit = async (guess: string) => {
    if (guess.length !== 5 || isSubmitting || status !== 'IN_PROGRESS') return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await submitDailyGuess({ guess: guess.toLowerCase() });
      
      setGuesses((prev) => {
        const next = [...prev, res];
        return next;
      });
      
      setKeyboardState((prev) => updateKeyboardState(prev, res.guess, res.result));
      setStatus(res.gameStatus);

      if (res.gameStatus === 'WON' || res.gameStatus === 'LOST') {
        try {
          const s = await getStats();
          setStats(s);
        } catch (e: any) {
          // stats fetch failed, ignore for now
        }
      }

      clearGuess();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit guess');
      // To trigger a shake for error, we rely on standard useGameInput behavior if it triggers on error
      // or we just show the error message.
    } finally {
      setIsSubmitting(false);
    }
  };

  const { currentGuess, handleKeyPress, shake, clearGuess } = useGameInput({
    onSubmit: handleSubmit,
    isActive: status === 'IN_PROGRESS' && !isSubmitting
  });



  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const game = await getDailyGame();
        if (!mounted) return;

        setGameId(game.id);
        setStatus(game.status);

        if ((game.status === 'IN_PROGRESS' && game.attemptCount > 0) || game.status === 'WON' || game.status === 'LOST') {
          const details = await getDailyResult();
          if (!mounted) return;
          
          setGuesses(details.guesses || []);
          
          let currentMap = new Map<string, LetterResult>();
          for (const g of (details.guesses || [])) {
            currentMap = updateKeyboardState(currentMap, g.guess, g.result);
          }
          setKeyboardState(currentMap);
        }

        if (game.status === 'WON' || game.status === 'LOST') {
          try {
            const s = await getStats();
            if (mounted) setStats(s);
          } catch (e: any) {
            // Ignore stats error
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load today\'s challenge');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg">
        <p className="animate-pulse text-xl font-bold font-display text-border">
          Loading today&apos;s challenge...
        </p>
      </div>
    );
  }

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const isActive = status === 'IN_PROGRESS' && !isSubmitting;
  const boardGuesses = guesses.map(toBoardGuess);

  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 bg-bg">
      <div className="w-full max-w-lg">
        <header className="mb-8 flex flex-col items-center text-center">
          <span className="text-xs font-display font-black tracking-widest text-border/70 uppercase px-3 py-0.5 bg-pastel-yellow border-2 border-border rounded-sm shadow-[1px_1px_0px_#1A1A2E] mb-2">
            DAILY WORDLE
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-border tracking-tight">
            Today&apos;s Challenge
          </h1>
          <p className="font-body text-border/70 font-medium text-sm mt-1">
            {todayFormatted}
          </p>
          {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-brutal border-2 border-border bg-pastel-yellow px-3 py-1 font-display font-bold text-xs shadow-brutal-sm text-border">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>{stats.currentStreak} Day Streak</span>
            </div>
          )}
        </header>

        <div className="mb-8">
          <GameBoard
            guesses={boardGuesses}
            currentGuess={currentGuess}
            maxAttempts={6}
            isActive={isActive}
            shake={shake}
          />
        </div>

        {(status === 'WON' || status === 'LOST') ? (
          <div className="relative w-full">
            <div className="card-brutal mt-4 flex flex-col items-center bg-surface border-3 border-border rounded-brutal p-6 shadow-brutal text-center text-border">
              {status === 'WON' ? (
                <>
                  <span className="px-3 py-1 rounded-sm bg-correct text-white border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                    PUZZLE SOLVED
                  </span>
                  <h2 className="font-display text-3xl font-black text-border">
                    Brilliant!
                  </h2>
                  <p className="font-body mb-5 font-semibold text-border/80 text-sm mt-1">
                    Solved in {guesses.length} {guesses.length === 1 ? 'attempt' : 'attempts'}
                  </p>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 rounded-sm bg-absent text-white border-2 border-border text-xs font-display font-black tracking-wider uppercase mb-3 shadow-[1px_1px_0px_#1A1A2E]">
                    ROUND OVER
                  </span>
                  <h2 className="font-display text-3xl font-black text-border">
                    Better luck tomorrow!
                  </h2>
                  <p className="font-body mb-5 font-semibold text-border/80 text-sm mt-1">
                    Come back tomorrow for a fresh word puzzle.
                  </p>
                </>
              )}

              {stats && (
                <div className="mb-6 font-display font-bold text-xs bg-pastel-green px-4 py-1.5 rounded-brutal border-2 border-border shadow-brutal-sm inline-flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span>Current Streak: {stats.currentStreak} days</span>
                </div>
              )}

              <div className="flex gap-4 w-full justify-center">
                <Link 
                  href="/stats"
                  className="btn-brutal px-6 py-2.5 bg-pastel-purple text-border font-bold text-sm"
                >
                  View Stats
                </Link>
                <Link 
                  href="/"
                  className="btn-brutal px-6 py-2.5 bg-pastel-blue text-border font-bold text-sm"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Keyboard
              keyboardState={keyboardState}
              onKeyPress={handleKeyPress}
              disabled={!isActive}
            />
            {error && (
              <div className="mt-4 bg-pastel-pink rounded-sm p-2 text-sm border-2 border-border font-bold text-border text-center w-full max-w-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
