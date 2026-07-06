import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE.name}.`,
};

export default function PrivacyPage() {
  return (
    <main className="nav-offset min-h-screen">
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
            Privacy Policy
          </h1>
          <p className="mt-4 font-mono text-xs text-muted">
            Last updated: July 2026
          </p>

          <div className="mt-10 space-y-8 text-sm leading-8 text-muted">
            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                1. Overview
              </h2>
              <p>
                {SITE.name} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                2. Information We Collect
              </h2>
              <p>
                {SITE.name} is a decentralised application. We do not collect personal data directly. When you connect a wallet, your public blockchain address is used solely to read on-chain presale data. No private keys, passwords, or personally identifiable information are collected or stored by our servers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                3. Blockchain Data
              </h2>
              <p>
                All interactions with the {SITE.name} smart contracts are recorded permanently on the BNB Smart Chain and are publicly visible. We have no control over on-chain data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                4. Third-Party Services
              </h2>
              <p>
                We use WalletConnect (Reown) to facilitate wallet connections. Please review their privacy policy at{" "}
                <a
                  href="https://reown.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  reown.com/privacy-policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                5. Contact
              </h2>
              <p>
                For privacy enquiries, contact us via our official{" "}
                <a
                  href="https://t.me/nexarnetwork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  Telegram channel
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
