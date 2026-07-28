"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

async function fetchAdminStatus(): Promise<boolean> {
  const res = await fetch("/api/admin/wallet/status");
  const data = await res.json();
  return Boolean(data.authenticated);
}

export function SuperAdminNavLink() {
  const [authenticated, setAuthenticated] = useState(false);

  const refresh = useCallback(() => {
    fetchAdminStatus()
      .then(setAuthenticated)
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("nxr:super-admin-updated", refresh);
    return () => window.removeEventListener("nxr:super-admin-updated", refresh);
  }, [refresh]);

  if (!authenticated) return null;

  return (
    <Link
      href="/admin/dashboard"
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20"
    >
      <Shield className="h-3.5 w-3.5" />
      Admin
    </Link>
  );
}
