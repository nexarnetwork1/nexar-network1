import { Metadata } from "next";
import Link from "next/link";
import { Home, ArrowRight, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found - Nexar Network",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold/10 border-2 border-gold/30">
          <span className="text-4xl font-bold text-gold">404</span>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/platform"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            <Search className="h-4 w-4" />
            <span>Explore Platform</span>
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
