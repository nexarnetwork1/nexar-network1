"use client";

import Link from "next/link";
import { ArrowLeft, Download, ArrowUp, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE, CONTRACTS } from "@/lib/constants/site";
import { useState, useEffect } from "react";

const WHITEPAPER_SECTIONS = [
  { id: "executive-summary", title: "Executive Summary" },
  { id: "industry-overview", title: "Industry Overview" },
  { id: "current-challenges", title: "Current Challenges" },
  { id: "nexar-solution", title: "The Nexar Solution" },
  { id: "vision", title: "Vision" },
  { id: "mission", title: "Mission" },
  { id: "core-values", title: "Core Values" },
  { id: "why-nexar", title: "Why Nexar Network" },
  { id: "market-opportunity", title: "Market Opportunity" },
  { id: "technology-overview", title: "Technology Overview" },
  { id: "token-overview", title: "Token Overview" },
  { id: "tokenomics", title: "Tokenomics" },
  { id: "team-vesting", title: "Team Vesting" },
  { id: "token-utility", title: "Token Utility" },
  { id: "ecosystem", title: "Nexar Ecosystem" },
  { id: "roadmap", title: "Roadmap" },
  { id: "security", title: "Security & Transparency" },
  { id: "official-addresses", title: "Official Wallet Addresses" },
  { id: "founder", title: "Founder" },
  { id: "legal", title: "Legal Disclaimer" },
  { id: "conclusion", title: "Conclusion" },
];

