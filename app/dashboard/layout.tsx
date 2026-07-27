"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Overview", href: "/dashboard/overview" },
  { name: "Payments", href: "/dashboard/payments" },
  { name: "Customers", href: "/dashboard/customers" },
  { name: "Invoices", href: "/dashboard/invoices" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border bg-card/40 min-h-screen">
          <div className="border-b border-border p-6">
            <h1 className="text-2xl font-bold text-gold">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted">
              Merchant Portal
            </p>
          </div>

          <nav className="space-y-2 p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-xl px-4 py-3 transition ${
                  pathname === link.href
                    ? "bg-gold text-black font-bold"
                    : "bg-card/30 hover:bg-card/50 text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
