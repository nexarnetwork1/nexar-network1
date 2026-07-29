"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

type ShareProductButtonProps = {
  productId: string;
  productName: string;
  productBasePath?: string;
  className?: string;
};

export function ShareProductButton({
  productId,
  productName,
  productBasePath = "/marketplace/products",
  className,
}: ShareProductButtonProps) {
  async function shareProduct() {
    const url = `${window.location.origin}${productBasePath}/${productId}`;

    if (navigator.share) {
      await navigator.share({ title: productName, url }).catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <button
      type="button"
      onClick={() => void shareProduct()}
      className={
        className ??
        "flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted transition hover:text-white"
      }
      aria-label="Share product"
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
