"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const isHashOnly = href.startsWith("#");
  const resolvedHref = isHashOnly ? `/${href}` : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();

    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const hash = href.slice(hashIndex);
    const path = href.slice(0, hashIndex) || "/";

    if (pathname !== path) {
      e.preventDefault();
      router.push(`${path}${hash}`);
      return;
    }

    if (hash && hash !== "#") {
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
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
