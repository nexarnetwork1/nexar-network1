"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, type ButtonProps } from "@/components/ui/Button";

type ConnectWalletButtonProps = ButtonProps;

export function ConnectWalletButton({
  children,
  ...props
}: ConnectWalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openConnectModal,
        openChainModal,
        openAccountModal,
      }) => {
        const ready =
          mounted && authenticationStatus !== "loading";

        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === "authenticated");

        if (!connected) {
          return (
            <Button
              {...props}
              onClick={openConnectModal}
            >
              {children ?? "Connect Wallet"}
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              {...props}
              onClick={openChainModal}
            >
              Switch Network
            </Button>
          );
        }

        return (
          <Button
            {...props}
            onClick={openAccountModal}
          >
            {account.displayName}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
