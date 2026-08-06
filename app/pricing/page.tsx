import type { Metadata } from "next";
import Link from "next/link";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

export const metadata: Metadata = {
  title: "Pricing | ATLAS",
  description:
    "ATLAS platform pricing — Business Operating System by NEXAR NETWORK.",
};

/** Production foundation — content managed from NEXAR HQ Website CMS. */
export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <AtlasLogo height={48} priority />
      <h1 className="mt-8 font-heading text-4xl font-semibold text-white">Pricing</h1>
      <p className="mt-4 text-muted">
        Plans and packaging will be published here. Content is prepared for management from NEXAR
        HQ Website CMS.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-gold hover:underline">
        Back to home
      </Link>
    </main>
  );
}
