import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE.url, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/whitepaper`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/market`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/marketplace`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE.url}/contact`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/disclaimer`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
