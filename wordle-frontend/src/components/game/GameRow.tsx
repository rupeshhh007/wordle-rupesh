'use client';

import React from 'react';
import { LetterTile } from './LetterTile';
import { BoardGuess } from '@/types/api';

interface GameRowProps {
  guess?: BoardGuess;
  currentInput?: string;
  isActive?: boolean;
  shake?: boolean;
  rowIndex?: number;
}

export const GameRow: React.FC<GameRowProps> = ({ guess, currentInput = '', isActive, shake, rowIndex = 0 }) => {
  const tiles = Array.from({ length: 5 });

  return (
    <div className={`flex flex-row gap-1.5 ${shake ? 'animate-tile-shake' : ''}`}>
      {tiles.map((_, i) => {
        if (guess) {
          return (
            <LetterTile
              key={i}
              letter={guess.word[i]}
              result={guess.result[i]}
              state="submitted"
              delay={i * 100}
            />
          );
        }

        if (isActive) {
          const letter = currentInput[i];
          return (
            <LetterTile
              key={i}
              letter={letter}
              state={letter ? 'active' : 'empty'}
            />
          );
        }

        return <LetterTile key={i} state="empty" />;
      })}
    </div>
  );
};
