import type { Metadata } from "next";
import Link from "next/link";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

export const metadata: Metadata = {
  title: "Documentation | ATLAS",
  description: "ATLAS platform documentation by NEXAR NETWORK.",
};

/** Production foundation — docs managed from NEXAR HQ. */
export default function DocumentationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <AtlasLogo height={48} priority />
      <h1 className="mt-8 font-heading text-4xl font-semibold text-white">Documentation</h1>
      <p className="mt-4 text-muted">
        Product and API documentation foundation. Content is editable from NEXAR HQ Website CMS. For
        architecture, see internal docs and the whitepaper.
      </p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/whitepaper" className="text-gold hover:underline">
          Whitepaper
        </Link>
        <Link href="/developers" className="text-gold hover:underline">
          Developers
        </Link>
      </div>
    </main>
  );
}
