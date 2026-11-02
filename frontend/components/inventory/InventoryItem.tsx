import { Card } from "@/components/ui/Card";

type Status = "fresh" | "warning" | "spoiled";

interface InventoryItemData {
  id: number;
  fruitName: string;
  subcategory: string;
  storageMethod: string;
  daysLeft: number;
  isExpired: boolean;
}

interface InventoryItemProps {
  item: InventoryItemData;
  onClick?: () => void;
}

function getStatus(days: number, isExpired: boolean): Status {
  if (isExpired || days <= 0) return "spoiled";
  if (days <= 2) return "warning";
  return "fresh";
}

const statusColors: Record<Status, string> = {
  fresh: "text-safe",
  warning: "text-warning",
  spoiled: "text-danger",
};

const storageLabels: Record<string, string> = {
  room_temp: "room temp",
  fridge: "fridge",
  freezer: "freezer",
};

export function InventoryItem({ item, onClick }: InventoryItemProps) {
  const status = getStatus(item.daysLeft, item.isExpired);

  return (
    <Card
      statusBorder={status === "fresh" ? "none" : status === "warning" ? "warning" : "danger"}
      onClick={onClick}
      className={item.isExpired ? "opacity-60" : ""}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">{item.fruitName}</span>
          <span className="text-xs text-text-muted">
            {storageLabels[item.storageMethod] || item.storageMethod} · {item.subcategory}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-xl font-bold ${statusColors[status]}`}>
            {item.isExpired ? "—" : item.daysLeft < 1 ? "<1" : Math.round(item.daysLeft)}
          </span>
          <span className="text-xs text-text-muted">
            {item.isExpired ? "Expired" : "days"}
          </span>
        </div>
      </div>
    </Card>
  );
}

export type { InventoryItemData };
