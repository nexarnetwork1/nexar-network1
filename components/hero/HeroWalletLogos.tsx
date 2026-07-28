"use client";

import Image from "next/image";

const WALLETS = [
  { src: "/wallets/metamask.png", alt: "MetaMask" },
  { src: "/wallets/trustwallet.png", alt: "Trust Wallet" },
  { src: "/wallets/binancewallet.png", alt: "Binance Wallet" },
  { src: "/wallets/safepal.png", alt: "SafePal" },
  { src: "/wallets/tokenpocket.png", alt: "TokenPocket" },
] as const;

export function HeroWalletLogos() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Supported wallets</span>
      <div className="flex flex-wrap items-center gap-2.5">
        {WALLETS.map((wallet) => (
          <div
            key={wallet.alt}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/60 p-1.5 backdrop-blur-md transition hover:border-gold/30"
            title={wallet.alt}
          >
            <Image src={wallet.src} alt={wallet.alt} width={20} height={20} className="opacity-90" />
          </div>
        ))}
      </div>
    </div>
  );
}
