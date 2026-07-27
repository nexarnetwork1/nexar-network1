import { Container } from "@/components/ui/Container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="relative flex min-h-[calc(100vh-var(--nxr-header-offset))] items-center justify-center py-8 sm:py-10">
      {children}
    </Container>
  );
}
