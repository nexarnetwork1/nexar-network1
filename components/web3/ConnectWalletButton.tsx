"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { WalletMenu } from "./WalletMenu";

type ConnectWalletButtonProps = ButtonProps;

export function ConnectWalletButton({
  children,
  ...props
}: ConnectWalletButtonProps) {
  const { login, ready, authenticated } = usePrivy();

  const [connecting, setConnecting] = useState(false);

  if (!ready) {
    return (
      <Button {...props} disabled>
        Loading...
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
        } finally {
          setConnecting(false);
        }
      }}
    >
      {connecting ? "Connecting..." : children ?? "Connect Wallet"}
    </Button>
  );
}
