import { Container } from "@/components/ui/Container";
import { PageAmbientBackground } from "@/components/ui/PageAmbientBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageAmbientBackground variant="login" />
      <Container className="relative flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center py-10 sm:py-14">
        {children}
      </Container>
    </>
  );
}
