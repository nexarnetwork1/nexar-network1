"use client";

import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Store, Wallet } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";

const PAYMENT_CURRENCIES = ["NXR", "BNB", "USDT", "BTC", "ETH"] as const;

export function MarketplaceSection() {
  return (
    <section id="marketplace" className="section-padding relative scroll-mt-[var(--nxr-header-offset)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Marketplace"
              title="Decentralized commerce on Nexar"
              description="Merchants register, launch stores, and list products. Customers browse, checkout, and pay with NXR and supported cryptocurrencies — integrated into the Nexar payment ecosystem."
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {PAYMENT_CURRENCIES.map((code) => (
                <CurrencyLogo key={code} code={code} size={24} showLabel />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/marketplace">
                <Button size="lg" magnetic glow>
                  <ShoppingBag className="h-4 w-4" />
                  Explore Marketplace
                </Button>
              </Link>
              <Link href="/register/merchant">
                <Button size="lg" variant="outline" magnetic>
                  <Store className="h-4 w-4" />
                  Register as Merchant
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-md">
              <div className="space-y-5">
                {[
                  {
                    icon: Store,
                    title: "Merchant stores",
                    text: "Create a branded storefront, manage products, and accept crypto payments.",
                  },
                  {
                    icon: ShoppingBag,
                    title: "Shopping & checkout",
                    text: "Cart, multi-currency checkout, and order tracking for customers.",
                  },
                  {
                    icon: Wallet,
                    title: "NXR-native fees",
                    text: "0.35% on NXR payments · 0.50% on other supported currencies.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/50">
                      <item.icon className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/whitepaper#marketplace"
                className="mt-8 inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-secondary"
              >
                Read Marketplace details in the whitepaper
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
