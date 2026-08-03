"use client";

import Marquee from "react-fast-marquee";
import { motion } from "framer-motion";
import { BadgeCheck, Globe2 } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { CommerceImage } from "@/components/commerce/home/shared/CommerceImage";
import type { CommerceMerchantNetworkItem } from "@/lib/commerce/types";

type MerchantNetworkProps = {
  merchants: CommerceMerchantNetworkItem[];
};

function MerchantTile({ merchant }: { merchant: CommerceMerchantNetworkItem }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      className="group mx-3 flex h-36 w-52 shrink-0 flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md transition-colors hover:border-gold/30 sm:w-56"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
          <CommerceImage
            src={merchant.logo_url}
            alt={merchant.name}
            className="h-full w-full"
            fallback={merchant.name.slice(0, 2)}
          />
          {merchant.is_verified ? (
            <BadgeCheck className="absolute -right-1 -bottom-1 h-4 w-4 text-gold" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white group-hover:text-gold">{merchant.name}</p>
          {merchant.category ? (
            <p className="mt-0.5 truncate text-[11px] capitalize text-muted">{merchant.category}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] tracking-wide text-muted uppercase">
        <span className="inline-flex items-center gap-1">
          <Globe2 className="h-3 w-3" />
          {merchant.country_code ?? "Global"}
        </span>
        <span className="text-emerald-400">Verified</span>
      </div>
    </motion.div>
  );
}

export function MerchantNetwork({ merchants }: MerchantNetworkProps) {
  if (!merchants.length) {
    return (
      <SectionShell
        eyebrow="Merchants"
        title="Trusted merchant network"
        description="Approved merchants appear here automatically when verified by the Nexar Commerce team."
      >
        <p className="text-sm text-muted">No verified merchants yet. Approved stores will appear here.</p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      eyebrow="Merchants"
      title="Trusted merchant network"
      description="Live approved merchants from the Nexar Commerce verification pipeline — logos, categories, and regions update automatically."
      className="overflow-hidden"
    >
      <Marquee gradient={false} speed={32} pauseOnHover>
        {merchants.map((merchant) => (
          <MerchantTile key={merchant.id} merchant={merchant} />
        ))}
      </Marquee>
    </SectionShell>
  );
}
