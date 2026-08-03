import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { canonical } from "@/lib/constants/seo";

// Title is bare because the root metadata applies the `%s | Nexar Network`
// template; repeating the site name here would double the suffix.
export const metadata: Metadata = {
  title: "About",
  description: "Learn about Nexar Network — a fintech and crypto payment ecosystem.",
  alternates: canonical("/about"),
};

export default function AboutPage() {
  return (
    <main className="py-24">
      <Container>
        <SectionHeading
          eyebrow="About"
          title="Nexar Network"
          description="A production fintech and crypto payment ecosystem built for merchants and customers worldwide."
        />
        <div className="mt-12 max-w-3xl space-y-6 text-muted">
          <p>
            Nexar Network connects traditional commerce with blockchain payments,
            enabling merchants to accept crypto and card payments while maintaining
            platform-controlled settlement and transparent fee structures.
          </p>
          <p>
            This page will be expanded with company mission, team, and roadmap
            content in a future phase.
          </p>
          <p>
            Nexar Network includes a decentralized Marketplace where merchants can
            create stores and customers can pay using NXR and supported cryptocurrencies.
          </p>
        </div>
      </Container>
    </main>
  );
}
