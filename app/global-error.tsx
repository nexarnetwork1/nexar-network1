"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#d4af37]">Something went wrong</h1>
          <p className="mt-4 text-sm text-[#9a9a9a]">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-medium text-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
