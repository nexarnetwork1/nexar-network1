import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card/50 p-8 text-center shadow-xl shadow-black/20 backdrop-blur-2xl">
        <p className="font-mono text-sm tracking-widest text-gold/60">404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you requested does not exist or may have moved. Check the URL or browse from the
          homepage.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" aria-hidden />
              Return home
            </Button>
          </Link>
          <Link href="/marketplace/stores">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Search className="h-4 w-4" aria-hidden />
              Browse marketplace
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
