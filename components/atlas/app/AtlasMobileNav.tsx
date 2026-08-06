"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, MessageSquare, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";

const mobileNavItems = [
  { icon: Home, label: "Home", href: "/atlas" },
  { icon: Users, label: "Network", href: "/atlas/network" },
  { icon: Plus, label: "Create", href: "/atlas/create-post", isPrimary: true, auth: true },
  { icon: MessageSquare, label: "Messages", href: "/atlas/messages" },
  { icon: Bell, label: "Notifications", href: "/atlas/notifications", auth: true },
  { icon: User, label: "Profile", href: "/atlas/profile", auth: true },
];

export function AtlasMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  const openAuth = (href: string) => {
    openCommerceAuth({
      mode: "signin",
      redirect: href,
      message: "Sign in to continue",
    });
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/98 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="ATLAS mobile navigation"
    >
      <div className="flex items-end justify-around h-16 px-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/atlas" && pathname.startsWith(item.href));

          if (item.auth && !session) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => openAuth(item.href)}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 text-muted"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 truncate w-full text-center">{item.label}</span>
              </button>
            );
          }

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 min-w-0 -mt-3"
              >
                <div className="h-11 w-11 rounded-full bg-gold border-[3px] border-[#050505] flex items-center justify-center shadow-lg shadow-gold/20">
                  <Icon className="h-5 w-5 text-background" />
                </div>
                <span className="text-[10px] mt-1 text-gold font-medium">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-colors",
                isActive ? "text-gold" : "text-muted hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className={cn("text-[10px] mt-0.5 truncate w-full text-center", isActive && "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
