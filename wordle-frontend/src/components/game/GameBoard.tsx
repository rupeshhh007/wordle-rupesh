'use client';

import React from 'react';
import { GameRow } from './GameRow';
import { BoardGuess } from '@/types/api';

interface GameBoardProps {
  guesses: BoardGuess[];
  currentGuess: string;
  maxAttempts?: number;
  isActive: boolean;
  shake?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  currentGuess,
  maxAttempts = 6,
  isActive,
  shake
}) => {
  const rows = Array.from({ length: maxAttempts });

  return (
    <div className="flex flex-col gap-1.5 items-center justify-center">
      {rows.map((_, i) => {
        const guess = guesses[i];
        const isCurrentRow = i === guesses.length;

        return (
          <GameRow
            key={i}
            rowIndex={i}
            guess={guess}
            currentInput={isCurrentRow ? currentGuess : undefined}
            isActive={isCurrentRow && isActive}
            shake={isCurrentRow ? shake : false}
          />
        );
      })}
    </div>
  );
};
