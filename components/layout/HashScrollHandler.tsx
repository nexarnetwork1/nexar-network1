"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Scrolls to hash targets after cross-page navigation to the landing page. */
export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;

    const hash = window.location.hash;
    const scrollToHash = () => {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const id = window.setTimeout(scrollToHash, 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
