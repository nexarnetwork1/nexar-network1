"use client";

import { AuthModalTrigger } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/Button";

type MarketplaceAuthActionsProps = {
  isSignedIn: boolean;
};

export function MarketplaceAuthActions({ isSignedIn }: MarketplaceAuthActionsProps) {
  if (isSignedIn) return null;

  return (
    <div className="ml-auto flex items-center gap-2">
      <AuthModalTrigger mode="signin">
        <Button variant="ghost" size="sm" className="rounded-full px-3 py-1.5 text-xs">
          Sign in
        </Button>
      </AuthModalTrigger>
      <AuthModalTrigger mode="register">
        <Button variant="secondary" size="sm" className="rounded-full px-3 py-1.5 text-xs">
          Register
        </Button>
      </AuthModalTrigger>
    </div>
  );
}
