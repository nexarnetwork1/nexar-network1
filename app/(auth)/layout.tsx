import { Container } from "@/components/ui/Container";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata = privateAreaMetadata;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
      <Container className="relative flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center py-8 sm:py-10">
        {children}
      </Container>
    </div>
  );
}
