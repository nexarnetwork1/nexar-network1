"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { WalletMenu } from "./WalletMenu";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

type ConnectWalletButtonProps = ButtonProps;

export function ConnectWalletButton({
  children,
  ...props
}: ConnectWalletButtonProps) {
  const { login, ready, authenticated } = usePrivy();
  const [connecting, setConnecting] = useState(false);

  if (!isWeb3Configured()) {
    return (
      <Button {...props} disabled title="Wallet provider not configured">
        Wallet unavailable
      </Button>
    );
  }

  if (!ready) {
    return (
      <Button {...props} disabled>
        Loading wallet…
      </Button>
    );
  }

  if (authenticated) {
    return <WalletMenu />;
  }

  return (
    <Button
      {...props}
      disabled={connecting}
      onClick={async () => {
        if (connecting) return;
        setConnecting(true);
        try {
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
