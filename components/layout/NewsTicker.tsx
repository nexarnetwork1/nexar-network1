"use client";

import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import type { TickerAnnouncement } from "@/types";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";

type NewsTickerProps = {
  announcements?: TickerAnnouncement[];
};

function PresaleTickerMessage() {
  const { status, isLoading } = usePresaleData();

  if (isLoading) {
    return <span className="text-gold font-semibold">NXR Presale — loading on-chain status…</span>;
  }

  if (status === "upcoming") {
    return (
      <Link href="/presale" className="text-amber-400 font-semibold hover:underline">
        NXR Presale opens soon — view countdown
      </Link>
    );
  }

  if (status === "live") {
    return (
      <Link href="/presale" className="text-gold font-semibold hover:underline">
        🚀 NXR Public Presale is live — buy on BSC
      </Link>
    );
  }

  if (status === "sold_out") {
    return (
      <Link href="/presale" className="text-red-400 font-semibold hover:underline">
        NXR Presale sold out
      </Link>
    );
  }

  if (status === "ended") {
    return (
      <Link href="/presale" className="font-semibold hover:underline">
        NXR Presale ended — claim your tokens
      </Link>
    );
  }

  return (
    <Link href="/presale" className="text-gold font-semibold hover:underline">
      NXR Presale
    </Link>
  );
}

export function NewsTicker({ announcements = [] }: NewsTickerProps) {
  return (
    <div className="fixed top-[var(--nxr-nav-height)] left-0 z-20 w-full border-y border-gold/20 bg-black/90 backdrop-blur-md">
      <Marquee
        speed={35}
        gradient={false}
        pauseOnHover={true}
        autoFill={true}
        className="py-2"
      >
        <div className="flex items-center gap-10 px-6">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/wallets/metamask.png" alt="MetaMask" width={20} height={20} />
            <span>MetaMask</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/wallets/trustwallet.png" alt="Trust Wallet" width={20} height={20} />
            <span>Trust Wallet</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/wallets/binancewallet.png" alt="Binance Wallet" width={20} height={20} />
            <span>Binance Wallet</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/wallets/safepal.png" alt="SafePal" width={20} height={20} />
            <span>SafePal</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/wallets/tokenpocket.png" alt="TokenPocket" width={20} height={20} />
            <span>TokenPocket</span>
          </div>

          <PresaleTickerMessage />

          <span className="whitespace-nowrap font-semibold text-gold">
            🎉 Launch Offer – Limited Time · 50% OFF for all new merchants during the first 3 months · Now $10 instead of $20 · Limited-time offer · Paid in supported cryptocurrencies only · Marketplace Coming Soon
          </span>

          {announcements.map((item) => (
            <span
              key={item.id}
              className={
                item.priority > 0 ? "whitespace-nowrap font-semibold text-gold" : "whitespace-nowrap"
              }
            >
              {item.message}
            </span>
          ))}

          <span>⚡ FAST</span>

          <span>🔒 SECURE</span>

          <span>🌍 BUILDING THE FUTURE OF GLOBAL PAYMENTS</span>
        </div>
      </Marquee>
    </div>
  );
}
