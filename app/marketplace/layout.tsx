import type { Metadata } from "next";
import { MarketplaceSubNav } from "@/components/marketplace/MarketplaceSubNav";

export const metadata: Metadata = {
  title: "Nexar Commerce — Enterprise Marketplace",
  description:
    "Premium enterprise commerce platform powered by the Nexar Network. Live statistics, verified brands, crypto payments, and global merchant infrastructure.",
};

/**
 * Public Marketplace layout.
 * Authentication is handled globally via AppProviders > AtlasAuthShell.
 * This layout is now a pure public shell with no auth modal.
 *
 * Classification: Public Website
 */
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
      <MarketplaceSubNav />
      {children}
    </div>
  );
}
