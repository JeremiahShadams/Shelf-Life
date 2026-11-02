"use client";

import { useEffect, useState, useCallback } from "react";
import { InventoryList, FloatingAddButton, type InventoryItemData } from "@/components/inventory";
import { getInventory, deleteInventoryItem, ApiError, type InventoryListResponse } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type FilterTab = "all" | "eat_first" | "fresh" | "expired";

function filterItems(items: InventoryItemData[], tab: FilterTab): InventoryItemData[] {
  switch (tab) {
    case "eat_first":
      return items
        .filter((i) => !i.isExpired && i.daysLeft <= 3)
        .sort((a, b) => a.daysLeft - b.daysLeft);
    case "fresh":
      return items
        .filter((i) => !i.isExpired && i.daysLeft > 3)
        .sort((a, b) => b.daysLeft - a.daysLeft);
    case "expired":
      return items.filter((i) => i.isExpired);
    default:
      return [...items].sort((a, b) => a.daysLeft - b.daysLeft);
  }
}

const tabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "eat_first", label: "Eat First" },
  { value: "fresh", label: "Fresh" },
  { value: "expired", label: "Expired" },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("eat_first");
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, expiring_soon: 0, expired: 0 });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data: InventoryListResponse = await getInventory();

      const mapped: InventoryItemData[] = data.items.map((item) => ({
        id: item.id,
        fruitName: item.fruit.name,
        subcategory: item.fruit.subcategory,
        storageMethod: item.storage_method,
        daysLeft: item.estimated_days_remaining,
        isExpired: item.is_expired,
      }));

      setItems(mapped);
      setStats({
        total: data.total,
        expiring_soon: data.expiring_soon,
        expired: data.expired,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0 || err.detail.includes("fetch")) {
          setError("Can't reach the server. Check your connection and try again.");
        } else {
          setError(err.detail);
        }
      } else {
        setError("Can't reach the server. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleDelete = async (id: number) => {
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch {
      fetchInventory();
    }
  };

  const freshCount = items.filter((i) => !i.isExpired && i.daysLeft > 3).length;
  const filtered = filterItems(items, activeTab);

  return (
    <div className="flex flex-col px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <span className="text-[13px] text-text-muted">{stats.total} items</span>
      </div>

      {/* Summary strip */}
      {!loading && !error && items.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          <span className="text-[13px] font-medium text-warning bg-warning/8 border border-warning/15 rounded-xl px-3 py-1.5 whitespace-nowrap">
            {stats.expiring_soon} expiring
          </span>
          <span className="text-[13px] font-medium text-danger bg-danger/8 border border-danger/15 rounded-xl px-3 py-1.5 whitespace-nowrap">
            {stats.expired} expired
          </span>
          <span className="text-[13px] font-medium text-safe bg-safe/8 border border-safe/15 rounded-xl px-3 py-1.5 whitespace-nowrap">
            {freshCount} fresh
          </span>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && !error && items.length > 0 && (
        <div className="flex gap-4 border-b border-border mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                pb-2 text-sm font-medium min-h-0
                transition-colors duration-150
                ${
                  activeTab === tab.value
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-muted"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="h-8 w-8 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-text-muted">Loading inventory…</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <ErrorState
          title="Couldn't load inventory"
          message={error}
          onRetry={fetchInventory}
        />
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon="🍎"
          title="No items yet"
          message="Scan a fruit and tap 'Add to Inventory' to start tracking."
          action={{ label: "Scan a fruit", href: "/scan" }}
        />
      )}

      {/* Empty filter state */}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No items here"
          message={`No items match the "${activeTab.replace("_", " ")}" filter.`}
        />
      )}

      {/* List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="animate-stagger">
          <InventoryList items={filtered} onItemClick={handleDelete} />
        </div>
      )}

      {/* FAB */}
      <FloatingAddButton />
    </div>
  );
}
