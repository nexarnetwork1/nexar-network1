import type { Metadata } from "next";
import { canonical } from "@/lib/constants/seo";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Official Addresses",
  description: `Verified ${SITE.name} contract and wallet addresses. Always confirm addresses here before sending funds.`,
  alternates: canonical("/official-addresses"),
};

export default function OfficialAddressesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
