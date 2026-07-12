"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { getAppKit } from "@/components/web3/AppKitInit";
import { CONTRACTS } from "@/lib/constants/site";
import { PRESALE_ABI, ERC20_ABI } from "@/lib/web3/abi";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { cn } from "@/lib/utils/cn";

type BuyNxrModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BuyNxrModal({ open, onClose }: BuyNxrModalProps) {
  if (!isWeb3Configured()) {
    return null;
  }

  return <BuyNxrModalInner open={open} onClose={onClose} />;
}

function BuyNxrModalInner({ open, onClose }: BuyNxrModalProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { status, minPurchase, maxPurchase, usdtToken, refetch } = usePresaleData();
  const presaleActive = status === "active";

  const [method, setMethod] = useState<"bnb" | "usdt">("bnb");
  const [bnbAmount, setBnbAmount] = useState("0.1");
  const [usdtAmount, setUsdtAmount] = useState("100");
  const [step, setStep] = useState<"idle" | "approve" | "buy">("idle");

  const usdtAmountWei = (() => {
    try {
      const val = usdtAmount.trim();
      if (!val || isNaN(Number(val)) || Number(val) <= 0) return BigInt(0);
      return parseUnits(val, 18);
    } catch {
      return BigInt(0);
    }
  })();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdtToken as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && usdtToken ? [address, CONTRACTS.presale as `0x${string}`] : undefined,
    chainId: 56,
    query: { enabled: Boolean(address && usdtToken && open) },
  });

  const hasAllowance = allowance !== undefined && allowance >= usdtAmountWei;

  useEffect(() => {
    if (!isSuccess) return;

    void refetch();
    void refetchAllowance();

    const frameId = requestAnimationFrame(() => {
      setStep("idle");
    });

    return () => cancelAnimationFrame(frameId);
  }, [isSuccess, refetch, refetchAllowance]);

  const ensureWallet = (): boolean => {
    reset();
    const appKit = getAppKit();
    if (!isConnected) {
      appKit?.open();
      return false;
    }
    if (chainId !== 56) {
      switchChain({ chainId: 56 });
      return false;
    }
    return true;
  };

  const handleBuyBnb = () => {
    if (!ensureWallet()) return;
    const trimmed = bnbAmount.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return;
    try {
      writeContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: "buyWithBnb",
        value: parseEther(trimmed),
        chainId: 56,
      });
    } catch {
      // parseEther failed — invalid input, silently ignore
    }
  };

  const handleUsdtFlow = () => {
    if (!ensureWallet() || !usdtToken) return;
    if (usdtAmountWei === BigInt(0)) return;

    if (hasAllowance) {
      setStep("buy");
      writeContract({
        address: CONTRACTS.presale as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: "buyWithUsdt",
        args: [usdtAmountWei],
        chainId: 56,
      });
      return;
    }

    setStep("approve");
    writeContract({
      address: usdtToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.presale as `0x${string}`, usdtAmountWei],
      chainId: 56,
    });
  };

  if (!isWeb3Configured()) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="luxury-border rounded-3xl bg-surface/95 p-8 backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold">Buy NXR</h3>
                <CloseButton onClick={onClose} size="sm" label="Close buy modal" />
              </div>

              {!presaleActive && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-xs text-amber-200/80">
                    Presale is {status === "upcoming" ? "not yet active" : status === "ended" ? "closed" : "unavailable"}.
                    Transactions may revert on-chain.
                  </p>
                </div>
              )}

              <div className="mb-6 flex gap-2 rounded-full border border-border bg-card/50 p-1">
                {(["bnb", "usdt"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex-1 rounded-full py-2 text-sm font-medium transition-all",
                      method === m ? "bg-gold text-background" : "text-muted hover:text-white",
                    )}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              {method === "bnb" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Balance</span>
                    <span className="font-mono">{address ? "~0.00 BNB" : "Connect wallet"}</span>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs tracking-wide text-muted uppercase">
                      BNB Amount
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={bnbAmount}
                      onChange={(e) => setBnbAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 font-mono text-white outline-none focus:border-gold/40"
                    />
                  </label>
                  <div className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Estimated NXR</span>
                      <span className="font-mono text-gold-secondary">
                        ~{(parseFloat(bnbAmount) * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted/70">
                      <span>Price</span>
                      <span>1 BNB ≈ 10,000 NXR</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBuyBnb}
                    disabled={isPending || isConfirming || !presaleActive}
                  >
                    {isPending || isConfirming ? "Confirming…" : presaleActive ? "Buy with BNB" : "Presale Closed"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Balance</span>
                    <span className="font-mono">{address ? "~0.00 USDT" : "Connect wallet"}</span>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs tracking-wide text-muted uppercase">
                      USDT Amount
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 font-mono text-white outline-none focus:border-gold/40"
                    />
                  </label>
                  <div className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Estimated NXR</span>
                      <span className="font-mono text-gold-secondary">
                        ~{(parseFloat(usdtAmount) * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted/70">
                      <span>Price</span>
                      <span>1 USDT ≈ 100 NXR</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUsdtFlow}
                    disabled={isPending || isConfirming || !presaleActive}
                  >
                    {isPending || isConfirming
                      ? step === "approve"
                        ? "Approving…"
                        : "Confirming…"
                      : hasAllowance
                        ? "Buy with USDT"
                        : "Approve & Buy USDT"}
                  </Button>
                  {hasAllowance && (
                    <p className="text-center text-[11px] text-emerald-400/80">
                      USDT allowance sufficient — one-step purchase enabled
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-1 text-center font-mono text-[11px] text-muted/70">
                {minPurchase && (
                  <p>Min purchase: {formatUnits(minPurchase, 18)} NXR</p>
                )}
                {maxPurchase && (
                  <p>Max purchase: {formatUnits(maxPurchase, 18)} NXR</p>
                )}
              </div>

              {isSuccess && (
                <p className="mt-4 text-center text-sm text-emerald-400">Purchase successful!</p>
              )}
              {error && (
                <p className="mt-4 text-center text-sm text-red-400">
                  {error.message.slice(0, 120)}
                </p>
              )}

              {address && (
                <p className="mt-4 text-center font-mono text-[10px] text-muted/50">
                  Connected: {address.slice(0, 8)}…{address.slice(-6)}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type BuyNxrButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  magnetic?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function BuyNxrButton({
  className,
  size = "lg",
  variant = "secondary",
  magnetic = true,
  children,
  disabled,
}: BuyNxrButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  if (!isWeb3Configured()) {
    return (
      <Button
        size={size}
        variant={variant}
        magnetic={magnetic}
        className={className}
        disabled
        title="Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
      >
        {children ?? "Buy NXR"}
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        magnetic={magnetic}
        className={className}
        onClick={() => setModalOpen(true)}
        disabled={disabled}
      >
        {children ?? "Buy NXR"}
      </Button>
      <BuyNxrModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
