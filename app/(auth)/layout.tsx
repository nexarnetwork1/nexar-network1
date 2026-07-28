import { Container } from "@/components/ui/Container";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <MarketplaceArtwork />
      <Container className="relative flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center py-8 sm:py-10">
        {children}
      </Container>
    </div>
  );
}
