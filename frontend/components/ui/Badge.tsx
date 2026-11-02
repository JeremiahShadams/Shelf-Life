type Status = "fresh" | "warning" | "spoiled" | "info";

interface BadgeProps {
  status: Status;
  label: string;
  size?: "sm" | "lg";
}

const statusStyles: Record<Status, string> = {
  fresh: "bg-safe/10 text-safe border border-safe/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  spoiled: "bg-danger/10 text-danger border border-danger/20",
  info: "bg-border/50 text-text border border-border",
};

const sizeStyles = {
  sm: "text-xs px-2.5 py-1 font-medium",
  lg: "text-sm px-5 py-2 font-bold uppercase tracking-wider",
};

export function Badge({ status, label, size = "sm" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full
        ${statusStyles[status]}
        ${sizeStyles[size]}
      `}
    >
      {label}
    </span>
  );
}
