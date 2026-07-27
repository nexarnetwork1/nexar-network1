"use client";

import { useBalance } from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits } from "viem";

export function usePresaleWalletBalances(address?: `0x${string}`, usdtBalanceWei?: bigint, usdtDecimals = 18) {
  const { data: bnbBalance, refetch: refetchBnb } = useBalance({
    address,
    chainId: bsc.id,
  });

  return {
    bnbBalance: bnbBalance?.value,
    bnbBalanceFormatted: bnbBalance ? formatUnits(bnbBalance.value, 18) : "0",
    usdtBalance: usdtBalanceWei,
    usdtBalanceFormatted: usdtBalanceWei ? formatUnits(usdtBalanceWei, usdtDecimals) : "0",
    refetchBalances: () => {
      void refetchBnb();
    },
  };
}
