"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-muted mb-6">
          We encountered an error loading the dashboard. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-semibold text-background transition hover:bg-gold/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
