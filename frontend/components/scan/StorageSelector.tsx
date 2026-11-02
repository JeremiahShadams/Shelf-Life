"use client";

interface StorageSelectorProps {
  selected: string;
  onChange: (method: string) => void;
}

const methods = [
  { value: "room_temp", label: "Room Temp" },
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
];

export function StorageSelector({ selected, onChange }: StorageSelectorProps) {
  return (
    <div className="flex gap-2">
      {methods.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`
            flex-1 py-2.5 px-4 rounded-[10px] text-sm font-medium
            transition-colors duration-150 min-h-0
            ${
              selected === m.value
                ? "bg-accent text-white"
                : "bg-surface text-text-muted border border-border"
            }
          `}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
