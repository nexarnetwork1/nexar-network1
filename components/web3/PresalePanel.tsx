"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { formatUnits } from "viem";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";
import { CONTRACTS } from "@/lib/constants/site";
import { PRESALE_ABI, ERC20_ABI } from "@/lib/web3/abi";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { usePresaleWalletBalances } from "@/lib/web3/hooks/usePresaleWalletBalances";
import { validatePurchase, parseUsdtAmount, parseNxrAmount } from "@/lib/web3/presale-math";
import {
  getPresaleDisplayMetrics,
  nxrFromUsdtDisplay,
  usdtFromNxrDisplay,
} from "@/lib/web3/presale-display";
import { PresaleCountdown } from "@/components/web3/PresaleCountdown";
import { PresalePanelSkeleton } from "@/components/web3/PresalePanelSkeleton";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { cn } from "@/lib/utils/cn";
import { notifyPresaleRefresh } from "@/lib/web3/presale-refresh";

type PresalePanelProps = {
  compact?: boolean;
  className?: string;
};

export function PresalePanel({ compact, className }: PresalePanelProps) {
  const presale = usePresaleData();
  const display = getPresaleDisplayMetrics(presale.soldAmount);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { login } = usePrivy();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { usdtBalanceFormatted, refetchBalances } = usePresaleWalletBalances(
    address,
    presale.usdtBalance,
    presale.usdtDecimals
  );

  const [nxrInput, setNxrInput] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const editingField = useRef<"nxr" | "usdt" | null>(null);
  const [step, setStep] = useState<"idle" | "approve" | "buy" | "claim">("idle");
  const [, startRefresh] = useTransition();

  function syncFromNxr(value: string) {
    setNxrInput(value);
    const nxr = Number(value);
    if (!value.trim() || Number.isNaN(nxr) || nxr <= 0) {
      if (editingField.current === "nxr") setUsdtAmount("");
      return;
    }
    const usdt = usdtFromNxrDisplay(nxr);
    setUsdtAmount(usdt.toFixed(Math.min(presale.usdtDecimals, 6)));
  }

  function syncFromUsdt(value: string) {
    setUsdtAmount(value);
    const usdt = Number(value);
    if (!value.trim() || Number.isNaN(usdt) || usdt <= 0) {
      if (editingField.current === "usdt") setNxrInput("");
      return;
    }
    setNxrInput(String(nxrFromUsdtDisplay(usdt)));
  }

  useEffect(() => {
    if (presale.status !== "loading" && presale.status !== "error") return;
    const id = window.setInterval(() => {
      presale.refetch();
    }, presale.status === "error" ? 8_000 : 5_000);
    return () => window.clearInterval(id);
  }, [presale.status, presale.refetch]);

  const usdtAmountWei = parseUsdtAmount(usdtAmount, presale.usdtDecimals);
  const estimatedNxr = parseNxrAmount(nxrInput);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: presale.usdtToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && presale.usdtToken ? [address, CONTRACTS.presale as `0x${string}`] : undefined,
    chainId: bsc.id,
    query: { enabled: Boolean(address && presale.usdtToken) },
  });

  const hasAllowance =
    allowance !== undefined && usdtAmountWei > BigInt(0) && allowance >= usdtAmountWei;

  useEffect(() => {
    if (!isSuccess) return;

    if (step === "approve") {
      void refetchAllowance().then(() => {
        reset();
        writeContract({
          address: CONTRACTS.presale as `0x${string}`,
          abi: PRESALE_ABI,
          functionName: "buyWithUsdt",
          args: [usdtAmountWei],
          chainId: bsc.id,
        });
        setStep("buy");
      });
      return;
    }

    startRefresh(() => {
      presale.refetch();
      refetchAllowance();
      refetchBalances();
      notifyPresaleRefresh();
      setStep("idle");
    });
  }, [isSuccess, step, presale, refetchAllowance, refetchBalances, reset, usdtAmountWei, writeContract]);

  const validation = validatePurchase({
    nxrAmount: estimatedNxr,
    minPurchase: presale.minPurchase ?? BigInt(0),
    maxPurchase: presale.maxPurchase ?? BigInt(0),
    purchased: presale.purchased ?? BigInt(0),
    totalSold: presale.totalSold ?? BigInt(0),
    hardCap: presale.hardCap ?? BigInt(0),
    isLive: presale.canBuy,
    isConnected,
    isCorrectChain: chainId === bsc.id,
  });

  function ensureWallet(): boolean {
    reset();
    if (!isConnected) {
      login();
      return false;
    }
    if (chainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      return false;
    }
    return true;
  }

  function handleUsdtFlow() {
    if (!ensureWallet() || !presale.usdtToken || !validation.valid) return;
    if (hasAllowance) {
      setStep("buy");
      writeContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: "buyWithUsdt",
        args: [usdtAmountWei],
        chainId: bsc.id,
      });
      return;
    }
    setStep("approve");
    writeContract({
      address: presale.usdtToken,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.presale as `0x${string}`, usdtAmountWei],
      chainId: bsc.id,
    });
  }

  function handleClaim() {
    if (!ensureWallet()) return;
    if ((presale.claimable ?? BigInt(0)) <= BigInt(0)) return;
    setStep("claim");
    writeContract({
      address: CONTRACTS.presale as `0x${string}`,
      abi: PRESALE_ABI,
      functionName: "claim",
      chainId: bsc.id,
    });
  }

  const statusLabel = {
    upcoming: "Upcoming",
    live: "Live",
    sold_out: "Sold Out",
    ended: "Presale Finished",
    loading: "Loading…",
    error: "Connection Error",
  }[presale.status];

  const statusMessage = {
    upcoming: "Presale Not Started",
    live: null,
    sold_out: "Hard cap reached — no more purchases",
    ended: "Presale has ended — claim your tokens below",
    loading: "Reading contract data…",
    error: presale.loadTimedOut
      ? "Blockchain RPC timeout — check your connection and retry"
      : "Unable to read presale contract",
  }[presale.status];

  const allClaimed =
    presale.purchasedAmount > 0 &&
    presale.claimableAmount <= 0 &&
    presale.claimedAmount >= presale.purchasedAmount;

  if (presale.status === "loading") {
    return <PresalePanelSkeleton />;
  }

  return (
    <div className={cn("luxury-border rounded-3xl bg-card/40 p-6 backdrop-blur-md", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">NXR Presale</h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            presale.status === "live" && "bg-emerald-500/15 text-emerald-400",
            presale.status === "upcoming" && "bg-amber-500/15 text-amber-400",
            presale.status === "sold_out" && "bg-red-500/15 text-red-400",
            presale.status === "ended" && "bg-muted/20 text-muted",
            presale.status === "error" && "bg-muted/20 text-muted"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted">
          <span>{presale.soldAmount.toLocaleString()} NXR sold</span>
          <span>{display.remainingAmount.toLocaleString()} remaining</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-secondary transition-all duration-700"
            style={{ width: `${display.progress}%` }}
            role="progressbar"
            aria-valuenow={display.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted">
          {display.progress.toFixed(1)}% of {display.capAmount.toLocaleString()} NXR hard cap
        </p>
      </div>

      {!compact && (
        <dl className="mb-4 grid grid-cols-1 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <CurrencyLogo code="USDT" size={14} />
              USDT price
            </dt>
            <dd className="mt-1 font-mono text-white">100 NXR = 1 USDT</dd>
          </div>
        </dl>
      )}

      {(presale.status === "upcoming" || presale.status === "live") && presale.countdownSeconds > 0 && (
        <PresaleCountdown
          seconds={presale.countdownSeconds}
          label={presale.status === "upcoming" ? "Starts in" : "Ends in"}
        />
      )}

      {statusMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <div className="flex-1">
            <p className="text-sm text-amber-200/90">{statusMessage}</p>
            {presale.status === "error" && (
              <button
                type="button"
                onClick={() => presale.refetch()}
                className="mt-2 text-xs font-medium text-gold hover:underline"
              >
                Retry connection
              </button>
            )}
          </div>
        </div>
      )}

      {isConnected && presale.purchasedAmount > 0 && (
        <dl className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <dt className="text-muted">Purchased</dt>
            <dd className="mt-1 font-mono font-medium">{presale.purchasedAmount.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <dt className="text-muted">Claimable</dt>
            <dd className="mt-1 font-mono font-medium text-emerald-400">
              {presale.claimableAmount.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <dt className="text-muted">Claimed</dt>
            <dd className="mt-1 font-mono font-medium">{presale.claimedAmount.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      {presale.canBuy && (
        <>
          <div className="mb-4 space-y-3 rounded-2xl border border-border/80 bg-background/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">USDT calculator</p>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <CurrencyLogo code="NXR" size={14} />
                NXR amount
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={nxrInput}
                onChange={(e) => {
                  editingField.current = "nxr";
                  syncFromNxr(e.target.value);
                }}
                placeholder="0.0"
                className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 font-mono outline-none focus:border-gold/40"
                aria-label="NXR amount to purchase"
              />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <CurrencyLogo code="USDT" size={14} />
                USDT to pay
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={usdtAmount}
                onChange={(e) => {
                  editingField.current = "usdt";
                  syncFromUsdt(e.target.value);
                }}
                placeholder="0.0"
                className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 font-mono outline-none focus:border-gold/40"
                aria-label="USDT amount"
              />
            </label>
            <p className="text-[11px] text-muted">Rate: 100 NXR = 1 USDT · Pay with USDT only</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CurrencyLogo code="USDT" size={14} />
                USDT Balance
              </span>
              <span className="font-mono">{isConnected ? `${usdtBalanceFormatted} USDT` : "—"}</span>
            </div>

            {estimatedNxr > BigInt(0) && (
              <p className="text-xs text-muted">
                You receive:{" "}
                <span className="font-mono text-gold">{formatUnits(estimatedNxr, 18)} NXR</span>
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              glow
              onClick={handleUsdtFlow}
              disabled={isPending || isConfirming || !validation.valid}
            >
              {isPending || isConfirming
                ? step === "approve"
                  ? "Approving…"
                  : "Confirming…"
                : hasAllowance
                  ? "Buy With USDT"
                  : "Approve & Buy USDT"}
            </Button>
          </div>

          {!validation.valid && validation.error && isConnected && (
            <p className="mt-2 text-center text-xs text-red-400">{validation.error}</p>
          )}

          {presale.minPurchase && presale.maxPurchase && (
            <p className="mt-3 text-center font-mono text-[11px] text-muted">
              Min {formatUnits(presale.minPurchase, 18)} NXR · Max {formatUnits(presale.maxPurchase, 18)} NXR per wallet
            </p>
          )}
        </>
      )}

      {presale.canClaim && isConnected && presale.purchasedAmount > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="font-heading text-lg font-semibold">Claim Tokens</h3>
          {allClaimed ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              All purchased NXR tokens have been successfully claimed.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Claimable:{" "}
                <span className="font-mono text-emerald-400">
                  {presale.claimableAmount.toLocaleString()} NXR
                </span>
              </p>
              <Button
                className="mt-4 w-full"
                size="lg"
                glow
                onClick={handleClaim}
                disabled={isPending || isConfirming || presale.claimableAmount <= 0}
              >
                {presale.claimableAmount <= 0
                  ? "No Tokens Available To Claim"
                  : isPending || isConfirming
                    ? "Confirming…"
                    : "Claim Tokens"}
              </Button>
            </>
          )}
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {step === "claim" ? "Claim successful!" : "Purchase successful!"}
          {txHash && (
            <a
              href={`https://bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
      {error && (
        <p className="mt-4 text-center text-sm text-red-400" role="alert">
          {error.message.includes("User rejected")
            ? "Transaction rejected"
            : error.message.slice(0, 160)}
        </p>
      )}
    </div>
  );
}
