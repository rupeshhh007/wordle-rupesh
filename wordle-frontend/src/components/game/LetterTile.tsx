'use client';

import React, { useEffect, useState } from 'react';
import { LetterResult } from '@/types/api';

interface LetterTileProps {
  letter?: string;
  result?: LetterResult;
  state: 'empty' | 'active' | 'submitted';
  delay?: number;
}

export const LetterTile: React.FC<LetterTileProps> = ({ letter, result, state, delay = 0 }) => {
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    if (state === 'active' && letter) {
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 150);
      return () => clearTimeout(timer);
    }
  }, [letter, state]);

  const baseClasses = 'flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 text-2xl font-display font-bold uppercase transition-all duration-300';
  let stateClasses = '';

  if (state === 'empty') {
    stateClasses = 'bg-tile-empty border-3 border-border/20 text-transparent';
  } else if (state === 'active') {
    stateClasses = 'bg-surface border-3 border-border text-border shadow-brutal-sm';
    if (isPopping) stateClasses += ' animate-tile-pop';
  } else if (state === 'submitted') {
    if (result === 'CORRECT') stateClasses = 'bg-correct border-3 border-border text-white shadow-brutal-sm animate-tile-flip';
    else if (result === 'PRESENT') stateClasses = 'bg-present border-3 border-border text-border shadow-brutal-sm animate-tile-flip';
    else if (result === 'ABSENT') stateClasses = 'bg-absent border-3 border-border text-white shadow-brutal-sm animate-tile-flip';
  }

  const style = delay > 0 && state === 'submitted' ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <div className={`${baseClasses} ${stateClasses}`} style={style}>
      {letter}
    </div>
  );
};
