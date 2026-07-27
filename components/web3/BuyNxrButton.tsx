"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";

type BuyNxrButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  magnetic?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function BuyNxrButton({
  className,
  size = "lg",
  variant = "secondary",
  magnetic = true,
  glow = true,
  children,
  disabled,
}: BuyNxrButtonProps) {
  const router = useRouter();
  const { status, canClaim } = usePresaleData();

  const label =
    canClaim
      ? "Claim NXR"
      : status === "sold_out"
        ? "Sold Out"
        : status === "upcoming"
          ? "Presale Soon"
          : (children ?? "Buy NXR");

  return (
    <Button
      size={size}
      variant={variant}
      magnetic={magnetic}
      glow={glow}
      className={className}
      disabled={disabled}
      onClick={() => router.push("/presale")}
    >
      {label}
      <ArrowUpRight className="h-4 w-4" aria-hidden />
    </Button>
  );
}

export { ClaimNxrModal, ClaimNxrButton } from "@/components/web3/ClaimNxrButton";
