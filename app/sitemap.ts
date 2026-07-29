import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";
import { getMarketplaceSitemapData } from "@/modules/marketplace/sitemap";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/whitepaper`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/market`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/marketplace`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE.url}/marketplace/browse`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/marketplace/stores`, lastModified, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/contact`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/disclaimer`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const marketplace = await getMarketplaceSitemapData();

    const storePages: MetadataRoute.Sitemap = marketplace.stores.map((store) => ({
      url: `${SITE.url}/store/${store.slug}`,
      lastModified: new Date(store.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productPages: MetadataRoute.Sitemap = marketplace.products.map((product) => ({
      url: `${SITE.url}/marketplace/products/${product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryPages: MetadataRoute.Sitemap = marketplace.categories.map((category) => ({
      url: `${SITE.url}/marketplace/browse?category=${encodeURIComponent(category.slug)}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...storePages, ...productPages, ...categoryPages];
  } catch {
    return staticPages;
  }
}
