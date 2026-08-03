import Link from "next/link";
import { Flag } from "lucide-react";
import { DashboardEmptyState, DashboardSection } from "@/components/dashboard";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Reports"
        headingClassName="text-gold"
        description="Content report moderation will return with the new marketplace implementation."
      />

      <DashboardEmptyState
        icon={<Flag className="h-5 w-5" aria-hidden />}
        title="No reports to review"
        description="Reported products, stores and reviews will appear here once moderation is re-enabled."
        action={
          <Link
            href="/admin/marketplace"
            className="inline-flex min-h-11 items-center rounded-xl border border-gold/20 bg-gold/5 px-4 text-sm text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            Marketplace overview
          </Link>
        }
      />
    </div>
  );
}
