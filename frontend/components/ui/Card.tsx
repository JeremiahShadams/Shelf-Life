import { ReactNode } from "react";

type StatusBorder = "safe" | "warning" | "danger" | "none";

interface CardProps {
  children: ReactNode;
  statusBorder?: StatusBorder;
  className?: string;
  onClick?: () => void;
}

const borderStyles: Record<StatusBorder, string> = {
  safe: "border-l-[3px] border-l-safe",
  warning: "border-l-[3px] border-l-warning",
  danger: "border-l-[3px] border-l-danger",
  none: "",
};

export function Card({ children, statusBorder = "none", className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        bg-surface border border-border rounded-2xl p-4
        shadow-[var(--shadow-sm)]
        ${borderStyles[statusBorder]}
        ${onClick ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:translate-y-[-1px] active:translate-y-0 transition-all duration-150" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
