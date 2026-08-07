"use client";

import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { usePresaleNetworkContext } from "@/components/providers/PresaleNetworkProvider";

export function usePresaleWalletBalances(
  address?: `0x${string}`,
  usdtBalanceWei?: bigint,
  usdtDecimals = 18,
) {
  const { network } = usePresaleNetworkContext();
  const chainId = network.chainId;

  const { data: nativeBalance, refetch: refetchNative } = useBalance({
    address,
    chainId,
  });

  return {
    nativeBalance: nativeBalance?.value,
    nativeBalanceFormatted: nativeBalance
      ? formatUnits(nativeBalance.value, 18)
      : "0",
    nativeSymbol: network.nativeSymbol,
    bnbBalance: nativeBalance?.value,
    bnbBalanceFormatted: nativeBalance
      ? formatUnits(nativeBalance.value, 18)
      : "0",
    usdtBalance: usdtBalanceWei,
    usdtBalanceFormatted: usdtBalanceWei
      ? formatUnits(usdtBalanceWei, usdtDecimals)
      : "0",
    refetchBalances: () => {
      void refetchNative();
    },
  };
}
