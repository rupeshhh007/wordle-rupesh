import { ReactNode } from 'react';

type AccentColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'orange';

export interface CardProps {
  accent?: AccentColor;
  className?: string;
  children: ReactNode;
}

export const Card = ({ accent, className = '', children }: CardProps) => {
  let accentClasses = '';
  
  if (accent) {
    accentClasses = 'border-t-4';
    switch (accent) {
      case 'yellow':
        accentClasses += ' border-t-pastel-yellow';
        break;
      case 'green':
        accentClasses += ' border-t-pastel-green';
        break;
      case 'pink':
        accentClasses += ' border-t-pastel-pink';
        break;
      case 'blue':
        accentClasses += ' border-t-pastel-blue';
        break;
      case 'purple':
        accentClasses += ' border-t-pastel-purple';
        break;
      case 'orange':
        accentClasses += ' border-t-pastel-orange';
        break;
    }
  }

  return (
    <div className={`card-brutal ${accentClasses} ${className}`}>
      {children}
    </div>
  );
};
