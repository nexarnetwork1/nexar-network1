"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  PRESALE_NETWORK_LIST,
  getExplorerAddressUrl,
} from "@/lib/constants/presale-networks";
import { CONTRACTS } from "@/lib/constants/site";
import { CopyButton } from "@/components/ui/CopyButton";

const LEGACY_CONTRACTS = [
  {
    label: "Treasury",
    address: CONTRACTS.treasury,
    explorerNetwork: PRESALE_NETWORK_LIST[0],
  },
  {
    label: "Team Vesting",
    address: CONTRACTS.teamVesting,
    explorerNetwork: PRESALE_NETWORK_LIST[0],
  },
] as const;

export function MultiChainContractsCard() {
  return (
    <div className="luxury-border rounded-2xl bg-card/30 p-6 backdrop-blur-xl md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
            Supported Networks
          </p>
          <h3 className="mt-1 font-heading text-xl font-semibold">
            Multi-Chain Deployment
          </h3>
        </div>
        <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
          Multi-Chain Deployment
        </span>
      </div>

      <div className="space-y-6">
        {PRESALE_NETWORK_LIST.map((network) => (
          <div
            key={network.id}
            className="rounded-xl border border-white/5 bg-background/30 p-5 transition-colors hover:border-gold/15"
          >
            <div className="mb-4 flex items-center gap-3">
              <Image
                src={network.icon}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <div>
                <p className="font-medium text-white">{network.name}</p>
                <p className="text-[11px] text-muted">Chain ID {network.chainId}</p>
              </div>
              <span className="ml-auto rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                {network.shortName}
              </span>
            </div>

            <div className="space-y-4">
              {(
                [
                  { label: "Nexar Token", address: network.contracts.token },
                  { label: "Presale", address: network.contracts.presale },
                ] as const
              ).map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
                    {item.label}
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-5 text-gold">
                      {item.address}
                    </code>
                    <CopyButton
                      text={item.address}
                      label={`Copy ${item.label} address on ${network.shortName}`}
                    />
                    <Link
                      href={getExplorerAddressUrl(network, item.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-gold/30 hover:text-gold"
                      aria-label={`View ${item.label} on ${network.explorerName}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-dashed border-white/10 bg-background/20 p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
            BNB Smart Chain — Additional Contracts
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {LEGACY_CONTRACTS.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
                  {item.label}
                </p>
                <div className="mt-2 flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-5 text-gold">
                    {item.address}
                  </code>
                  <CopyButton text={item.address} label={`Copy ${item.label} address`} />
                  <Link
                    href={getExplorerAddressUrl(item.explorerNetwork, item.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-gold/30 hover:text-gold"
                    aria-label={`View ${item.label} on BscScan`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-success">
            Source verified on {PRESALE_NETWORK_LIST[0].explorerName}
          </p>
        </div>
      </div>
    </div>
  );
}
