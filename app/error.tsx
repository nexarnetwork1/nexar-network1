"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { captureException } from "@/lib/monitoring/sentry";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "route" });
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md nxr-card p-8 text-center shadow-xl shadow-black/20 backdrop-blur-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We hit an unexpected error while loading this page. You can retry, reload, or return to the
          homepage.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted/70">Reference: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" aria-hidden />
              Return home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
