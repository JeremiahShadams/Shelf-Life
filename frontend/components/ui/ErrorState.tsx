"use client";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="p-3 bg-danger/8 border border-danger/15 rounded-2xl">
        <p className="text-sm text-danger font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-danger/70 underline mt-1.5 min-h-0"
          >
            Tap to retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4 max-w-[280px]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 active:scale-[0.97] transition-all min-h-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
