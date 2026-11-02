import { Card } from "@/components/ui/Card";

interface StorageBreakdownProps {
  shelfLife: Record<string, number>;
  recommended: string;
}

const labels: Record<string, { label: string; icon: string }> = {
  room_temp: { label: "Room Temp", icon: "🌡" },
  fridge: { label: "Fridge", icon: "❄️" },
  freezer: { label: "Freezer", icon: "🧊" },
};

export function StorageBreakdown({ shelfLife, recommended }: StorageBreakdownProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Shelf Life by Storage</h3>
      <div className="flex flex-col gap-2">
        {Object.entries(shelfLife).map(([method, days]) => {
          const config = labels[method] || { label: method, icon: "📦" };
          const isRecommended = method === recommended;
          return (
            <div
              key={method}
              className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                isRecommended ? "bg-bg" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{config.icon}</span>
                <span className="text-sm font-medium">{config.label}</span>
                {isRecommended && (
                  <span className="text-xs text-safe font-medium">Recommended</span>
                )}
              </div>
              <span className="text-sm font-semibold">
                {days < 1 ? "<1" : Math.round(days)} days
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
