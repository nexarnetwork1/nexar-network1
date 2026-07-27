"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/** Prompts treasury wallet verification when redirected from /admin without session. */
export function AdminAccessPrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("admin") !== "wallet-required") return;

    toast.message("Super Admin access required", {
      description: "Connect the treasury wallet, open the wallet menu, and verify your signature.",
      duration: 8000,
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    router.replace(url.pathname + url.hash, { scroll: false });
  }, [searchParams, router]);

  return null;
}
