import type { Metadata } from "next";
import Link from "next/link";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

export const metadata: Metadata = {
  title: "Developers | ATLAS",
  description: "Developer resources for the ATLAS platform API and integrations.",
};

/** Production foundation — docs managed from NEXAR HQ. */
export default function DevelopersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <AtlasLogo height={48} priority />
      <h1 className="mt-8 font-heading text-4xl font-semibold text-white">Developers</h1>
      <p className="mt-4 text-muted">
        API keys, webhooks, and SDKs will live here. Route and SEO foundation are production-ready;
        content is managed from NEXAR HQ.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>
          <Link href="/documentation" className="text-gold hover:underline">
            Documentation
          </Link>
        </li>
        <li>
          <Link href="/api/v1" className="text-gold hover:underline">
            API catalog
          </Link>
        </li>
      </ul>
    </main>
  );
}
