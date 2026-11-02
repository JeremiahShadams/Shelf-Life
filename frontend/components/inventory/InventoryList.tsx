"use client";

import { InventoryItem, type InventoryItemData } from "./InventoryItem";

interface InventoryListProps {
  items: InventoryItemData[];
  onItemClick?: (id: number) => void;
}

export function InventoryList({ items, onItemClick }: InventoryListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted mb-3">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <p className="text-[15px] font-medium text-text-muted">No fruits tracked yet</p>
        <p className="text-sm text-text-muted mt-1">Scan your first fruit to start tracking</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <InventoryItem
          key={item.id}
          item={item}
          onClick={onItemClick ? () => onItemClick(item.id) : undefined}
        />
      ))}
    </div>
  );
}
