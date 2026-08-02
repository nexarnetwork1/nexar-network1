"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { WalletMenu } from "./WalletMenu";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { markWalletSessionActive } from "@/lib/web3/wallet-session";
import { useWalletPanel, type WalletPanelState } from "./useWalletPanel";

type ConnectWalletButtonProps = ButtonProps & {
  panel?: WalletPanelState;
};

function ConnectWalletButtonView({
  panel,
  children,
  className,
  ...props
}: ConnectWalletButtonProps & { panel: WalletPanelState }) {
  const { login, ready, authenticated } = usePrivy();
  const [connecting, setConnecting] = useState(false);

  if (!isWeb3Configured()) {
    return (
      <Button {...props} className={className} disabled title="Wallet provider not configured">
        Wallet unavailable
      </Button>
    );
  }

  if (!ready) {
    return (
      <Button {...props} className={className} disabled>
        Loading wallet…
      </Button>
    );
  }

  if (authenticated) {
    return <WalletMenu panel={panel} className={className} />;
  }

  return (
    <Button
      {...props}
      className={className}
      disabled={connecting}
      onClick={async () => {
        if (connecting) return;
        setConnecting(true);
        try {
          markWalletSessionActive();
          await login();
        } catch {
          // Privy surfaces wallet errors in its modal
        } finally {
          setConnecting(false);
        }
      }}
    >
      {connecting ? "Connecting…" : children ?? "Connect Wallet"}
    </Button>
  );
}

function ConnectWalletButtonWithPanel(props: ConnectWalletButtonProps) {
  const panel = useWalletPanel();
  return <ConnectWalletButtonView panel={panel} {...props} />;
}

export function ConnectWalletButton({ panel, ...props }: ConnectWalletButtonProps) {
  if (panel) {
    return <ConnectWalletButtonView panel={panel} {...props} />;
  }
  return <ConnectWalletButtonWithPanel {...props} />;
}
