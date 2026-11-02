"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CameraView } from "@/components/scan/CameraView";
import { StorageSelector } from "@/components/scan/StorageSelector";
import { scanFruit, ApiError } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ScanPage() {
  const router = useRouter();
  const [storage, setStorage] = useState("fridge");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const handleCapture = async (file: File) => {
    setScanning(true);
    setError(null);
    setLastFile(file);

    try {
      const result = await scanFruit(file);
      sessionStorage.setItem("scanResult", JSON.stringify(result));
      sessionStorage.setItem("scanStorage", storage);
      router.push("/results");
    } catch (err) {
      if (err instanceof ApiError) {
        // Show the API's message verbatim (covers both timeout and server errors).
        // Only replace generic fetch-failure text with a friendlier message.
        if (err.detail.toLowerCase().includes("failed to fetch")) {
          setError("Can't reach the server. Check your connection and try again.");
        } else {
          setError(err.detail);
        }
      } else {
        setError("Can't reach the server. Check your connection and try again.");
      }
      setScanning(false);
    }
  };

  const retryLastScan = () => {
    if (lastFile) handleCapture(lastFile);
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">fresco</h1>
      </div>

      {/* Camera / Upload */}
      <CameraView onCapture={handleCapture} disabled={scanning} />

      {/* Error with retry */}
      {error && (
        <div className="mt-3">
          <ErrorState
            message={error}
            onRetry={lastFile ? retryLastScan : undefined}
            compact
          />
        </div>
      )}

      {/* Storage selector */}
      <div className="mt-5">
        <p className="text-xs text-text-muted mb-2">Where will you store it?</p>
        <StorageSelector selected={storage} onChange={setStorage} />
      </div>

      {/* Full-screen scanning overlay */}
      {scanning && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <span className="block h-12 w-12 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
          </div>
          <p className="text-base font-medium text-text">Analyzing your fruit…</p>
          <p className="text-xs text-text-muted">This takes a few seconds</p>
        </div>
      )}
    </div>
  );
}
