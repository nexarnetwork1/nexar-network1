"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function SuperAdminNavLink() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/wallet/status")
      .then((res) => res.json())
      .then((data) => {
        if (active) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
