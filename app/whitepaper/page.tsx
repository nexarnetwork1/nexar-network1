import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE, CONTRACTS } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Whitepaper",
  description: `Read the ${SITE.name} technical whitepaper covering architecture, tokenomics, ecosystem design, security model, and the path to sovereign chain infrastructure.`,
  openGraph: {
    title: `Technical Whitepaper | ${SITE.name}`,
    description: `The complete ${SITE.name} vision — architecture, tokenomics, ecosystem, and the path to sovereign chain infrastructure.`,
  },
};

const WHITEPAPER_SECTIONS = [
  { id: "executive-summary", title: "Executive Summary" },
  { id: "problem-statement", title: "Problem Statement" },
  { id: "nexar-architecture", title: "Nexar Network Architecture" },
  { id: "tokenomics", title: "Tokenomics & Allocation" },
  { id: "ecosystem-modules", title: "Ecosystem Modules" },
  { id: "security-compliance", title: "Security & Compliance" },
  { id: "roadmap", title: "Roadmap & Milestones" },
  { id: "team-governance", title: "Team & Governance" },
];

export default function WhitepaperPage() {
  return (
    <main className="nav-offset min-h-screen bg-background">
      <Container className="py-16 lg:py-24">
        <Link
          href="/#whitepaper"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Sticky Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
                  Contents
                </p>
                <nav className="space-y-2">
                  {WHITEPAPER_SECTIONS.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm text-muted transition-colors hover:text-gold"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="pt-6 border-t border-border">
                <a
                  href="/whitepaper.pdf"
                  download
                  className="inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-secondary"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0">
            <div className="mb-12">
              <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
                Whitepaper
              </p>
              <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
                {SITE.name} Technical Whitepaper
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted">
                A comprehensive document covering architecture, tokenomics, ecosystem design, security model, and the path to sovereign chain infrastructure.
              </p>
              <p className="mt-4 font-mono text-xs text-muted/50">
                Version 1.0 · July 2026
              </p>
            </div>

            {/* Mobile Download Button */}
            <div className="mb-8 lg:hidden">
              <a
                href="/whitepaper.pdf"
                download
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-secondary"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>

            {/* Whitepaper Content */}
            <article className="prose prose-invert max-w-none">
              {/* Executive Summary */}
              <section id="executive-summary" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  1. Executive Summary
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    Nexar Network is building a premium blockchain ecosystem focused on global payments. Starting on BNB Smart Chain, the project aims to evolve into sovereign payment infrastructure designed for enterprises, merchants, and communities worldwide.
                  </p>
                  <p>
                    The {SITE.ticker} token serves as the native utility token within the Nexar ecosystem, facilitating transactions, governance, and value transfer across all ecosystem modules. With a maximum supply of {SITE.maxSupply} tokens and mint functionality disabled forever, {SITE.ticker} ensures a deflationary and transparent economic model.
                  </p>
                  <p>
                    This whitepaper outlines the technical architecture, tokenomics, ecosystem modules, security measures, and the strategic roadmap guiding Nexar Network from its BNB Smart Chain deployment to the eventual launch of a purpose-built Nexar Chain.
                  </p>
                </div>
              </section>

              {/* Problem Statement */}
              <section id="problem-statement" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  2. Problem Statement
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    Current payment infrastructure faces significant challenges: high transaction fees, slow settlement times, lack of interoperability between systems, and limited access for underserved communities. Traditional financial systems exclude billions of people from the global economy, while existing blockchain solutions often struggle with scalability, user experience, and merchant adoption.
                  </p>
                  <p>
                    Enterprises require payment solutions that integrate seamlessly with existing systems while providing the benefits of blockchain technology—transparency, security, and efficiency. Merchants need low-cost, fast settlement options that work across borders without complex compliance requirements.
                  </p>
                  <p>
                    Nexar Network addresses these challenges by building sovereign blockchain payment rails that prioritize usability, scalability, and enterprise-grade security while maintaining the decentralized ethos of blockchain technology.
                  </p>
                </div>
              </section>

              {/* Nexar Network Architecture */}
              <section id="nexar-architecture" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  3. Nexar Network Architecture
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    Nexar Network operates on a phased architecture approach. Phase 1 leverages BNB Smart Chain (BEP20) for immediate deployment and liquidity access. Phase 2 involves the development and launch of Nexar Chain, a purpose-built Layer 1 blockchain optimized for payment processing.
                  </p>
                  <p>
                    The architecture is designed around modularity, allowing each ecosystem component—Wallet, Pay, Explorer, Bridge, Launchpad, and Developer API—to operate independently while benefiting from shared infrastructure and the {SITE.ticker} token economy.
                  </p>
                  <p>
                    Smart contracts are deployed with security-first principles, including verified code on BscScan, disabled mint functionality, and comprehensive audit processes. The presale contract ({CONTRACTS.presale}) and token contract ({CONTRACTS.token}) are publicly verifiable.
                  </p>
                </div>
              </section>

              {/* Tokenomics & Allocation */}
              <section id="tokenomics" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  4. Tokenomics & Allocation
                </h2>
                <div className="space-y-6 text-muted leading-7">
                  <p>
                    The {SITE.ticker} token is designed with a fixed maximum supply of {SITE.maxSupply} tokens. The mint function is permanently disabled, ensuring no additional tokens can ever be created, making {SITE.ticker} a deflationary asset by design.
                  </p>
                  
                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-4">
                      Token Specifications
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Token Name</p>
                        <p className="text-white">{SITE.name}</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Ticker</p>
                        <p className="text-white">{SITE.ticker}</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Network</p>
                        <p className="text-white">{SITE.blockchain}</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Max Supply</p>
                        <p className="text-white">{SITE.maxSupply}</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Decimals</p>
                        <p className="text-white">18</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Mint Status</p>
                        <p className="text-white">Disabled Forever</p>
                      </div>
                    </div>
                  </div>

                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-4">
                    Contract Addresses
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Token Contract</p>
                        <code className="block text-sm text-gold-secondary break-all">{CONTRACTS.token}</code>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide text-muted uppercase mb-1">Presale Contract</p>
                        <code className="block text-sm text-gold-secondary break-all">{CONTRACTS.presale}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Ecosystem Modules */}
              <section id="ecosystem-modules" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  5. Ecosystem Modules
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    The Nexar ecosystem comprises seven integrated modules designed to provide a complete payment infrastructure solution:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong className="text-white">Wallet:</strong> Secure, user-friendly cryptocurrency wallet supporting {SITE.ticker} and major assets</li>
                    <li><strong className="text-white">Pay:</strong> Merchant payment processing solution with instant settlement</li>
                    <li><strong className="text-white">Explorer:</strong> Blockchain explorer for transaction transparency and verification</li>
                    <li><strong className="text-white">Bridge:</strong> Cross-chain bridge for asset interoperability</li>
                    <li><strong className="text-white">Launchpad:</strong> Platform for vetted project launches within the ecosystem</li>
                    <li><strong className="text-white">Developer API:</strong> RESTful API for third-party integration</li>
                    <li><strong className="text-white">Governance:</strong> Decentralized governance mechanism for {SITE.ticker} holders</li>
                  </ul>
                </div>
              </section>

              {/* Security & Compliance */}
              <section id="security-compliance" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  6. Security & Compliance
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    Security is paramount at Nexar Network. All smart contracts undergo rigorous auditing before deployment. The token contract has mint functionality permanently disabled, eliminating the risk of unexpected inflation. Contracts are verified on BscScan for full transparency.
                  </p>
                  <p>
                    The presale contract implements secure purchase mechanisms supporting both BNB and USDT, with proper allowance checks and transaction validation. The integration with WalletConnect (Reown) ensures secure wallet connections without private key exposure.
                  </p>
                  <p>
                    While Nexar Network prioritizes security, users are advised to follow best practices: never share private keys, verify contract addresses before transactions, and only use official channels for information and support.
                  </p>
                </div>
              </section>

              {/* Roadmap & Milestones */}
              <section id="roadmap" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  7. Roadmap & Milestones
                </h2>
                <div className="space-y-6 text-muted leading-7">
                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-3">Phase 1: Foundation</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Token deployment on BNB Smart Chain</li>
                      <li>Presale launch and execution</li>
                      <li>Initial exchange listings</li>
                      <li>Community building and marketing</li>
                    </ul>
                  </div>

                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-3">Phase 2: Ecosystem Development</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Nexar Wallet beta launch</li>
                      <li>Nexar Pay merchant integration</li>
                      <li>Blockchain explorer deployment</li>
                      <li>Cross-chain bridge development</li>
                    </ul>
                  </div>

                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-3">Phase 3: Expansion</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Nexar Launchpad platform</li>
                      <li>Developer API release</li>
                      <li>Governance system implementation</li>
                      <li>Nexar Chain research and development</li>
                    </ul>
                  </div>

                  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
                    <h3 className="font-heading text-lg font-semibold text-white mb-3">Phase 4: Sovereign Chain</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Nexar Chain mainnet launch</li>
                      <li>Migration of ecosystem modules</li>
                      <li>Enterprise partnerships</li>
                      <li>Global payment network expansion</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Team & Governance */}
              <section id="team-governance" className="scroll-mt-24 mb-16">
                <h2 className="font-heading text-2xl font-semibold text-white mb-6">
                  8. Team & Governance
                </h2>
                <div className="space-y-4 text-muted leading-7">
                  <p>
                    Nexar Network was founded by Mahmoud Elgabry, a blockchain entrepreneur with deep expertise in blockchain architecture, smart contract development, and financial technology. Under his leadership, the project is guided by a vision of creating sovereign blockchain payment infrastructure that serves the global economy.
                  </p>
                  <p>
                    Governance of the Nexar ecosystem will evolve toward decentralization, with {SITE.ticker} token holders having voting rights on key protocol decisions. The transition to decentralized governance will be executed gradually as the ecosystem matures and the community expands.
                  </p>
                  <p>
                    The team is committed to transparency, regular communication, and community engagement. Official announcements are made through verified social media channels and the official website.
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <section className="mt-16 pt-8 border-t border-border">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-4">
                  <p className="text-sm text-amber-200/80">
                    <strong className="text-amber-400">Disclaimer:</strong> This whitepaper is for informational purposes only and does not constitute financial, investment, or legal advice. Cryptocurrency investments carry significant risk. The roadmap and milestones described herein are subject to change based on market conditions, regulatory requirements, and technical developments.
                  </p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </Container>
    </main>
  );
}
