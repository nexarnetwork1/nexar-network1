"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/** Sends users to the admin login screen when redirected without a super-admin session. */
export function AdminAccessPrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("admin") !== "wallet-required") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    router.replace("/admin/login");
  }, [searchParams, router]);

  return null;
}
