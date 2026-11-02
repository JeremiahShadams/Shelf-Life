"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StatusBadge,
  DaysLeftDisplay,
  RecommendationText,
  StorageBreakdown,
  ActionButtons,
} from "@/components/result";
import { Card } from "@/components/ui/Card";
import { addToInventory, ApiError, type ScanResult } from "@/lib/api";

function getStoredScanResult(): ScanResult | null {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem("scanResult");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export default function ResultsPage() {
  const router = useRouter();
  const [result] = useState<ScanResult | null>(() => getStoredScanResult());
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!result) {
      router.push("/scan");
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleAdd = async () => {
    setAdding(true);
    setAddError(null);

    try {
      const storageMethod = sessionStorage.getItem("scanStorage") || "fridge";
      await addToInventory(
        result.fruit.id,
        result.freshness_score,
        storageMethod,
      );
      setAdding(false);
      setAdded(true);
    } catch (err) {
      setAdding(false);
      if (err instanceof ApiError) {
        setAddError(err.detail);
      } else {
        setAddError("Failed to add to inventory. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/scan")}
          className="text-text-muted hover:text-text min-h-0 p-1"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-lg font-semibold">fresco</span>
      </div>

      <div className="flex flex-col items-center gap-4 mb-8">
        <StatusBadge status={result.status} />

        <div className="text-center">
          <h2 className="text-2xl font-bold">{result.fruit.name}</h2>
          <p className="text-xs text-text-muted">{result.fruit.subcategory}</p>
        </div>

        <DaysLeftDisplay days={result.days_left} status={result.status} />

        <RecommendationText
          text={result.recommendation}
          sublabel={`${result.freshness_label} Â· ${Math.round(result.confidence * 100)}% confidence`}
        />
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <StorageBreakdown
          shelfLife={result.estimated_shelf_life}
          recommended={result.best_storage}
        />

        {result.storage_tip && (
          <Card>
            <div className="flex gap-2">
              <span className="text-sm">ðŸ’¡</span>
              <p className="text-sm text-text">{result.storage_tip}</p>
            </div>
          </Card>
        )}

        {result.ethylene_note && (
          <Card statusBorder="warning">
            <p className="text-[13px] text-text">{result.ethylene_note}</p>
          </Card>
        )}
      </div>

      {addError && (
        <div className="mx-4 mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-sm text-danger">{addError}</p>
        </div>
      )}

      <div className="fixed bottom-14 left-0 right-0 bg-bg border-t border-border">
        <div className="mx-auto max-w-[480px]">
          <ActionButtons
            onAddToInventory={handleAdd}
            onScanAgain={() => router.push("/scan")}
            addingToInventory={adding}
            addedToInventory={added}
          />
        </div>
      </div>
    </div>
  );
}
