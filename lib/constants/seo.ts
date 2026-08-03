import type { Metadata } from "next";
import { SITE, CONTRACTS } from "./site";

const OG_IMAGE = "/opengraph-image";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Decentralized Payment Infrastructure`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Nexar Network",
    "NXR",
    "BNB Smart Chain",
    "BEP20",
    "decentralized payments",
    "blockchain infrastructure",
    "Web3 payments",
    "crypto payments",
    "presale",
    "token",
  ],
  authors: [{ name: SITE.founder }],
  creator: SITE.founder,
  publisher: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — Decentralized Payment Infrastructure`,
    description: SITE.description,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.ticker} Token on BNB Smart Chain`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Decentralized Payment Infrastructure`,
    description: SITE.description,
    creator: "@nexarnetwork",
    images: [OG_IMAGE],
  },
  // No `alternates.canonical` here on purpose: root metadata is inherited by
  // every route, so a canonical set at this level would point all ~110 pages
  // at the homepage. Pages declare their own via `canonical()` below.
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

/** Per-page canonical URL. Pass a root-relative path such as `/whitepaper`. */
export function canonical(path: string): Metadata["alternates"] {
  return { canonical: path };
}

/**
 * Metadata for authenticated and transactional areas — portals, auth screens,
 * checkout and payment links. These must never reach the index, and the
 * root's `index: true` would otherwise be inherited.
 */
export const privateAreaMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  logo: `${SITE.url}/icon`,
  sameAs: [
    "https://x.com/NexarNetwork1",
    "https://t.me/NexarNetwork",
    "https://github.com/nexarnetwork1",
    "https://instagram.com/nexarnetwork1",
    "https://facebook.com/share/1EPeMgVPpa/",
    "https://linkedin.com/in/mahmoud-elgabry-142644419",
  ],
  founder: {
    "@type": "Person",
    name: SITE.founder,
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/whitepaper?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${SITE.ticker} Token`,
  description: SITE.description,
  brand: {
    "@type": "Brand",
    name: SITE.name,
  },
  category: "Cryptocurrency",
  offers: {
    "@type": "Offer",
    url: SITE.url,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  additionalProperty: [
    { "@type": "PropertyValue", name: "Blockchain", value: "BNB Smart Chain" },
    { "@type": "PropertyValue", name: "Contract", value: CONTRACTS.token },
    { "@type": "PropertyValue", name: "Max Supply", value: SITE.maxSupply },
  ],
};
