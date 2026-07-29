import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Nexar Network marketplace storefront",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-var(--nxr-header-offset))] bg-background">
      {children}
    </div>
  );
}
