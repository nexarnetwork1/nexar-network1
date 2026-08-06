import type { Metadata } from "next";
import Link from "next/link";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

export const metadata: Metadata = {
  title: "Blog | ATLAS",
  description: "News and updates from ATLAS by NEXAR NETWORK.",
};

/** Production foundation — posts managed from NEXAR HQ CMS. */
export default function BlogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <AtlasLogo height={48} priority />
      <h1 className="mt-8 font-heading text-4xl font-semibold text-white">Blog</h1>
      <p className="mt-4 text-muted">
        Editorial content foundation is ready. Publish articles from NEXAR HQ.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-gold hover:underline">
        Back to home
      </Link>
    </main>
  );
}
