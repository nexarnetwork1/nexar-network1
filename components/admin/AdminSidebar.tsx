"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/modules/auth/actions";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const overviewLinks = [
  { name: "Overview", href: "/admin/dashboard" },
  { name: "Revenue", href: "/admin/revenue" },
  { name: "Analytics", href: "/admin/analytics" },
];

const managementLinks = [
  { name: "Merchants", href: "/admin/merchants" },
  { name: "Customers", href: "/admin/customers" },
  { name: "Users", href: "/admin/users" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Invoices", href: "/admin/invoices" },
  { name: "Payments", href: "/admin/payments" },
  { name: "Products", href: "/admin/products" },
  { name: "Marketplace", href: "/admin/marketplace" },
];

const platformLinks = [
  { name: "Treasury", href: "/admin/treasury" },
  { name: "Coupons", href: "/admin/coupons" },
  { name: "Platform Fees", href: "/admin/platform-fees" },
  { name: "Exchange Rates", href: "/admin/exchange-rates" },
  { name: "Currencies", href: "/admin/currencies" },
  { name: "Promotions", href: "/admin/promotions" },
  { name: "Settings", href: "/admin/settings" },
];

const securityLinks = [
  { name: "Audit Logs", href: "/admin/audit-logs" },
  { name: "Security", href: "/admin/security" },
  { name: "System Health", href: "/admin/system-health" },
  { name: "Contact", href: "/admin/contact" },
];

const operationsLinks = [
  { name: "Escrow", href: "/admin/escrow" },
  { name: "Disputes", href: "/admin/disputes" },
  { name: "Verification", href: "/admin/verification" },
  { name: "Withdrawals", href: "/admin/withdrawals" },
  { name: "Settlement Reports", href: "/admin/settlement-reports" },
];

const cmsLinks = [{ name: "News", href: "/admin/news" }];

function NavSection({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <>
      <p className="mt-4 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">{title}</p>
      {links.map((link) => (
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
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-72 shrink-0 border-r border-yellow-500/20 bg-black/40 min-h-[calc(100vh-96px)]">
      <div className="border-b border-yellow-500/20 p-6">
        <h1 className="text-2xl font-bold text-yellow-400">Nexar Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">Platform control</p>
      </div>

      <nav className="space-y-1 p-4">
        <NavSection title="Overview" links={overviewLinks} />
        <NavSection title="Management" links={managementLinks} />
        <NavSection title="Platform" links={platformLinks} />
        <NavSection title="Operations" links={operationsLinks} />
        <NavSection title="Security" links={securityLinks} />
        <NavSection title="CMS" links={cmsLinks} />
      </nav>
    </aside>
  );
}

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-yellow-500/20 px-8 py-4">
      <GlobalSearch apiPath="/api/search" />
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
