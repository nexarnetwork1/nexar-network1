"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  return (
    <>
      <GlobalBackground variant="login" />
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-[22rem] rounded-2xl border border-border/80 bg-card/55 p-5 text-center shadow-xl shadow-black/20 backdrop-blur-2xl sm:max-w-[24rem]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <ShieldCheck className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <h1 className="font-heading text-xl font-semibold text-gold">Admin access</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Super-admin access requires treasury wallet verification. Connect your authorized wallet
            to continue.
          </p>
          <div className="mt-5 space-y-3">
            <ConnectWalletButton className="w-full" size="lg" magnetic glow />
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
