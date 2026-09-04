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

  // We wrap our submit logic so it can be called by UI keyboard or physical Enter key
  const submitGuess = useCallback(async () => {
    // Rely on currentGuess being enclosed if useGameInput manages it
    // Note: The actual currentGuess value comes from useGameInput, so we need it in scope
  }, []); // We will redefine this below to capture currentGuess properly

  const { currentGuess, handleKeyPress, shake, clearGuess } = useGameInput({
    onSubmit: submitGuess,
    isActive: status === 'IN_PROGRESS' && !isSubmitting
  });

  // Redefine submit logic with fresh state
  const handleSubmit = async () => {
    if (currentGuess.length !== 5 || isSubmitting || status !== 'IN_PROGRESS') return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await submitDailyGuess({ guess: currentGuess.toLowerCase() });
      
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

  const onKeyPress = (key: string) => {
    if (key === 'ENTER') {
      handleSubmit();
    } else {
      handleKeyPress(key);
    }
  };

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
          <h1 className="font-display font-bold text-2xl text-border mb-2">
            Daily Challenge
          </h1>
          <p className="font-body text-border/80 font-medium">
            {todayFormatted}
          </p>
          {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
            <div className="mt-3 inline-block rounded-brutal border-3 border-border bg-pastel-yellow px-4 py-1 font-bold text-sm shadow-brutal text-border">
              🔥 {stats.currentStreak} Day Streak
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
          <div className="card-brutal animate-bounce-in mt-4 flex flex-col items-center bg-surface border-3 border-border rounded-brutal p-6 shadow-brutal text-center text-border">
            {status === 'WON' ? (
              <>
                <h2 className="font-display text-2xl font-bold mb-2">🎉 Brilliant!</h2>
                <p className="font-body mb-4 font-medium">Solved in {guesses.length} attempt(s)</p>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold mb-2">Better luck tomorrow!</h2>
                <p className="font-body mb-4 font-medium text-border/80">
                  Keep playing to improve your skills.
                </p>
              </>
            )}

            {stats && (
              <p className="font-body mb-6 font-bold text-lg bg-pastel-green px-4 py-2 rounded-brutal border-2 border-border shadow-brutal-sm inline-block">
                Current Streak: {stats.currentStreak} days
              </p>
            )}

            <div className="flex gap-4 w-full justify-center">
              <Link 
                href="/stats"
                className="px-6 py-2 rounded-brutal border-3 border-border bg-pastel-purple font-bold hover:-translate-y-1 hover:shadow-brutal transition-all active:translate-y-0 active:shadow-none"
              >
                View Stats
              </Link>
              <Link 
                href="/"
                className="px-6 py-2 rounded-brutal border-3 border-border bg-pastel-blue font-bold hover:-translate-y-1 hover:shadow-brutal transition-all active:translate-y-0 active:shadow-none"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Keyboard
              keyboardState={keyboardState}
              onKeyPress={onKeyPress}
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
