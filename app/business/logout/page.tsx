"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear session
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    
    // Redirect to business hub
    router.push('/business');
  }, [router]);

  return (
    <Container>
      <div className="max-w-md mx-auto py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Logging out...</p>
        </div>
      </div>
    </Container>
  );
}