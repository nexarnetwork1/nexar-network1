"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Coins, Shield, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { CONTRACTS, SITE } from "@/lib/constants/site";
import { ERC20_ABI } from "@/lib/web3/abi";
import { isWeb3Configured } from "@/lib/web3/utils";
import { cn } from "@/lib/utils/cn";

type TokenInfoProps = {
  className?: string;
};

export function TokenInfo({ className }: TokenInfoProps) {
  const web3Ready = isWeb3Configured();

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.token as `0x${string}`,
    abi: [
      ...ERC20_ABI,
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "totalSupply",
    chainId: 56,
    query: { enabled: web3Ready, refetchInterval: 60_000 },
  });

  const supplyFormatted = totalSupply
    ? Number(formatUnits(totalSupply, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : SITE.maxSupply;

  const items = [
    { icon: Coins, label: "Total Supply", value: `${supplyFormatted} ${SITE.ticker}` },
    { icon: Shield, label: "Network", value: "BNB Smart Chain" },
    { icon: Ban, label: "Mint", value: SITE.mint },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("grid gap-3 sm:grid-cols-3", className)}
    >
      {items.map(({ icon: Icon, label, value }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -4 }}
          className="luxury-border rounded-xl bg-card/30 px-4 py-4 backdrop-blur-md"
        >
          <Icon className="mb-2 h-4 w-4 text-gold/70" />
          <p className="text-[10px] tracking-[0.15em] text-muted uppercase">{label}</p>
          <p className="mt-1 font-mono text-sm text-white">{value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
