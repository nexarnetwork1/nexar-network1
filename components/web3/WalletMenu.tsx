"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useBalance, useChainId, useDisconnect, useReadContracts } from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Circle,
  Coins,
} from "lucide-react";
import { CONTRACTS } from "@/lib/constants/site";
import { ERC20_ABI, PRESALE_ABI } from "@/lib/web3/abi";
import { cn } from "@/lib/utils/cn";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { SuperAdminVerifyButton } from "./SuperAdminVerifyButton";
import { AddNxrToWalletButton } from "./AddNxrToWalletButton";
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

export function WalletMenu() {
  const { user, logout } = usePrivy();
  const { disconnect } = useDisconnect();
  const { address: wagmiAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [isTreasuryWallet, setIsTreasuryWallet] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const treasuryPromptRef = useRef<string | null>(null);

  const address = (wagmiAddress ?? user?.wallet?.address ?? "") as `0x${string}` | "";
  const walletType = user?.wallet?.walletClientType ?? "wallet";
  const meta = WALLET_META[walletType] ?? { label: "Connected Wallet", icon: "👛" };

  const shortAddress =
    address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

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
            { address: usdtToken, abi: ERC20_ABI, functionName: "decimals" as const, chainId: bsc.id },
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
      bnb: bnbBalance ? trimBalance(formatUnits(bnbBalance.value, 18)) : "—",
      nxr: nxrBalance !== undefined ? trimBalance(formatUnits(nxrBalance, 18)) : "—",
      usdt: usdtBalance !== undefined ? trimBalance(formatUnits(usdtBalance, usdtDecimals)) : "—",
    }),
    [bnbBalance, nxrBalance, usdtBalance, usdtDecimals],
  );

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success("Wallet address copied");
  }

  useEffect(() => {
    if (!address) return;

    fetch(`/api/admin/wallet/status?wallet=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data) => {
        const treasury = Boolean(data.isTreasuryWallet);
        const admin = Boolean(data.authenticated);
        setIsTreasuryWallet(treasury);
        setIsSuperAdmin(admin);

        if (treasury && !admin && treasuryPromptRef.current !== address) {
          treasuryPromptRef.current = address;
          toast.message("Treasury wallet connected", {
            description: "Open this menu and verify your signature for Super Admin access.",
            duration: 7000,
          });
        }
      })
      .catch(() => {
        setIsTreasuryWallet(false);
        setIsSuperAdmin(false);
      });

    fetch("/api/admin/wallet/connected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    }).catch(() => undefined);
  }, [address]);

  useEffect(() => {
    function handleSuperAdminUpdated() {
      if (!address) return;
      fetch(`/api/admin/wallet/status?wallet=${encodeURIComponent(address)}`)
        .then((res) => res.json())
        .then((data) => {
          setIsTreasuryWallet(Boolean(data.isTreasuryWallet));
          setIsSuperAdmin(Boolean(data.authenticated));
        })
        .catch(() => undefined);
    }

    window.addEventListener("nxr:super-admin-updated", handleSuperAdminUpdated);
    return () => window.removeEventListener("nxr:super-admin-updated", handleSuperAdminUpdated);
  }, [address]);

  async function disconnectWallet() {
    clearWalletSession();
    await fetch("/api/admin/wallet/logout", { method: "POST" }).catch(() => undefined);
    disconnect();
    await logout();
    setIsSuperAdmin(false);
    window.dispatchEvent(new CustomEvent("nxr:super-admin-updated"));
  }

  if (!address) return null;

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-gold/30",
          "bg-gradient-to-r from-[#121212]/90 to-[#1a1a1a]/90 px-5 py-2.5",
          "text-sm font-semibold text-white shadow-[0_0_25px_rgba(212,175,55,0.12)]",
          "backdrop-blur-xl transition-all duration-300 hover:border-gold",
          "hover:shadow-[0_0_35px_rgba(212,175,55,0.22)]",
        )}
      >
        <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
        <span>{shortAddress}</span>
        <ChevronDown size={16} className="transition-transform ui-open:rotate-180" />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className={cn(
          "absolute right-0 z-50 mt-3 w-[22rem] origin-top-right overflow-hidden rounded-3xl",
          "border border-gold/20 bg-[#0B0B0B]/80 p-0 shadow-[0_0_40px_rgba(212,175,55,0.15)]",
          "backdrop-blur-2xl focus:outline-none",
          "transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
          "data-[open]:scale-100 data-[open]:opacity-100",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 bg-gradient-to-br from-gold/5 to-transparent px-5 py-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-xl">
              {meta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-white">{meta.label}</p>
                {isConnected && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Connected
              </p>
              <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-gray-300">
                {address}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-2 px-4 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Network</p>
            <p className="mt-1 text-sm font-medium text-white">{networkLabel}</p>
            <p className="font-mono text-[10px] text-muted">Chain ID {chainId}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { code: "BNB", value: balances.bnb, accent: "text-amber-300" },
              { code: "NXR", value: balances.nxr, accent: "text-gold" },
              { code: "USDT", value: balances.usdt, accent: "text-emerald-400" },
            ].map((item) => (
              <div
                key={item.code}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <CurrencyLogo code={item.code} size={14} />
                  <p className="text-[10px] uppercase tracking-wide text-muted">{item.code}</p>
                </div>
                <p className={cn("mt-1 font-mono text-xs font-medium", item.accent)}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-0.5 px-2 pb-3">
          <MenuItem>
            <div className="px-2 py-1">
              <AddNxrToWalletButton
                size="sm"
                variant="secondary"
                className="w-full justify-center"
              />
            </div>
          </MenuItem>

          <MenuItem>
            <button
              type="button"
              onClick={copyAddress}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-gold/10 hover:text-gold active:scale-[0.98]"
            >
              <Copy size={18} />
              Copy address
            </button>
          </MenuItem>

          <MenuItem>
            <a
              href={`https://bscscan.com/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-gold/10 hover:text-gold active:scale-[0.98]"
            >
              <ExternalLink size={18} />
              View on BscScan
            </a>
          </MenuItem>

          {isTreasuryWallet && !isSuperAdmin && (
            <MenuItem>
              <SuperAdminVerifyButton
                walletAddress={address}
                onVerified={() => setIsSuperAdmin(true)}
              />
            </MenuItem>
          )}

          {isSuperAdmin && (
            <div className="mx-2 flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-xs text-gold">
              <Coins size={14} />
              Super Admin session active
            </div>
          )}

          <MenuItem>
            <button
              type="button"
              onClick={disconnectWallet}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 active:scale-[0.98]"
            >
              <LogOut size={18} />
              Disconnect
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
