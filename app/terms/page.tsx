import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants/site";
import { canonical } from "@/lib/constants/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE.name}. Understand the conditions governing use of our decentralized token presale platform.`,
  openGraph: {
    title: `Terms of Service | ${SITE.name}`,
    description: `Terms of Service for ${SITE.name}.`,
  },
  alternates: canonical("/terms"),
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Container className="py-16 lg:py-24">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
            Legal
          </p>
          <h1 className="font-heading text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            Terms of Service
          </h1>
          <p className="mt-4 font-mono text-xs text-muted">
            Last updated: July 2026
          </p>

          <div className="mt-10 space-y-8 text-sm leading-8 text-muted">
            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the {SITE.name} website and associated smart contracts, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                2. Nature of the Service
              </h2>
              <p>
                {SITE.name} provides a decentralised token presale interface. You interact directly with smart contracts on the BNB Smart Chain. We do not custody your funds and cannot reverse transactions.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                3. Risk Disclosure
              </h2>
              <p>
                Cryptocurrency investments carry significant risk. The value of {SITE.ticker} tokens may fluctuate dramatically or go to zero. Only participate with funds you can afford to lose. This is not financial advice.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                4. Prohibited Use
              </h2>
              <p>
                You agree not to use the service if you are located in a jurisdiction where participation in token sales is prohibited, including but not limited to the United States, as applicable.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                5. Limitation of Liability
              </h2>
              <p>
                {SITE.name} and its team are not liable for any losses arising from use of the smart contracts, including but not limited to bugs, exploits, or market volatility.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                6. Changes to Terms
              </h2>
              <p>
                We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of the revised terms.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
