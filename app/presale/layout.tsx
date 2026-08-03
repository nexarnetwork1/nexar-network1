import type { Metadata } from "next";
import { canonical } from "@/lib/constants/seo";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Presale",
  description: `Join the ${SITE.ticker} token presale on ${SITE.blockchain}. Live pricing, allocation and vesting details for ${SITE.name}.`,
  alternates: canonical("/presale"),
};

export default function PresaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
