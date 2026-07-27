import type { Metadata } from "next";
import { SITE } from "@/lib/constants/site";

type ProductSeoInput = {
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  storeName: string;
  productId: string;
};

export function buildProductMetadata(input: ProductSeoInput): Metadata {
  const title = input.name;
  const description =
    input.description?.slice(0, 160) ??
    `Buy ${input.name} from ${input.storeName} on ${SITE.name} marketplace.`;
  const url = `${SITE.url}/customer/browse/${input.productId}`;
  const image = input.imageUrl ?? `${SITE.url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE.name,
      images: [{ url: image, width: 1200, height: 630, alt: input.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildProductJsonLd(input: ProductSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.imageUrl,
    brand: { "@type": "Brand", name: input.storeName },
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/customer/browse/${input.productId}`,
      priceCurrency: input.currency,
      price: input.price,
      availability:
        input.price > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}

type StoreSeoInput = {
  name: string;
  description: string | null;
  logoUrl: string | null;
  slug: string;
};

export function buildStoreMetadata(input: StoreSeoInput): Metadata {
  const title = `${input.name} — Official Store`;
  const description =
    input.description?.slice(0, 160) ??
    `Shop at ${input.name} on the ${SITE.name} marketplace.`;
  const url = `${SITE.url}/store/${input.slug}`;
  const image = input.logoUrl ?? `${SITE.url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE.name,
      images: [{ url: image, width: 1200, height: 630, alt: input.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildStoreJsonLd(input: StoreSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: input.name,
    description: input.description,
    image: input.logoUrl,
    url: `${SITE.url}/store/${input.slug}`,
  };
}
