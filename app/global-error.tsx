"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { captureException } from "@/lib/monitoring/sentry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#101010]/80 p-8 text-center backdrop-blur-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold text-[#d4af37]">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">
            A critical error occurred. The issue has been logged. You can retry, reload, or return
            home.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-[#9a9a9a]/70">Reference: {error.digest}</p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-medium text-black"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-[#1a1a1a] px-6 py-3 text-sm text-white"
            >
              Reload page
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1a1a1a] px-6 py-3 text-sm text-white"
            >
              <Home className="h-4 w-4" aria-hidden />
              Return home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
