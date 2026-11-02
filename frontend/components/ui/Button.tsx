"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 active:scale-[0.97] transition-transform duration-100",
  secondary:
    "bg-surface text-text border border-border hover:bg-bg active:scale-[0.97] transition-transform duration-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", fullWidth = false, loading, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          rounded-xl px-6 py-3.5 text-sm font-semibold
          min-h-[48px] cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
