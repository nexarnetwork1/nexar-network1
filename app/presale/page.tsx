"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PresaleArtwork } from "@/components/presale/PresaleArtwork";
import { PresalePanel } from "@/components/web3/PresalePanel";
import { PresalePortfolio } from "@/components/web3/PresalePortfolio";
import { PresaleTransactionHistory } from "@/components/web3/PresaleTransactionHistory";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { CONTRACTS } from "@/lib/constants/site";

export default function PresalePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <PresaleArtwork />
      <Container className="relative py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium tracking-[0.24em] uppercase text-gold">Public Presale</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">Buy NXR on BNB Smart Chain</h1>
          <p className="mt-4 max-w-2xl text-muted">
            All presale data is read directly from the deployed NexarPresale smart contract on BNB Smart Chain.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ConnectWalletButton size="md" />
            <Link
              href={`https://bscscan.com/address/${CONTRACTS.presale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
            >
              Verify contract <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PresalePanel />
            </div>
            <div className="space-y-6 lg:col-span-2">
              <PresalePortfolio />
              <PresaleTransactionHistory />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
