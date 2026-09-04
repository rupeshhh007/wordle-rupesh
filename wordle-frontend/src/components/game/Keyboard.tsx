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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        onKeyPress(key);
      } else if (key === 'ENTER') {
        onKeyPress('ENTER');
      } else if (key === 'BACKSPACE') {
        onKeyPress('BACKSPACE');
      }
    },
    [disabled, onKeyPress]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getKeyClass = (key: string) => {
    let classes = 'flex items-center justify-center font-display font-bold text-sm rounded-lg transition-colors active:translate-y-[1px] ';
    
    if (key === 'ENTER' || key === 'BACKSPACE') {
      classes += 'min-w-[60px] sm:min-w-[72px] h-[52px] sm:h-[58px] text-xs ';
    } else {
      classes += 'min-w-[32px] sm:min-w-[40px] h-[52px] sm:h-[58px] ';
    }

    const state = keyboardState.get(key);
    if (state === 'CORRECT') {
      classes += 'bg-correct text-white border-2 border-transparent ';
    } else if (state === 'PRESENT') {
      classes += 'bg-present text-border border-2 border-transparent ';
    } else if (state === 'ABSENT') {
      classes += 'bg-absent text-white border-2 border-transparent ';
    } else {
      classes += 'bg-surface border-2 border-border text-border ';
    }
    
    if (disabled) {
      classes += 'opacity-50 cursor-not-allowed ';
    } else {
      classes += 'cursor-pointer hover:opacity-90 ';
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
