export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState = ({ message = 'Loading...', className = '' }: LoadingStateProps) => {
  return (
    <div className={`flex min-h-[200px] w-full flex-col items-center justify-center gap-4 ${className}`}>
      <div className="flex gap-2.5">
        <div className="h-3.5 w-3.5 animate-bounce rounded-full bg-primary border-2 border-border shadow-[1px_1px_0px_#1A1A2E]" style={{ animationDelay: '0ms' }} />
        <div className="h-3.5 w-3.5 animate-bounce rounded-full bg-pastel-pink border-2 border-border shadow-[1px_1px_0px_#1A1A2E]" style={{ animationDelay: '150ms' }} />
        <div className="h-3.5 w-3.5 animate-bounce rounded-full bg-pastel-green border-2 border-border shadow-[1px_1px_0px_#1A1A2E]" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="font-display text-text-secondary font-bold text-sm tracking-wide">
        {message}
      </p>
    </div>
  );
};
