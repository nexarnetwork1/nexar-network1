"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, type ButtonProps } from "@/components/ui/Button";

type ConnectWalletButtonProps = ButtonProps & {
  showAddress?: boolean;
  showNetwork?: boolean;
};

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
        openConnectModal,
        openChainModal,
        authenticationStatus,
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
              onClick={openConnectModal}
              {...props}
            >
              {children ?? "Connect Wallet"}
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              {...props}
            >
              Switch Network
            </Button>
          );
        }

        return (
          <Button
            onClick={openConnectModal}
            {...props}
          >
            {account.displayName}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
