import { Container } from "@/components/ui/Container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="flex min-h-[calc(100vh-var(--nxr-nav-height))] items-center py-16">
      {children}
    </Container>
  );
}
