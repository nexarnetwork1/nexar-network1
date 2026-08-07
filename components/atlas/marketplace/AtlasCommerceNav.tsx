import Link from "next/link";
import { ArrowLeft, Briefcase, Calendar, Home, Search, Store } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { cn } from "@/lib/utils/cn";

type AtlasCommerceNavProps = {
  className?: string;
  /** When set, shows a back link to the company network profile. */
  companySlug?: string | null;
  companyName?: string | null;
};

/** Cross-links between ATLAS shell and Nexar Commerce marketplace routes. */
export function AtlasCommerceNav({
  className,
  companySlug,
  companyName,
}: AtlasCommerceNavProps) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm text-muted",
        className,
      )}
      aria-label="ATLAS marketplace navigation"
    >
      <Link
        href="/atlas"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        Feed
      </Link>
      <Link
        href="/atlas/marketplace"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Store className="h-3.5 w-3.5" />
        Marketplace
      </Link>
      <Link
        href="/atlas/jobs"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Briefcase className="h-3.5 w-3.5" />
        Jobs
      </Link>
      <Link
        href="/atlas/events"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Calendar className="h-3.5 w-3.5" />
        Events
      </Link>
      <Link
        href={MARKETPLACE_ROUTES.root}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        Shop
      </Link>
      <Link
        href="/atlas/search"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        Search
      </Link>
      {companySlug ? (
        <Link
          href={`/atlas/network/${companySlug}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:text-gold transition-colors ml-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {companyName ? `${companyName} on ATLAS` : "Company"}
        </Link>
      ) : null}
    </nav>
  );
}
