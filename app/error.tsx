"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, ArrowRight, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30">
          <span className="text-4xl font-bold text-red-400">Error</span>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Need help?</p>
          <Link
            href="/contact"
            className="text-sm text-gold hover:text-gold/80 transition-colors inline-flex items-center gap-1"
          >
            <span>Contact Support</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
