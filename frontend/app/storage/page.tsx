"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { checkCompatibility, getFruits, ApiError, type CompatibilityResult, type FruitData } from "@/lib/api";

export default function StoragePage() {
  const [allFruits, setAllFruits] = useState<FruitData[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fruitsError, setFruitsError] = useState<string | null>(null);

  const fetchFruits = () => {
    setFruitsError(null);
    getFruits(1, 100)
      .then((data) => setAllFruits(data.items))
      .catch(() => setFruitsError("Can't load fruit list. Check your connection."));
  };

  useEffect(() => {
    fetchFruits();
  }, []);

  const fruitNames = allFruits.map((f) => f.name);
  const filtered = fruitNames.filter(
    (f) => f.toLowerCase().includes(search.toLowerCase()) && !selected.includes(f)
  );

  const addFruit = (name: string) => {
    setSelected([...selected, name]);
    setSearch("");
    setResult(null);
  };

  const removeFruit = (name: string) => {
    setSelected(selected.filter((f) => f !== name));
    setResult(null);
  };

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const data = await checkCompatibility(selected);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Failed to check compatibility. Please try again.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold mb-1">Storage Check</h1>
      <p className="text-sm text-text-muted mb-6">
        Check if your fruits can be stored together.
      </p>

      {/* Search input */}
      <div className="relative mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={allFruits.length ? "Search fruits to add..." : "Loading fruits..."}
          className="w-full h-12 px-4 text-sm bg-surface border border-border rounded-[10px] placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        {search && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-sm max-h-40 overflow-y-auto z-10">
            {filtered.slice(0, 8).map((f) => (
              <button
                key={f}
                onClick={() => addFruit(f)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg transition-colors min-h-0"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selected.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] bg-bg border border-border rounded-md"
            >
              {f}
              <button
                onClick={() => removeFruit(f)}
                className="text-text-muted hover:text-text ml-1 min-h-0"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Check button */}
      <Button
        fullWidth
        onClick={handleCheck}
        disabled={selected.length < 2}
        loading={checking}
      >
        {checking ? "Checking..." : "Check Compatibility"}
      </Button>

      {/* Fruits load error */}
      {fruitsError && (
        <div className="mb-4">
          <ErrorState message={fruitsError} onRetry={fetchFruits} compact />
        </div>
      )}

      {/* Compatibility error */}
      {error && (
        <div className="mt-4">
          <ErrorState message={error} onRetry={handleCheck} compact />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3 mt-6">
          {result.incompatible_pairs.length === 0 ? (
            <Card statusBorder="safe">
              <p className="text-sm font-medium text-safe">
                ✓ All good — these fruits can be stored together.
              </p>
            </Card>
          ) : (
            <>
              {result.incompatible_pairs.map((pair, i) => (
                <Card key={i} statusBorder="warning">
                  <p className="text-sm">
                    <span className="font-semibold">{pair.producer}</span>
                    {" → "}
                    <span className="font-semibold">{pair.sensitive}</span>
                  </p>
                  <p className="text-[13px] text-text-muted mt-1">{pair.warning}</p>
                </Card>
              ))}

              {/* Overall recommendation */}
              <Card>
                <p className="text-sm font-medium">{result.recommendation}</p>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
