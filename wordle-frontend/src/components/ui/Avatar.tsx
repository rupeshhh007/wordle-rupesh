'use client';

import { useState } from 'react';

export interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES = {
  sm: {
    container: 'h-8 w-8 border-2 shadow-brutal-sm',
    text: 'text-xs',
  },
  md: {
    container: 'h-10 w-10 border-2 shadow-brutal-sm',
    text: 'text-sm',
  },
  lg: {
    container: 'h-16 w-16 border-3 shadow-brutal',
    text: 'text-2xl',
  },
};

export function Avatar({ username, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [prevUsername, setPrevUsername] = useState(username);

  if (prevUsername !== username) {
    setPrevUsername(username);
    setHasError(false);
  }

  const { container, text } = SIZE_STYLES[size];
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(username)}`;
  const fallbackLetter = username?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-border bg-primary overflow-hidden shrink-0 select-none ${container} ${className}`}
    >
      {hasError || !username ? (
        <span className={`font-display font-black text-border ${text}`}>
          {fallbackLetter}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={username}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
