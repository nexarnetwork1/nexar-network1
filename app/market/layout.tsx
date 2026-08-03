import type { Metadata } from "next";
import { canonical } from "@/lib/constants/seo";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Market Data",
  description: `Live ${SITE.ticker} market data, contract addresses and exchange listings on ${SITE.blockchain}.`,
  alternates: canonical("/market"),
};

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
