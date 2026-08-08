"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

import { Container } from "@/components/ui/Container";
import { SITE, CONTRACTS } from "@/lib/constants/site";

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-gold transition-colors"
      aria-label={label}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export default function OfficialAddressesPage() {
  return (
    <main className="min-h-screen">
      <Container className="py-16 lg:py-24">

        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mx-auto max-w-5xl">

          <p className="mb-4 text-xs font-medium tracking-[0.24em] uppercase text-gold">
            Official Documentation
          </p>

          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Official Wallet Addresses
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
            This page contains the official blockchain addresses of
            Nexar Network. Every address listed below belongs to the
            project and can be independently verified on Binance Smart
            Chain.
          </p>

          {[
            {
              title: "NXR Token Contract",
              address: CONTRACTS.token,
              purpose:
                "Official BEP-20 smart contract for the NXR token.",
            },
            {
              title: "Treasury Wallet",
              address: CONTRACTS.treasury,
              purpose:
                "Official treasury wallet responsible for ecosystem funding, liquidity operations, strategic reserves and project development.",
            },
            {
              title: "Presale Contract",
              address: CONTRACTS.presale,
              purpose:
                "Official smart contract used for the Nexar Network token presale.",
            },
            {
              title: "Team Vesting Contract",
              address: CONTRACTS.teamVesting,
              purpose:
                "Official vesting contract that securely locks and gradually releases team allocations.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-card/50 p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">
                    {item.title}
                  </h2>

                  <p className="mt-3 text-muted leading-7">
                    {item.purpose}
                  </p>

                  <div className="mt-6 break-all rounded-xl border border-border bg-background/60 p-4 font-mono text-sm">
                    {item.address}
                  </div>
                </div>

                <div className="flex gap-3">
                  <CopyButton
                    text={item.address}
                    label={`Copy ${item.title}`}
                  />

                  <Link
                    href={`https://bscscan.com/address/${item.address}`}
                    target="_blank"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:border-gold hover:text-gold"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}


          <div className="mt-16 rounded-3xl border border-gold/20 bg-gold/5 p-8">
            <h2 className="text-2xl font-semibold">
              Transparency Commitment
            </h2>

            <p className="mt-4 leading-8 text-muted">
              Nexar Network is committed to maintaining complete
              transparency by publicly disclosing all official
              blockchain addresses used by the project.
            </p>

            <p className="mt-4 leading-8 text-muted">
              These addresses are referenced throughout the official
              documentation and are intended to help community members,
              partners and third-party services identify legitimate
              Nexar Network wallets and smart contracts.
            </p>
          </div>
        
        </div>
      </Container>
    </main>
  );
}
