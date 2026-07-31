"use client";

import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { Button } from "@/components/ui/Button";

type CommerceAuthActionsProps = {
  isSignedIn: boolean;
};

export function CommerceAuthActions({ isSignedIn }: CommerceAuthActionsProps) {
  if (isSignedIn) return null;

  return (
    <div className="ml-auto flex items-center gap-2">
      <CommerceAuthTrigger mode="signin">
        <Button variant="ghost" size="sm" className="rounded-full px-3 py-1.5 text-xs">
          Sign in
        </Button>
      </CommerceAuthTrigger>
      <CommerceAuthTrigger mode="register">
        <Button variant="secondary" size="sm" className="rounded-full px-3 py-1.5 text-xs">
          Register
        </Button>
      </CommerceAuthTrigger>
    </div>
  );
}

/** @deprecated Use CommerceAuthActions */
export const MarketplaceAuthActions = CommerceAuthActions;
