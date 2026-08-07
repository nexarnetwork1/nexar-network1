"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PresaleArtwork } from "@/components/presale/PresaleArtwork";
import { PresalePanel } from "@/components/web3/PresalePanel";
import { PresalePortfolio } from "@/components/web3/PresalePortfolio";
import { PresaleTransactionHistory } from "@/components/web3/PresaleTransactionHistory";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { PresaleNetworkProvider } from "@/components/providers/PresaleNetworkProvider";
import {
  PRESALE_NETWORK_LIST,
  getExplorerAddressUrl,
  type PresaleNetworkConfig,
} from "@/lib/constants/presale-networks";

function PresaleNetworkColumn({ network }: { network: PresaleNetworkConfig }) {
  return (
    <PresaleNetworkProvider networkId={network.id} locked>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-muted uppercase">
              Network
            </p>
            <p className="mt-1 font-heading text-lg font-semibold text-white">
              {network.name}
            </p>
          </div>
          <Link
            href={getExplorerAddressUrl(network, network.contracts.presale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            Verify contract on {network.explorerName}{" "}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <PresalePanel />
        <PresalePortfolio />
        <PresaleTransactionHistory />
      </div>
    </PresaleNetworkProvider>
  );
}

export default function PresalePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <PresaleArtwork />
      <Container className="relative py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium tracking-[0.24em] uppercase text-gold">
            Public Presale
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">
            Buy NXR Presale
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            All presale data is read directly from the deployed NexarPresale smart
            contracts on BNB Smart Chain and BOT Chain. Connect your wallet and
            choose the network card below.
          </p>
          <div className="mt-4">
            <ConnectWalletButton size="md" />
          </div>

          <div className="mt-10 grid gap-10 xl:grid-cols-2">
            {PRESALE_NETWORK_LIST.map((network) => (
              <PresaleNetworkColumn key={network.id} network={network} />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
