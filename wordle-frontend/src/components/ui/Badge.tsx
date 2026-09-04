import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'default', children, className = '' }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center justify-center border-2 border-border rounded-full px-2.5 py-0.5 text-xs font-bold font-display';
  
  const variantClasses = {
    default: 'bg-surface text-border',
    success: 'bg-correct text-white',
    warning: 'bg-present text-border',
    danger: 'bg-danger text-white',
    info: 'bg-pastel-blue text-border',
  }[variant];

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
