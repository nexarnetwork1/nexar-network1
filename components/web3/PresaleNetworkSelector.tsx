"use client";

import Image from "next/image";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { AlertCircle } from "lucide-react";
import {
  PRESALE_NETWORK_LIST,
  type PresaleNetworkId,
} from "@/lib/constants/presale-networks";
import { usePresaleNetworkContext } from "@/components/providers/PresaleNetworkProvider";
import { requestPresaleNetworkSwitch } from "@/lib/web3/switch-presale-network";
import { cn } from "@/lib/utils/cn";

type PresaleNetworkSelectorProps = {
  className?: string;
};

export function PresaleNetworkSelector({ className }: PresaleNetworkSelectorProps) {
  const { networkId, network, setNetworkId } = usePresaleNetworkContext();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const wrongNetwork = isConnected && walletChainId !== network.chainId;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Network
        </p>
        <span className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
          Multi-Chain
        </span>
      </div>

      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Presale network"
      >
        {PRESALE_NETWORK_LIST.map((item) => {
          const selected = networkId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setNetworkId(item.id as PresaleNetworkId)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300",
                selected
                  ? "border-gold/40 bg-gold/10 shadow-[0_0_24px_rgba(212,175,55,0.08)]"
                  : "border-border bg-background/40 hover:border-gold/20 hover:bg-white/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-gold bg-gold" : "border-muted/40",
                )}
              >
                {selected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                ) : null}
              </span>
              <Image
                src={item.icon}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">
                  {item.name}
                </span>
                <span className="block text-[11px] text-muted">
                  Chain ID {item.chainId}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {wrongNetwork ? (
        <div className="flex flex-col gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Wallet is on a different network. Switch to{" "}
              <strong className="font-medium">{network.name}</strong> to buy or
              claim.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              void requestPresaleNetworkSwitch(switchChainAsync, network).catch(
                () => {
                  /* wallet surfaces rejection */
                },
              );
            }}
            className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/15"
          >
            Switch to {network.shortName}
          </button>
        </div>
      ) : null}
    </div>
  );
}
