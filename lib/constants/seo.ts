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
  alternates: {
    canonical: SITE.url,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
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
    "https://x.com/nexarnetwork",
    "https://t.me/nexarnetwork",
    "https://github.com/nexarnetwork",
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
