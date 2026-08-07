import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

/**
 * Authenticated portals, auth screens and transactional routes. These sit
 * behind redirects, so crawling them only wastes budget and can surface bare
 * URLs in results. The matching layouts also send `noindex` for defence in
 * depth.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/customer",
  "/merchant",
  "/dashboard",
  "/atlas",
  "/orders",
  "/invoices",
  "/settings",
  "/wallet",
  "/treasury",
  "/profile",
  "/pay/",
  "/auth/",
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/marketplace/cart",
  "/marketplace/checkout",
  "/marketplace/wishlist",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
