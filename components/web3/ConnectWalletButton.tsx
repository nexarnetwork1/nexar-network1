"use client";

import { useAccount } from 'wagmi'
import { Button, type ButtonProps } from "@/components/ui/Button";
import { getAppKit } from "@/components/web3/AppKitInit";

type ConnectWalletButtonProps = ButtonProps;

export function ConnectWalletButton({
  children,
  ...props
}: ConnectWalletButtonProps) {
  const { address, isConnected, chain } = useAccount()

  const appKit = getAppKit();

  if (!isConnected) {
    return (
      <Button
        {...props}
        onClick={() => appKit?.open()}
      >
        {children ?? "Connect Wallet"}
      </Button>
    );
  }

  if (chain?.id !== 56) {
    return (
      <Button
        {...props}
        onClick={() => appKit?.open({ view: 'Networks' })}
      >
        Switch Network
      </Button>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  return (
    <Button
      {...props}
      onClick={() => appKit?.open({ view: 'Account' })}
    >
      {shortAddress}
    </Button>
  );
}
