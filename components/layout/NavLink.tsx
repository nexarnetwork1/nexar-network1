"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type NavLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

/** Resolves home sections from any route via `/#section` paths. */
export function NavLink({ href, className, children, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isHashOnly = href.startsWith("#");
  const resolvedHref = isHashOnly ? `/${href}` : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (!href.includes("#")) return;

    const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
    if (!hash || hash === "#") return;

    if (pathname === "/" && hash.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", hash);
      }
    }
  };

  return (
    <Link href={resolvedHref} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

export function navLinkClassName(active?: boolean) {
  return cn(
    "group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full",
    active && "text-gold"
  );
}
