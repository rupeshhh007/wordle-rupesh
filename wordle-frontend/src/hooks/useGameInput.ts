import { useState, useCallback, useEffect } from 'react';

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

  // SINGLE owner of physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is holding modifier keys like Cmd/Ctrl to allow normal browser shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      } else if (key === 'ENTER') {
        handleKeyPress('ENTER');
      } else if (key === 'BACKSPACE') {
        handleKeyPress('BACKSPACE');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

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
