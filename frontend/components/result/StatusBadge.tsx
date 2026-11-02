import { Badge } from "@/components/ui/Badge";

type Status = "FRESH" | "EAT_SOON" | "EAT_TODAY" | "SPOILED";

interface StatusBadgeProps {
  status: Status;
}

const statusMap: Record<Status, { label: string; variant: "fresh" | "warning" | "spoiled" }> = {
  FRESH: { label: "FRESH", variant: "fresh" },
  EAT_SOON: { label: "EAT SOON", variant: "warning" },
  EAT_TODAY: { label: "EAT TODAY", variant: "spoiled" },
  SPOILED: { label: "SPOILED", variant: "spoiled" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.FRESH;
  return <Badge status={config.variant} label={config.label} size="lg" />;
}
