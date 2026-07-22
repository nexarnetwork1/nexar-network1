"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "News", href: "/admin/news" },
  { name: "Announcements", href: "/admin/announcements" },
  { name: "Presale", href: "/admin/presale" },
  { name: "Roadmap", href: "/admin/roadmap" },
  { name: "Partners", href: "/admin/partners" },
  { name: "Whitepaper", href: "/admin/whitepaper" },
  { name: "Settings", href: "/admin/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-yellow-500/20 bg-black/40 min-h-[calc(100vh-96px)]">
          <div className="border-b border-yellow-500/20 p-6">
            <h1 className="text-3xl font-bold text-yellow-400">
              Nexar CMS
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Founder Panel
            </p>
          </div>

          <nav className="space-y-2 p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-xl px-4 py-3 transition ${
                  pathname === link.href
                    ? "bg-yellow-500 text-black font-bold"
                    : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-end border-b border-yellow-500/20 px-8 py-5">
            <button className="rounded-lg bg-red-600 px-5 py-2 font-semibold transition hover:bg-red-500">
              Logout
            </button>
          </div>

          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
