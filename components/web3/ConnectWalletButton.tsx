"use client";

import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { cn } from "@/lib/utils/cn";

type ConnectWalletButtonProps = ButtonProps & {
  showAddress?: boolean;
  showNetwork?: boolean;
};

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton({
  showAddress = true,
  showNetwork = true,
  children,
  className,
  ...props
}: ConnectWalletButtonProps) {
  if (!isWeb3Configured()) {
    return (
      <Button
        className={cn(className)}
        variant={props.variant ?? "primary"}
        size={props.size ?? "md"}
        disabled
        aria-label="Wallet connection not configured"
        title="WalletConnect project ID not set"
        {...props}
      >
        {children ?? "Connect Wallet"}
      </Button>
    );
  }

  return (
    <ConnectWalletButtonInner
      showAddress={showAddress}
      showNetwork={showNetwork}
      className={className}
      {...props}
    >
      {children}
    </ConnectWalletButtonInner>
  );
}

function ConnectWalletButtonInner({
  showAddress = true,
  showNetwork = true,
  children,
  className,
  ...props
}: ConnectWalletButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [switchError, setSwitchError] = useState<string | null>(null);

  const onWrongNetwork = isConnected && chainId !== bsc.id;

  const handleClick = () => {
    if (onWrongNetwork) {
      setSwitchError(null);
      switchChain(
        { chainId: bsc.id },
        {
          onError: (err) => {
            setSwitchError(err.message.slice(0, 80));
          },
          onSuccess: () => {
            setSwitchError(null);
          },
        },
      );
      return;
    }
    setSwitchError(null);
    open();
  };

  const label =
    isConnected && showAddress && address
      ? truncateAddress(address)
      : (children ?? "Connect Wallet");

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        className={cn(onWrongNetwork && "border-amber-500/40", className)}
        onClick={handleClick}
        disabled={isSwitching}
        {...props}
      >
        {onWrongNetwork ? (isSwitching ? "Switching…" : "Switch to BSC") : label}
      </Button>
      {showNetwork && isConnected && !onWrongNetwork && (
        <span className="font-mono text-[9px] tracking-wide text-emerald-400/80">
          BNB Smart Chain
        </span>
      )}
      {switchError && (
        <span className="max-w-[200px] text-right font-mono text-[9px] text-red-400/90">
          {switchError}
        </span>
      )}
    </div>
  );
}
