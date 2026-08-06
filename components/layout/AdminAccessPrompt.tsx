"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/** Sends users to NEXAR HQ login when an admin redirect param is present. */
export function AdminAccessPrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const adminParam = searchParams.get("admin");
    if (adminParam !== "hq-required" && adminParam !== "wallet-required") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    router.replace("/admin/login");
  }, [searchParams, router]);

  return null;
}
