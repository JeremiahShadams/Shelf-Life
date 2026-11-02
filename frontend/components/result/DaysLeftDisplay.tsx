type Status = "FRESH" | "EAT_SOON" | "EAT_TODAY" | "SPOILED";

interface DaysLeftDisplayProps {
  days: number;
  status: Status;
}

const colorMap: Record<Status, string> = {
  FRESH: "text-safe",
  EAT_SOON: "text-warning",
  EAT_TODAY: "text-danger",
  SPOILED: "text-danger",
};

export function DaysLeftDisplay({ days, status }: DaysLeftDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-5xl font-bold ${colorMap[status]}`}>
        {days < 1 ? "<1" : Math.round(days)}
      </span>
      <span className="text-sm text-text-muted mt-1">
        {days <= 0 ? "expired" : days === 1 ? "day left" : "days left"}
      </span>
    </div>
  );
}
