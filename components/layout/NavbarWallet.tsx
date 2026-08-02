"use client";

import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { WalletIconButton } from "@/components/web3/WalletIconButton";
import { useWalletPanel } from "@/components/web3/useWalletPanel";

export function NavbarWallet() {
  const panel = useWalletPanel();

  return (
    <>
      <WalletIconButton panel={panel} className="sm:hidden" />
      <ConnectWalletButton
        panel={panel}
        variant="primary"
        size="sm"
        magnetic
        glow
        className="hidden sm:inline-flex"
      >
        Connect Wallet
      </ConnectWalletButton>
    </>
  );
}
