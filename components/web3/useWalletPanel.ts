"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { CONTRACTS } from "@/lib/constants/site";
import { ERC20_ABI, PRESALE_ABI } from "@/lib/web3/abi";
import { clearWalletSession } from "@/lib/web3/wallet-session";

const WALLET_META: Record<string, { label: string; icon: string }> = {
  metamask: { label: "MetaMask", icon: "🦊" },
  coinbase_wallet: { label: "Coinbase Wallet", icon: "🔵" },
  trust_wallet: { label: "Trust Wallet", icon: "🛡️" },
  wallet_connect: { label: "WalletConnect", icon: "🔗" },
  detected_ethereum_wallets: { label: "Browser Wallet", icon: "🌐" },
};

function trimBalance(value: string, maxDecimals = 4): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

export function useWalletPanel() {
  const { user, logout } = usePrivy();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { address: wagmiAddress, isConnected } = useAccount();
  const chainId = useChainId();

  const address = (wagmiAddress ?? user?.wallet?.address ?? "") as
    | `0x${string}`
    | "";
  const walletType = user?.wallet?.walletClientType ?? "wallet";
  const meta = WALLET_META[walletType] ?? {
    label: "Connected Wallet",
    icon: "👛",
  };

  const shortAddress =
    address.length > 10
      ? `${address.slice(0, 6)}…${address.slice(-4)}`
      : address;

  const onBsc = chainId === bsc.id;
  const networkLabel = onBsc ? "BNB Smart Chain" : `Chain ${chainId}`;

  const { data: bnbBalance } = useBalance({
    address: address || undefined,
    chainId: bsc.id,
    query: { enabled: Boolean(address) },
  });

  const { data: tokenData } = useReadContracts({
    contracts: address
      ? [
          {
            address: CONTRACTS.presale as `0x${string}`,
            abi: PRESALE_ABI,
            functionName: "usdtToken" as const,
            chainId: bsc.id,
          },
          {
            address: CONTRACTS.token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf" as const,
            args: [address] as const,
            chainId: bsc.id,
          },
        ]
      : [],
    query: { enabled: Boolean(address) },
  });

  const usdtToken = tokenData?.[0]?.result as `0x${string}` | undefined;

  const { data: usdtData } = useReadContracts({
    contracts:
      address && usdtToken
        ? [
            {
              address: usdtToken,
              abi: ERC20_ABI,
              functionName: "decimals" as const,
              chainId: bsc.id,
            },
            {
              address: usdtToken,
              abi: ERC20_ABI,
              functionName: "balanceOf" as const,
              args: [address] as const,
              chainId: bsc.id,
            },
          ]
        : [],
    query: { enabled: Boolean(address && usdtToken) },
  });

  const usdtDecimals = (usdtData?.[0]?.result as number | undefined) ?? 18;
  const nxrBalance = tokenData?.[1]?.result as bigint | undefined;
  const usdtBalance = usdtData?.[1]?.result as bigint | undefined;

  const balances = useMemo(
    () => ({
      bnb: bnbBalance
        ? trimBalance(formatUnits(bnbBalance.value, 18))
        : "—",
      nxr:
        nxrBalance !== undefined
          ? trimBalance(formatUnits(nxrBalance, 18))
          : "—",
      usdt:
        usdtBalance !== undefined
          ? trimBalance(formatUnits(usdtBalance, usdtDecimals))
          : "—",
    }),
    [bnbBalance, nxrBalance, usdtBalance, usdtDecimals],
  );

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success("Wallet address copied");
  }

  function switchToBsc() {
    if (onBsc || isSwitchingChain) return;
    switchChain({ chainId: bsc.id });
  }

  async function disconnectWallet() {
    clearWalletSession();
    disconnect();
    await logout();
  }

  return {
    address,
    shortAddress,
    meta,
    isConnected,
    onBsc,
    networkLabel,
    chainId,
    balances,
    isSwitchingChain,
    copyAddress,
    switchToBsc,
    disconnectWallet,
  };
}

export type WalletPanelState = ReturnType<typeof useWalletPanel>;
