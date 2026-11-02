"use client";

interface ScanButtonProps {
  onScan: () => void;
  loading?: boolean;
}

export function ScanButton({ onScan, loading }: ScanButtonProps) {
  return (
    <button
      onClick={onScan}
      disabled={loading}
      className={`
        w-16 h-16 rounded-full bg-accent text-white
        flex items-center justify-center
        active:scale-95 transition-transform duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? "animate-pulse" : ""}
      `}
      aria-label="Scan fruit"
    >
      {loading ? (
        <span className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      )}
    </button>
  );
}