export default function WhitepaperPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setReadingProgress(progress);
      setShowBackToTop(window.scrollY > 500);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    WHITEPAPER_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const filteredSections = WHITEPAPER_SECTIONS.filter((section) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

        {/* Reading Progress Bar */}
        <div className="fixed top-[5rem] left-0 right-0 z-40 h-0.5 bg-border">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-secondary transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          {/* Sticky Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {/* Search */}
              <div>
                <p className="mb-3 text-xs font-medium tracking-[0.24em] text-gold uppercase">
                  Search
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
                  />
                </div>
              </div>

              {/* Table of Contents */}
              <div>
                <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
                  Contents
                </p>
                <nav className="space-y-1">
                  {filteredSections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block text-sm py-1.5 px-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? "bg-gold/10 text-gold"
                          : "text-muted hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="pt-6 border-t border-border">
                <a
                  href="/whitepaper.pdf"
                  download="Nexar-Network-Whitepaper.pdf"
                  className="inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-secondary"
                >
                  <Download className="h-4 w-4" />
                  Download Whitepaper
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
                 Nexar Network Whitepaper
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted">
               The official Nexar Network Whitepaper presenting our vision, technology, ecosystem, tokenomics, roadmap, security framework, and long-term strategy for building the future of global blockchain payments.
              </p>
              <p className="mt-4 font-mono text-xs text-muted/50">
                July 2026
              </p>
            </div>

            {/* Mobile Download Button */}
            <div className="mb-8 lg:hidden">
              <a
                href="/whitepaper.pdf"
                download="Nexar-Network-Whitepaper.pdf"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-secondary"
              >
                <Download className="h-4 w-4" />
                Download Whitepaper
              </a>
            </div>

            {/* Whitepaper Content */}
            <article className="prose prose-invert max-w-none">
              {/* Executive Summary */}
             <section id="executive-summary" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    1. Executive Summary
  </h2>

  <div className="space-y-5 text-muted leading-8">

    <p>
      Nexar Network is a blockchain-powered payment ecosystem created to
      simplify digital payments through speed, transparency, security,
      and long-term scalability.
    </p>

    <p>
      The project launches with the NXR token on BNB Smart Chain,
      establishing the foundation for a global payment infrastructure
      capable of supporting merchants, developers, businesses,
      decentralized applications, and eventually an independent
      blockchain.
    </p>

    <p>
      Rather than creating another speculative cryptocurrency,
      Nexar Network is focused on building practical financial
      infrastructure designed for real-world adoption.
    </p>

    <p>
      Our long-term objective is to make blockchain payments
      faster, more affordable, easier to integrate,
      and accessible to everyone around the world.
    </p>

  </div>
</section>

              {/* Problem Statement */}
              <section id="industry-overview" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    2. Industry Overview
  </h2>

  <div className="space-y-5 text-muted leading-8">

    <p>
      Digital finance is experiencing one of the most significant
      technological transformations in modern history.
      Blockchain technology enables value to move globally without
      traditional financial intermediaries, creating faster settlement,
      lower operational costs, greater transparency,
      and improved accessibility.
    </p>

    <p>
      Governments, enterprises, financial institutions,
      and technology companies are increasingly exploring
      blockchain infrastructure for payments, settlements,
      decentralized applications, digital identity,
      and financial services.
    </p>

    <p>
      Despite rapid growth, blockchain adoption continues
      to face practical challenges including fragmented ecosystems,
      complicated user experiences, inconsistent transaction fees,
      and limited merchant integration.
    </p>

    <p>
      Nexar Network is designed to solve these problems by
      delivering a payment-focused blockchain ecosystem built
      around usability, security, scalability,
      and long-term sustainability.
    </p>

  </div>
</section>
              {/* Nexar Network Architecture */}
             <section id="current-challenges" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    3. Current Challenges
  </h2>

  <div className="space-y-5 text-muted leading-8">
    <p>
      Although blockchain technology has advanced significantly,
      mainstream adoption continues to face several important obstacles.
    </p>

    <ul className="list-disc space-y-2 pl-6">
      <li>Complex wallet onboarding.</li>
      <li>High or unpredictable transaction fees.</li>
      <li>Slow international payment settlement.</li>
      <li>Fragmented blockchain ecosystems.</li>
      <li>Limited merchant adoption.</li>
      <li>Difficult developer integration.</li>
      <li>Poor user experience for beginners.</li>
      <li>Lack of payment-focused infrastructure.</li>
    </ul>

    <p>
      Many businesses continue relying on expensive payment providers
      because blockchain integration remains technically challenging.
      Nexar Network aims to simplify these processes through modern,
      scalable payment infrastructure.
    </p>
  </div>
</section>

              {/* Tokenomics & Allocation */}
             <section id="nexar-solution" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    4. The Nexar Solution
  </h2>

  <div className="space-y-5 text-muted leading-8">

    <p>
      Nexar Network introduces a blockchain payment ecosystem built
      around simplicity, scalability, transparency,
      and long-term sustainability.
    </p>

    <p>
      The ecosystem launches on BNB Smart Chain while gradually
      expanding into a complete blockchain infrastructure supporting
      businesses, developers, merchants and global users.
    </p>

    <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
      <h3 className="mb-4 font-heading text-lg font-semibold text-white">
        Long-Term Infrastructure
      </h3>

      <ul className="list-disc space-y-2 pl-6 text-muted">
        <li>Nexar Wallet</li>
        <li>Nexar Pay</li>
        <li>Nexar Explorer</li>
        <li>Nexar Bridge</li>
        <li>Developer APIs</li>
        <li>Merchant Payment Gateway</li>
        <li>Launchpad</li>
        <li>Cross-chain Services</li>
        <li>Independent Nexar Blockchain</li>
      </ul>
    </div>

    <p>
      Every component is designed to strengthen the ecosystem while
      maintaining affordability, security,
      transparency and accessibility.
    </p>

  </div>
</section>

<section id="vision" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    5. Vision
  </h2>

  <div className="space-y-5 text-muted leading-8">
    <p>
      Our vision is to establish Nexar Network as one of the world&apos;s
      leading blockchain ecosystems dedicated to digital payments.
    </p>

    <p>
      We envision a future where businesses, developers,
      and individuals can transfer value globally without unnecessary
      costs, delays or centralized barriers.
    </p>

    <p>
      Beyond operating as a digital asset, NXR is intended to become
      the foundation of an independent blockchain ecosystem powering
      payment infrastructure worldwide.
    </p>
  </div>
</section>

<section id="mission" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    6. Mission
  </h2>

  <div className="space-y-5 text-muted leading-8">
    <p>
      Our mission is to simplify blockchain payments by building
      technology that combines security, scalability,
      transparency and low transaction costs.
    </p>

    <ul className="list-disc space-y-2 pl-6">
      <li>High Performance</li>
      <li>Security</li>
      <li>Transparency</li>
      <li>Accessibility</li>
      <li>Low Transaction Costs</li>
      <li>Developer Friendly Infrastructure</li>
      <li>Long-Term Sustainability</li>
    </ul>

    <p>
      We believe blockchain technology should become simple enough
      for everyday use while remaining powerful enough to support
      large-scale financial systems.
    </p>
  </div>
</section>

<section id="core-values" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    7. Core Values
  </h2>

  <div className="space-y-6">

    <div className="luxury-border rounded-2xl bg-card/40 p-6">
      <h3 className="mb-2 text-lg font-semibold text-gold">Security</h3>
      <p className="text-muted leading-8">
        Protecting users, digital assets and infrastructure remains our
        highest priority.
      </p>
    </div>

    <div className="luxury-border rounded-2xl bg-card/40 p-6">
      <h3 className="mb-2 text-lg font-semibold text-gold">Transparency</h3>
      <p className="text-muted leading-8">
        Open communication regarding development, token allocation,
        roadmap progress and ecosystem decisions.
      </p>
    </div>

    <div className="luxury-border rounded-2xl bg-card/40 p-6">
      <h3 className="mb-2 text-lg font-semibold text-gold">Innovation</h3>
      <p className="text-muted leading-8">
        Continuous research and development of technologies that improve
        blockchain payment infrastructure.
      </p>
    </div>

    <div className="luxury-border rounded-2xl bg-card/40 p-6">
      <h3 className="mb-2 text-lg font-semibold text-gold">Community</h3>
      <p className="text-muted leading-8">
        Building a decentralized ecosystem together with users,
        developers, partners and investors.
      </p>
    </div>

  </div>
</section>

<section id="why-nexar" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    8. Why Nexar Network
  </h2>

  <div className="space-y-5 text-muted leading-8">

    <p>
      Nexar Network focuses on solving practical payment challenges
      instead of creating another speculative cryptocurrency.
    </p>

    <ul className="list-disc space-y-2 pl-6">
      <li>Fast blockchain transactions</li>
      <li>Low transaction costs</li>
      <li>Transparent tokenomics</li>
      <li>Merchant payment solutions</li>
      <li>Developer-friendly APIs</li>
      <li>Secure smart contracts</li>
      <li>Cross-chain compatibility</li>
      <li>Future blockchain infrastructure</li>
      <li>Long-term ecosystem growth</li>
    </ul>

  </div>
</section>

<section id="market-opportunity" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    9. Market Opportunity
  </h2>

  <div className="space-y-5 text-muted leading-8">

    <p>
      Global digital payments continue to expand rapidly as consumers
      and businesses increasingly adopt blockchain technology.
    </p>

    <p>
      Enterprises require payment systems that provide lower operating
      costs, faster settlement, global accessibility, security and
      transparent accounting.
    </p>

    <p>
      Nexar Network intends to position itself within this growing
      market by delivering blockchain infrastructure designed for both
      individuals and enterprises.
    </p>

  </div>
</section>

<section id="technology-overview" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    10. Technology Overview
  </h2>

  <div className="space-y-6 text-muted leading-8">

    <p>
      Nexar Network launches on BNB Smart Chain, leveraging its mature
      infrastructure, fast confirmations and low transaction costs while
      preparing for future independent blockchain development.
    </p>

    <div className="luxury-border rounded-2xl bg-card/40 p-6">

      <h3 className="mb-4 text-lg font-semibold text-white">
        Technical Specifications
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <p className="text-xs uppercase text-muted">Blockchain</p>
          <p className="text-white">BNB Smart Chain</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Standard</p>
          <p className="text-white">BEP-20</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Decimals</p>
          <p className="text-white">18</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Maximum Supply</p>
          <p className="text-white">500,000,000 NXR</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Mint</p>
          <p className="text-white">Disabled Forever</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Consensus</p>
          <p className="text-white">Proof of Staked Authority</p>
        </div>

      </div>

    </div>

  </div>
</section>

<section id="token-overview" className="scroll-mt-24 mb-16">
  <h2 className="font-heading text-2xl font-semibold text-white mb-6">
    11. Token Overview
  </h2>

  <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
    <div className="grid gap-4 sm:grid-cols-2">

      <div><p className="text-xs uppercase text-muted">Project</p><p className="text-white">Nexar Network</p></div>

      <div><p className="text-xs uppercase text-muted">Ticker</p><p className="text-white">NXR</p></div>

      <div><p className="text-xs uppercase text-muted">Blockchain</p><p className="text-white">BNB Smart Chain (BEP-20)</p></div>

      <div><p className="text-xs uppercase text-muted">Maximum Supply</p><p className="text-white">500,000,000 NXR</p></div>

      <div><p className="text-xs uppercase text-muted">Decimals</p><p className="text-white">18</p></div>

      <div><p className="text-xs uppercase text-muted">Mint</p><p className="text-white">Disabled Forever</p></div>

    </div>
  </div>
</section>

<section id="tokenomics" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
12. Tokenomics
</h2>

<div className="luxury-border rounded-2xl bg-card/40 p-6">

<div className="space-y-4 text-muted">

<p><strong className="text-white">Liquidity</strong> — 150,000,000 NXR (30%)</p>

<p><strong className="text-white">Ecosystem</strong> — 100,000,000 NXR (20%)</p>

<p><strong className="text-white">Presale</strong> — 100,000,000 NXR (20%)</p>

<p><strong className="text-white">Team</strong> — 75,000,000 NXR (15%)</p>

<p><strong className="text-white">Marketing</strong> — 50,000,000 NXR (10%)</p>

<p><strong className="text-white">Community Rewards</strong> — 25,000,000 NXR (5%)</p>

</div>

</div>

</section>

<section id="team-vesting" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
13. Team Vesting
</h2>

<div className="space-y-5 text-muted leading-8">

<p>
The total allocation for the team equals
75,000,000 NXR.
</p>

<p>
Only 25,000,000 NXR will initially become available.
The remaining 50,000,000 NXR will remain locked
inside a dedicated vesting smart contract.
</p>

<ul className="list-disc space-y-2 pl-6">

<li>12 Month Cliff</li>

<li>Gradual Unlock</li>

<li>Smart Contract Controlled Release</li>

</ul>

</div>

</section>

<section id="token-utility" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
14. Token Utility
</h2>

<ul className="list-disc space-y-3 pl-6 text-muted leading-8">

<li>Global Payments</li>

<li>Merchant Payments</li>

<li>Wallet Transfers</li>

<li>Community Rewards</li>

<li>Ecosystem Services</li>

<li>Governance (Future)</li>

<li>Staking (Future)</li>

<li>Validator Rewards (Future)</li>

<li>Future Network Gas Fees</li>

</ul>

</section>

              {/* Ecosystem Modules */}
              <section id="ecosystem" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
15. Nexar Ecosystem
</h2>

<div className="grid gap-5 md:grid-cols-2">

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Nexar Wallet</h3>
<p className="text-muted">Secure non-custodial wallet for digital assets.</p>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Nexar Pay</h3>
<p className="text-muted">Merchant payment infrastructure.</p>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Explorer</h3>
<p className="text-muted">Blockchain explorer for transparency.</p>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Bridge</h3>
<p className="text-muted">Cross-chain asset transfers.</p>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Launchpad</h3>
<p className="text-muted">Support promising blockchain projects.</p>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-5">
<h3 className="text-gold font-semibold mb-2">Nexar Chain</h3>
<p className="text-muted">Future independent blockchain network.</p>
</div>

</div>

</section>

              {/* Security & Compliance */}
            <section id="security" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
16. Security & Transparency
</h2>

<div className="space-y-5 text-muted leading-8">

<p>
Security is one of the core principles of Nexar Network.
Every stage of development prioritizes transparency,
reliability and long-term ecosystem protection.
</p>

<ul className="list-disc pl-6 space-y-2">

<li>Verified Smart Contracts</li>

<li>Transparent Token Allocation</li>

<li>Dedicated Allocation Wallets</li>

<li>Team Vesting Smart Contracts</li>

<li>Public Roadmap</li>

<li>Community Communication</li>

<li>Future Independent Security Audits</li>

</ul>

</div>

</section>

<section id="official-addresses" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
17. Official Wallet Addresses
</h2>

<div className="space-y-6 text-muted leading-8">

<p>
The following blockchain addresses are the official on-chain
addresses of Nexar Network and are publicly disclosed for
transparency, verification and community reference.
</p>

<div className="luxury-border rounded-2xl bg-card/40 p-6">

<h3 className="text-gold font-semibold mb-2">
NXR Token Contract
</h3>

<p className="font-mono break-all">
{CONTRACTS.token}
</p>

<p className="mt-3">
Official BEP-20 smart contract of the NXR token.
</p>

</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">

<h3 className="text-gold font-semibold mb-2">
Treasury Wallet
</h3>

<p className="font-mono break-all">
{CONTRACTS.treasury}
</p>

<p className="mt-3">
The official Treasury Wallet is responsible for ecosystem funding,
liquidity management, strategic reserves, operational expenses,
partnerships and long-term development of Nexar Network.
</p>

</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">

<h3 className="text-gold font-semibold mb-2">
Presale Contract
</h3>

<p className="font-mono break-all">
{CONTRACTS.presale}
</p>

<p className="mt-3">
Official smart contract used for the Nexar Network presale.
</p>

</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">

<h3 className="text-gold font-semibold mb-2">
Team Vesting Contract
</h3>

<p className="font-mono break-all">
{CONTRACTS.teamVesting}
</p>

<p className="mt-3">
Official smart contract responsible for locking and gradually
releasing team allocations according to the official vesting schedule.
</p>

</div>

</div>

</section>

              {/* Roadmap & Milestones */}
             <section id="roadmap" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
18. Roadmap
</h2>

<div className="space-y-6">

<div className="luxury-border rounded-2xl bg-card/40 p-6">
<h3 className="text-gold font-semibold mb-3">Phase 1 — Foundation</h3>
<ul className="list-disc pl-6 space-y-2 text-muted">
<li>Website Launch</li>
<li>Whitepaper Publication</li>
<li>Smart Contract Deployment</li>
<li>Contract Verification</li>
<li>Community Building</li>
<li>Presale Preparation</li>
</ul>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">
<h3 className="text-gold font-semibold mb-3">Phase 2 — Growth</h3>
<ul className="list-disc pl-6 space-y-2 text-muted">
<li>Presale Launch</li>
<li>Marketing Campaigns</li>
<li>Strategic Partnerships</li>
<li>DEX Listings</li>
<li>Ecosystem Development</li>
</ul>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">
<h3 className="text-gold font-semibold mb-3">Phase 3 — Expansion</h3>
<ul className="list-disc pl-6 space-y-2 text-muted">
<li>Nexar Wallet</li>
<li>Nexar Pay</li>
<li>Explorer</li>
<li>Bridge</li>
<li>Developer APIs</li>
</ul>
</div>

<div className="luxury-border rounded-2xl bg-card/40 p-6">
<h3 className="text-gold font-semibold mb-3">Phase 4 — Nexar Chain</h3>
<ul className="list-disc pl-6 space-y-2 text-muted">
<li>Validator Network</li>
<li>Testnet</li>
<li>Mainnet</li>
<li>Global Adoption</li>
</ul>
</div>

</div>

</section>

<section id="founder" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
19. Founder
</h2>

<div className="luxury-border rounded-2xl bg-card/40 p-8">

<h3 className="text-2xl font-semibold text-gold mb-2">
Mahmoud Elgabry
</h3>

<p className="text-white mb-6">
Founder of Nexar Network
</p>

<div className="space-y-5 text-muted leading-8">

<p>
Nexar Network was founded with the objective of building
a practical blockchain ecosystem focused on global payments
instead of short-term speculation.
</p>

<p>
The long-term vision is to transform Nexar Network from a
BNB Smart Chain token into an independent blockchain
supporting payment infrastructure, developers,
businesses and decentralized applications.
</p>

</div>

</div>

</section>

<section id="legal" className="scroll-mt-24 mb-16">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
20. Legal Disclaimer
</h2>

<div className="space-y-5 text-muted leading-8">

<p>
This document is provided for informational purposes only.
Nothing contained in this whitepaper should be interpreted
as financial, legal or investment advice.
</p>

<p>
Participation in digital asset markets involves risk.
Every participant should perform independent research
before making financial decisions.
</p>

<p>
Future development plans, timelines and ecosystem features
may evolve as Nexar Network continues to develop.
</p>

</div>

</section>

<section id="conclusion" className="scroll-mt-24">

<h2 className="font-heading text-2xl font-semibold text-white mb-6">
21. Conclusion
</h2>

<div className="space-y-5 text-muted leading-8">

<p>
Nexar Network represents a long-term vision focused on
making blockchain payments faster, more accessible,
secure and affordable.
</p>

<p>
Beginning on BNB Smart Chain provides immediate usability
while laying the foundation for future innovation,
payment infrastructure and the development of the
independent Nexar Chain.
</p>

<p>
Through transparency, continuous development,
community participation and responsible growth,
Nexar Network aims to become one of the leading
global blockchain payment ecosystems.
</p>

</div>

</section>
            </article>

            {/* Back to Top Button */}
            {showBackToTop && (
              <button
                type="button"
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/80 backdrop-blur-xl text-gold shadow-lg transition-all hover:border-gold/30 hover:bg-gold hover:text-background"
                aria-label="Back to top"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
