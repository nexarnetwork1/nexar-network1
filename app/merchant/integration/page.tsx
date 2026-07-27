"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";

export default function MerchantIntegration() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual documentation
    router.push('/docs');
  }, [router]);

  return (
    <Container>
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Redirecting to integration documentation...</p>
        </div>
      </div>
    </Container>
  );
}
