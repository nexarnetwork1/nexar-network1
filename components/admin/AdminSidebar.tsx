"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/modules/auth/actions";

const platformLinks = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Users", href: "/admin/users" },
  { name: "Merchants", href: "/admin/merchants" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Invoices", href: "/admin/invoices" },
  { name: "Payments", href: "/admin/payments" },
  { name: "Platform Fees", href: "/admin/platform-fees" },
  { name: "Exchange Rates", href: "/admin/exchange-rates" },
  { name: "Promotions", href: "/admin/promotions" },
  { name: "Audit Logs", href: "/admin/audit-logs" },
  { name: "Contact", href: "/admin/contact" },
  { name: "Security", href: "/admin/security" },
];

const cmsLinks = [
  { name: "News", href: "/admin/news" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-yellow-500/20 bg-black/40 min-h-[calc(100vh-96px)]">
      <div className="border-b border-yellow-500/20 p-6">
        <h1 className="text-2xl font-bold text-yellow-400">Nexar Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">Platform control</p>
      </div>

      <nav className="space-y-1 p-4">
        <p className="px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">
          Platform
        </p>
        {platformLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-xl px-4 py-2.5 text-sm transition ${
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "bg-yellow-500 text-black font-semibold"
                : "text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            {link.name}
          </Link>
        ))}

        <p className="mt-4 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">
          CMS
        </p>
        {cmsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-xl px-4 py-2.5 text-sm transition ${
              pathname === link.href
                ? "bg-yellow-500 text-black font-semibold"
                : "text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between border-b border-yellow-500/20 px-8 py-4">
      <p className="text-sm text-zinc-400">admin@nexarnetwork.org</p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
