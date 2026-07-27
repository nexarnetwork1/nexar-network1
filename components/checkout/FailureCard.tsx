"use client";

import { XCircle, RefreshCw, Home, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FailureCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function FailureCard({ title, message, onRetry, showRetry = true }: FailureCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Error Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
        <XCircle className="h-12 w-12 text-red-400" />
      </div>

      {/* Error Message */}
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        )}
        
        <a
          href="/"
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-background/80"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </a>

        <a
          href="/contact"
          className="flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
        >
          <span>Contact Support</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-xs text-muted-foreground max-w-md">
        <p>If you continue to experience issues, please contact our support team with your transaction details.</p>
      </div>
    </div>
  );
}
