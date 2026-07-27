"use client";

import Image from "next/image";
import Marquee from "react-fast-marquee";
import type { TickerAnnouncement } from "@/types";

type NewsTickerProps = {
  announcements?: TickerAnnouncement[];
};

export function NewsTicker({ announcements = [] }: NewsTickerProps) {
  return (
    <div className="fixed top-[72px] left-0 z-20 w-full border-y border-gold/20 bg-black/90 backdrop-blur-md">
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

          <span className="text-gold font-semibold">
            🚀 JOIN OUR PUBLIC PRESALE NOW
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
