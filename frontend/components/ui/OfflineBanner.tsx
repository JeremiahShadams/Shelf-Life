"use client";

import { useEffect, useState } from "react";

/**
 * Offline banner — shows a dismissible warning when the browser is offline.
 * Automatically hides when back online.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-warning text-white text-center py-2 px-4 text-sm font-medium shadow-md animate-in slide-in-from-top">
      <span>You&apos;re offline — some features may not work</span>
    </div>
  );
}
