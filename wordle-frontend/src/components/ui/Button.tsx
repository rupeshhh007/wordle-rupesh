'use client';

import { ComponentPropsWithoutRef, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading = false, className = '', children, disabled, ...props },
    ref
  ) => {
    const baseClasses = 'font-display font-bold inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    
    let variantClasses = '';
    if (variant !== 'ghost') {
      variantClasses = 'btn-brutal border-3 border-border';
    }
    
    switch (variant) {
      case 'primary':
        variantClasses += ' bg-primary text-border hover:bg-primary-hover';
        break;
      case 'secondary':
        variantClasses += ' bg-surface text-border';
        break;
      case 'danger':
        variantClasses += ' bg-danger text-white';
        break;
      case 'ghost':
        variantClasses += ' bg-transparent border-0 shadow-none hover:bg-surface';
        break;
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3 text-lg',
    }[size];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {children}
        {isLoading && <span className="ml-1">...</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
