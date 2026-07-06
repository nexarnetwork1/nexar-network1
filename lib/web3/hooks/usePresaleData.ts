"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { formatUnits } from "viem";
import { CONTRACTS } from "@/lib/constants/site";
import { PRESALE_ABI } from "@/lib/web3/abi";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

export type PresaleStatus = "upcoming" | "active" | "ended" | "unknown";

const presaleAddress = CONTRACTS.presale as `0x${string}`;

const basePresaleContracts = [
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "totalSold" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "HARD_CAP" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "MIN_PURCHASE" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "MAX_PURCHASE" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "presaleStart" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "presaleEnd" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "usdtToken" as const,
    chainId: bsc.id,
  },
] as const;

const userPresaleContracts = [
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "purchased" as const,
    chainId: bsc.id,
  },
  {
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: "claimableOf" as const,
    chainId: bsc.id,
  },
] as const;

export function usePresaleData() {
  const web3Ready = isWeb3Configured();
  const { address } = useAccount();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const updateNow = () => setNow(Math.floor(Date.now() / 1000));
    updateNow();
    const intervalId = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const {
    data: baseData,
    isLoading: isBaseLoading,
    refetch: refetchBase,
  } = useReadContracts({
    contracts: basePresaleContracts,
    query: {
      enabled: web3Ready,
      refetchInterval: 30_000,
    },
  });

  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useReadContracts({
    contracts: userPresaleContracts.map((contract) => ({
      ...contract,
      args: [address ?? "0x0000000000000000000000000000000000000000"] as const,
    })),
    query: {
      enabled: web3Ready && Boolean(address),
      refetchInterval: 30_000,
    },
  });

  const refetch = () => {
    void refetchBase();
    void refetchUser();
  };

  const totalSold = baseData?.[0]?.result;
  const hardCap = baseData?.[1]?.result;
  const minPurchase = baseData?.[2]?.result;
  const maxPurchase = baseData?.[3]?.result;
  const presaleStart = baseData?.[4]?.result;
  const presaleEnd = baseData?.[5]?.result;
  const usdtToken = baseData?.[6]?.result;
  const purchased = address ? userData?.[0]?.result : undefined;
  const claimable = address ? userData?.[1]?.result : undefined;
  const isLoading = isBaseLoading || (Boolean(address) && isUserLoading);

  let status: PresaleStatus = "unknown";

  if (presaleStart !== undefined && presaleEnd !== undefined) {
    if (now < Number(presaleStart)) status = "upcoming";
    else if (now > Number(presaleEnd)) status = "ended";
    else status = "active";
  }

  const soldAmount = totalSold ? Number(formatUnits(totalSold, 18)) : 0;
  const capAmount = hardCap ? Number(formatUnits(hardCap, 18)) : 0;
  const progress = capAmount > 0 ? Math.min((soldAmount / capAmount) * 100, 100) : 0;

  return {
    web3Ready,
    isLoading,
    refetch,
    totalSold,
    hardCap,
    minPurchase,
    maxPurchase,
    presaleStart,
    presaleEnd,
    usdtToken,
    purchased,
    claimable,
    status,
    soldAmount,
    capAmount,
    progress,
    claimableAmount: claimable ? Number(formatUnits(claimable, 18)) : 0,
    purchasedAmount: purchased ? Number(formatUnits(purchased, 18)) : 0,
  };
}
