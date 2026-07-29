"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { addNxrToWallet, getWatchAssetErrorMessage } from "@/lib/web3/add-nxr-token";
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
  const [loading, setLoading] = useState(false);

  async function handleAddToken() {
    if (!isWeb3Configured()) {
      toast.error("Wallet provider is not configured.");
      return;
    }

    const wallet = wallets[0];
    const provider = await wallet?.getEthereumProvider?.();
    if (!provider) {
      toast.error("Connect a wallet first.");
      return;
    }

    setLoading(true);
    try {
      await addNxrToWallet(provider as { request: (args: { method: string; params?: unknown }) => Promise<unknown> });
      toast.success("NXR added to your wallet.");
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
