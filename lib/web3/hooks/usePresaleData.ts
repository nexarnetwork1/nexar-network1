"use client";

import { useMemo, useEffect, useState } from "react";
import { useAccount, useBlock, useReadContracts } from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits, parseUnits } from "viem";
import { CONTRACTS } from "@/lib/constants/site";
import { PRESALE_ABI, CHAINLINK_AGGREGATOR_ABI, ERC20_ABI } from "@/lib/web3/abi";
import { nxrFromBnb, nxrFromUsdt } from "@/lib/web3/presale-math";

export type PresaleStatus = "upcoming" | "live" | "sold_out" | "ended" | "loading" | "error";

const presaleAddress = CONTRACTS.presale as `0x${string}`;
const chainId = bsc.id;

const baseContracts = [
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "totalSold" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "HARD_CAP" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "MIN_PURCHASE" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "MAX_PURCHASE" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "presaleStart" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "presaleEnd" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "usdtToken" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "PRICE_NUMERATOR" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "PRICE_DENOMINATOR" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "bnbPriceFeed" as const, chainId },
  { address: presaleAddress, abi: PRESALE_ABI, functionName: "totalClaimed" as const, chainId },
] as const;

export function usePresaleData() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { data: block } = useBlock({
    chainId,
    watch: true,
    query: { retry: 2, staleTime: 30_000 },
  });
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [fallbackNow] = useState(() => Math.floor(Date.now() / 1000));

  const {
    data: baseData,
    isLoading: isBaseLoading,
    isError: isBaseError,
    refetch: refetchBase,
  } = useReadContracts({
    contracts: baseContracts,
    query: { refetchInterval: 15_000, retry: 2 },
  });

  useEffect(() => {
    if (!isBaseLoading && !isBaseError) return;
    const id = window.setTimeout(() => setLoadTimedOut(true), 10_000);
    return () => window.clearTimeout(id);
  }, [isBaseLoading, isBaseError]);

  const bnbPriceFeed = baseData?.[9]?.result as `0x${string}` | undefined;
  const usdtToken = baseData?.[6]?.result as `0x${string}` | undefined;

  const { data: bnbPriceData, refetch: refetchBnbPrice } = useReadContracts({
    contracts: bnbPriceFeed
      ? [
          {
            address: bnbPriceFeed,
            abi: CHAINLINK_AGGREGATOR_ABI,
            functionName: "latestRoundData" as const,
            chainId,
          },
        ]
      : [],
    query: { enabled: Boolean(bnbPriceFeed), refetchInterval: 60_000 },
  });

  const { data: usdtDecimalsData } = useReadContracts({
    contracts: usdtToken
      ? [{ address: usdtToken, abi: ERC20_ABI, functionName: "decimals" as const, chainId }]
      : [],
    query: { enabled: Boolean(usdtToken) },
  });

  const userContracts = useMemo(
    () =>
      address
        ? [
            {
              address: presaleAddress,
              abi: PRESALE_ABI,
              functionName: "purchased" as const,
              args: [address] as const,
              chainId,
            },
            {
              address: presaleAddress,
              abi: PRESALE_ABI,
              functionName: "claimableOf" as const,
              args: [address] as const,
              chainId,
            },
            {
              address: presaleAddress,
              abi: PRESALE_ABI,
              functionName: "claimed" as const,
              args: [address] as const,
              chainId,
            },
            ...(usdtToken
              ? [
                  {
                    address: usdtToken,
                    abi: ERC20_ABI,
                    functionName: "balanceOf" as const,
                    args: [address] as const,
                    chainId,
                  },
                ]
              : []),
          ]
        : [],
    [address, usdtToken]
  );

  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useReadContracts({
    contracts: userContracts,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const refetch = () => {
    void refetchBase();
    void refetchBnbPrice();
    void refetchUser();
  };

  const totalSold = baseData?.[0]?.result as bigint | undefined;
  const hardCap = baseData?.[1]?.result as bigint | undefined;
  const minPurchase = baseData?.[2]?.result as bigint | undefined;
  const maxPurchase = baseData?.[3]?.result as bigint | undefined;
  const presaleStart = baseData?.[4]?.result as bigint | undefined;
  const presaleEnd = baseData?.[5]?.result as bigint | undefined;
  const priceNumerator = baseData?.[7]?.result as bigint | undefined;
  const priceDenominator = baseData?.[8]?.result as bigint | undefined;
  const totalClaimed = baseData?.[10]?.result as bigint | undefined;

  const purchased = userData?.[0]?.result as bigint | undefined;
  const claimable = userData?.[1]?.result as bigint | undefined;
  const claimed = userData?.[2]?.result as bigint | undefined;
  const usdtBalance = userData?.[3]?.result as bigint | undefined;

  const bnbUsdPrice = bnbPriceData?.[0]?.result?.[1] as bigint | undefined;
  const usdtDecimals = (usdtDecimalsData?.[0]?.result as number | undefined) ?? 18;

  const blockTimestamp = block ? Number(block.timestamp) : null;
  const nowTimestamp = blockTimestamp ?? fallbackNow;

  let status: PresaleStatus = "loading";
  const hasBaseData =
    !isBaseLoading &&
    presaleStart !== undefined &&
    presaleEnd !== undefined &&
    totalSold !== undefined &&
    hardCap !== undefined;

  const timedOutWhileLoading = loadTimedOut && isBaseLoading;

  if (isBaseError || timedOutWhileLoading) {
    status = "error";
  } else if (hasBaseData) {
    const now = nowTimestamp;
    if (now < Number(presaleStart)) status = "upcoming";
    else if (now > Number(presaleEnd)) status = "ended";
    else if (totalSold >= hardCap) status = "sold_out";
    else status = "live";
  }

  const soldAmount = totalSold ? Number(formatUnits(totalSold, 18)) : 0;
  const capAmount = hardCap ? Number(formatUnits(hardCap, 18)) : 0;
  const remainingAmount = capAmount - soldAmount;
  const progress = capAmount > 0 ? Math.min((soldAmount / capAmount) * 100, 100) : 0;

  const countdownSeconds =
    status === "upcoming" && presaleStart
      ? Number(presaleStart) - nowTimestamp
      : status === "live" && presaleEnd
        ? Number(presaleEnd) - nowTimestamp
        : 0;

  const nxrPerUsdt =
    priceNumerator && priceDenominator
      ? Number(formatUnits(nxrFromUsdt(parseUnits("1", usdtDecimals), priceNumerator, priceDenominator), 18))
      : 0;

  const bnbPriceUsd = bnbUsdPrice ? Number(bnbUsdPrice) / 1e8 : 0;

  const nxrPerBnb =
    priceNumerator && priceDenominator && bnbUsdPrice
      ? Number(
          formatUnits(
            nxrFromBnb(parseUnits("1", 18), bnbUsdPrice, priceNumerator, priceDenominator),
            18
          )
        )
      : 0;

  return {
    presaleAddress,
    isConnected,
    isCorrectChain: walletChainId === chainId,
    isLoading: isBaseLoading || (Boolean(address) && isUserLoading),
    isError: isBaseError,
    refetch,
    status,
    totalSold,
    hardCap,
    minPurchase,
    maxPurchase,
    presaleStart,
    presaleEnd,
    usdtToken,
    usdtDecimals,
    priceNumerator,
    priceDenominator,
    bnbPriceFeed,
    bnbUsdPrice,
    bnbPriceUsd,
    totalClaimed,
    purchased,
    claimable,
    claimed,
    usdtBalance,
    soldAmount,
    capAmount,
    remainingAmount,
    progress,
    countdownSeconds,
    nxrPerUsdt,
    nxrPerBnb,
    claimableAmount: claimable ? Number(formatUnits(claimable, 18)) : 0,
    purchasedAmount: purchased ? Number(formatUnits(purchased, 18)) : 0,
    claimedAmount: claimed ? Number(formatUnits(claimed, 18)) : 0,
    canBuy: status === "live",
    canClaim: status === "ended",
    blockTimestamp,
    loadTimedOut: timedOutWhileLoading,
  };
}
