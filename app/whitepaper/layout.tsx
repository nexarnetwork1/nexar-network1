import type { Metadata } from "next";
import { canonical } from "@/lib/constants/seo";
import { SITE } from "@/lib/constants/site";

// The page itself is a Client Component and cannot export metadata, so it
// lives here instead.
export const metadata: Metadata = {
  title: "Whitepaper",
  description: `Read the ${SITE.name} whitepaper: tokenomics, architecture, payment infrastructure and the roadmap for ${SITE.ticker} on ${SITE.blockchain}.`,
  alternates: canonical("/whitepaper"),
};

export default function WhitepaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
