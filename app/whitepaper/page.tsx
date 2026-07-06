import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Whitepaper",
  description: `Read the ${SITE.name} technical whitepaper covering architecture, tokenomics, ecosystem design, security model, and the path to sovereign chain infrastructure.`,
};

const WHITEPAPER_SECTIONS = [
  "Executive Summary",
  "Problem Statement",
  "Nexar Network Architecture",
  "Tokenomics & Allocation",
  "Ecosystem Modules",
  "Security & Compliance",
  "Roadmap & Milestones",
  "Team & Governance",
];

export default function WhitepaperPage() {
  return (
    <main className="nav-offset min-h-screen">
      <Container className="py-16 lg:py-24">
        <Link
          href="/#whitepaper"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
            Whitepaper
          </p>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            {SITE.name} Technical Whitepaper
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            A comprehensive document covering architecture, tokenomics, ecosystem design, security model, and the path to sovereign chain infrastructure.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/whitepaper.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-secondary"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </div>

          <div className="mt-14 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  {SITE.name}
                </p>
                <h2 className="font-heading text-lg font-semibold">Table of Contents</h2>
              </div>
            </div>
            <ol className="space-y-3">
              {WHITEPAPER_SECTIONS.map((section, i) => (
                <li
                  key={section}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-4 py-3"
                >
                  <span className="text-sm text-muted">{section}</span>
                  <span className="font-mono text-xs text-gold/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center font-mono text-[10px] text-muted/50">
              Version 1.0 · 2026
            </p>
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Full whitepaper PDF coming soon.{" "}
            <Link href="/#ecosystem" className="text-gold hover:underline">
              Explore the ecosystem
            </Link>{" "}
            in the meantime.
          </p>
        </div>
      </Container>
    </main>
  );
}
