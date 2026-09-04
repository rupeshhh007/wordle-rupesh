export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState = ({ message = 'Loading...', className = '' }: LoadingStateProps) => {
  return (
    <div className={`flex min-h-[200px] w-full flex-col items-center justify-center gap-4 ${className}`}>
      <div className="flex gap-2">
        <div className="h-3 w-3 animate-bounce rounded-full bg-border" style={{ animationDelay: '0ms' }}></div>
        <div className="h-3 w-3 animate-bounce rounded-full bg-border" style={{ animationDelay: '150ms' }}></div>
        <div className="h-3 w-3 animate-bounce rounded-full bg-border" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="font-display text-text-secondary font-medium">
        {message}
      </p>
    </div>
  );
};
