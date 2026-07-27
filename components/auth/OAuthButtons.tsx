"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type OAuthButtonsProps = {
  redirectTo?: string;
  intent?: "customer" | "merchant";
};

export function OAuthButtons({ redirectTo, intent }: OAuthButtonsProps) {
  const supabase = createClient();

  async function signIn(provider: "google" | "apple") {
    const params = new URLSearchParams();
    if (redirectTo) params.set("redirect", redirectTo);
    if (intent) params.set("intent", intent);

    const callbackUrl = `${window.location.origin}/auth/callback${params.toString() ? `?${params}` : ""}`;

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => signIn("google")}
      >
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => signIn("apple")}
      >
        Continue with Apple
      </Button>
    </div>
  );
}
