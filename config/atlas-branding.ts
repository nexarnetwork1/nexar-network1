/**
 * ATLAS — official platform identity.
 * Public branding surface. Internal bounded-context keys remain unchanged.
 */

export const ATLAS_BRAND = {
  /** Product name shown in application shells. */
  name: "ATLAS",
  /** Legal / network attribution. */
  byline: "by NEXAR NETWORK",
  /** Platform category — Business Operating System. */
  tagline: "Business Operating System",
  /** Full public descriptor for metadata and docs. */
  fullName: "ATLAS by NEXAR NETWORK",
  description:
    "ATLAS is the Business Operating System of NEXAR NETWORK — Web2 + Web3 infrastructure for companies, commerce, finance, and network growth.",
} as const;

/** Official brand assets — single source for logo paths. */
export const ATLAS_ASSETS = {
  /** Sole official ATLAS product lockup (globe + wordmark + byline). */
  logoPrimary: "/brand/atlas/atlas-logo-primary.png",
  /** Square app / PWA / favicon canvas (lockup on matte black). */
  icon512: "/brand/atlas/atlas-icon-512.png",
} as const;

/** Shell subtitle presets per portal. */
export const ATLAS_PORTAL_SUBTITLES = {
  business: "Business",
  marketplace: "Marketplace",
  customer: "Account",
  admin: "NEXAR HQ",
} as const;

/** Design motion — align CSS transitions with these durations (ms). */
export const ATLAS_MOTION = {
  fast: 150,
  base: 250,
  slow: 400,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
