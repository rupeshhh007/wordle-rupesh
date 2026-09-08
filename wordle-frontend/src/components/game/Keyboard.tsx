'use client';

import React, { useEffect, useCallback } from 'react';
import { LetterResult } from '@/types/api';

interface KeyboardProps {
  keyboardState: Map<string, LetterResult>;
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export const Keyboard: React.FC<KeyboardProps> = ({ keyboardState, onKeyPress, disabled }) => {
  const handleKeyClick = (key: string) => {
    if (!disabled) {
      onKeyPress(key);
    }
  };

  // The Keyboard component strictly renders the virtual keys.
  // Physical keyboard input is managed entirely by useGameInput.

  const getKeyClass = (key: string) => {
    let classes = 'btn-key flex items-center justify-center font-display font-bold text-sm rounded-lg ';
    
    if (key === 'ENTER' || key === 'BACKSPACE') {
      classes += 'min-w-[58px] sm:min-w-[70px] h-[50px] sm:h-[56px] text-xs ';
    } else {
      classes += 'min-w-[32px] sm:min-w-[40px] h-[50px] sm:h-[56px] ';
    }

    const state = keyboardState.get(key);
    if (state === 'CORRECT') {
      classes += 'bg-correct text-white border-border ';
    } else if (state === 'PRESENT') {
      classes += 'bg-present text-border border-border ';
    } else if (state === 'ABSENT') {
      classes += 'bg-absent text-white border-border ';
    } else {
      classes += 'bg-surface text-border border-border ';
    }
    
    return classes;
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full max-w-lg px-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex flex-row gap-1 sm:gap-2 justify-center w-full">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
              className={getKeyClass(key)}
              aria-label={key === 'BACKSPACE' ? 'Backspace' : key}
            >
              {key === 'BACKSPACE' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
