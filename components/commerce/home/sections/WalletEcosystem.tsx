"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Link2 } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

const WALLETS = [
  { name: "MetaMask", logo: "/wallets/metamask.png", network: "BNB Smart Chain" },
  { name: "Trust Wallet", logo: "/wallets/trustwallet.png", network: "BNB Smart Chain" },
  { name: "Binance Wallet", logo: "/wallets/binancewallet.png", network: "BNB Smart Chain" },
  { name: "WalletConnect", logo: "/wallets/tokenpocket.png", network: "Multi-wallet" },
];

export function WalletEcosystem() {
  const web3Ready = isWeb3Configured();

  return (
    <SectionShell
      eyebrow="Wallets"
      title="Wallet ecosystem"
      description="Connect with industry-standard wallets on BNB Smart Chain for checkout, merchant payouts, and NXR ecosystem payments."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {WALLETS.map((wallet, i) => (
          <motion.div
            key={wallet.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="nxr-card p-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wallet.logo}
                alt=""
                width={44}
                height={44}
                loading="lazy"
                className="h-11 w-11 rounded-xl object-contain"
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{wallet.name}</p>
                <p className="text-[11px] text-muted">{wallet.network}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              {web3Ready ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-success">Supported</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5 text-muted" />
                  <span className="text-muted">Configure Web3 to connect</span>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
