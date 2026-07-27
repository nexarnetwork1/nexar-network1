"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Currency } from "@/shared/payments";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { BlockchainNetwork, getAddressExplorerUrl } from "@/shared/payments/network";

interface WalletAddressCardProps {
  walletAddress: string;
  currency: Currency;
  network?: BlockchainNetwork;
}

export function WalletAddressCard({ walletAddress, currency, network = BlockchainNetwork.BNB_SMART_CHAIN }: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string) => {
    return getAddressExplorerUrl(network, address);
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Wallet Address</h3>
      
      <div className="space-y-4">
        {/* Address Display */}
        <div className="rounded-lg border border-border bg-black/30 p-4">
          <div className="flex items-center justify-between gap-2">
            <code className="flex-1 truncate text-sm font-mono text-gold">
              {walletAddress}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                copied
                  ? "bg-green-500/10 text-green-400"
                  : "bg-gold/10 text-gold hover:bg-gold/20"
              )}
              aria-label="Copy wallet address"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Short Address */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Short:</span>
            <code className="text-sm font-mono text-white">
              {formatAddress(walletAddress)}
            </code>
          </div>
          <a
            href={getExplorerUrl(walletAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors"
            aria-label={`View ${currency} address on explorer`}
          >
            <ExternalLink className="h-3 w-3" />
            <span>View on Explorer</span>
          </a>
        </div>

        {/* Network Info */}
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Network</span>
            <span className="text-xs font-medium text-gold">
              {currency === Currency.ETH || currency === Currency.USDT || currency === Currency.USDC
                ? "Ethereum"
                : currency === Currency.BNB
                ? "Binance Smart Chain"
                : "Nexar Network"}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-xs text-yellow-200">
            ⚠️ Only send {currency} to this address. Sending any other currency may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}
