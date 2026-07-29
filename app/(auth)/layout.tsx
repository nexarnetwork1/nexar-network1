import { Container } from "@/components/ui/Container";
import { PageAmbientBackground } from "@/components/ui/PageAmbientBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
      <PageAmbientBackground variant="default" />
      <Container className="relative flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center py-8 sm:py-10">
        {children}
      </Container>
    </div>
  );
}
