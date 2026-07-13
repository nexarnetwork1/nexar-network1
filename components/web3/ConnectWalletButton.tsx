"use client";

import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { Button, type ButtonProps } from "@/components/ui/Button";

type ConnectWalletButtonProps = ButtonProps;

export function ConnectWalletButton({
  children,
  ...props
}: ConnectWalletButtonProps) {
  const { address, isConnected, chain } = useAccount()
  const { open } = useAppKit()

  if (!isConnected) {
    return (
      <Button
        {...props}
        onClick={() => open()}
      >
        {children ?? "Connect Wallet"}
      </Button>
    );
  }

  if (chain?.id !== 56) {
    return (
      <Button
        {...props}
        onClick={() => open({ view: 'Networks' })}
      >
        Switch Network
      </Button>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  return (
    <Button
      {...props}
      onClick={() => open({ view: 'Account' })}
    >
      {shortAddress}
    </Button>
  );
}
