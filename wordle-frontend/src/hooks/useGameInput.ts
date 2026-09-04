import { useState, useCallback } from 'react';

interface UseGameInputProps {
  onSubmit: (guess: string) => void;
  isActive: boolean;
}

export function useGameInput({ onSubmit, isActive }: UseGameInputProps) {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 400);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (!isActive) return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        onSubmit(currentGuess);
      } else {
        triggerShake();
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key)) {
      setCurrentGuess((prev) => {
        if (prev.length < 5) {
          return prev + key;
        }
        return prev;
      });
    }
  }, [isActive, currentGuess, onSubmit, triggerShake]);

  const clearGuess = useCallback(() => {
    setCurrentGuess('');
  }, []);

  return {
    currentGuess,
    setCurrentGuess,
    handleKeyPress,
    shake,
    clearGuess
  };
}
