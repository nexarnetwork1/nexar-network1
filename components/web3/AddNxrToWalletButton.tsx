"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { addNxrToWallet, getWatchAssetErrorMessage } from "@/lib/web3/add-nxr-token";
import {
  getWalletEthereumProvider,
  resolveActivePrivyWallet,
} from "@/lib/web3/active-wallet";
import { cn } from "@/lib/utils/cn";

type AddNxrToWalletButtonProps = ButtonProps & {
  label?: string;
};

export function AddNxrToWalletButton({
  label = "Add NXR to Wallet",
  className,
  ...props
}: AddNxrToWalletButtonProps) {
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);

  const activeWallet = useMemo(
    () => resolveActivePrivyWallet(wallets, address),
    [wallets, address],
  );

  async function handleAddToken() {
    if (!isWeb3Configured()) {
      toast.error("Wallet provider is not configured.");
      return;
    }

    if (!isConnected || !activeWallet) {
      toast.error("Connect a wallet first.");
      return;
    }

    setLoading(true);
    try {
      const provider = await getWalletEthereumProvider(activeWallet);
      if (!provider) {
        toast.error("Unable to reach your connected wallet.");
        return;
      }

      const network = await addNxrToWallet(provider, chainId);
      toast.success(`NXR added on ${network.shortName}.`);
    } catch (error) {
      toast.error(getWatchAssetErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("gap-2", className)}
      disabled={loading}
      onClick={handleAddToken}
      {...props}
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      {loading ? "Adding…" : label}
    </Button>
  );
}
