import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Risk disclaimer for ${SITE.name}.`,
};

export default function DisclaimerPage() {
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
            Disclaimer
          </h1>
          <p className="mt-4 font-mono text-xs text-muted">
            Last updated: July 2026
          </p>

          <div className="mt-10 space-y-8 text-sm leading-8 text-muted">
            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                Not Financial Advice
              </h2>
              <p>
                Nothing on the {SITE.name} website constitutes financial, investment, legal, or tax advice. All content is for informational purposes only. You should consult a qualified professional before making any investment decision.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                Investment Risk
              </h2>
              <p>
                Purchasing {SITE.ticker} tokens involves substantial risk of loss. Cryptocurrency markets are highly volatile and speculative. The value of tokens may decline to zero. Past performance is not indicative of future results.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                Regulatory Risk
              </h2>
              <p>
                The regulatory status of cryptocurrencies and token sales varies by jurisdiction. It is your responsibility to ensure compliance with the laws of your country before participating in the {SITE.name} presale.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                Smart Contract Risk
              </h2>
              <p>
                While {SITE.name} smart contracts have been developed with care and are verified on BscScan, no smart contract is entirely risk-free. Bugs, exploits, or unforeseen interactions may result in loss of funds.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-xl font-semibold text-white">
                Forward-Looking Statements
              </h2>
              <p>
                Any statements regarding future plans, roadmap milestones, or product development are forward-looking and subject to change without notice. {SITE.name} makes no guarantees regarding the delivery or timeline of any features described.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
