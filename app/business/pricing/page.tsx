"use client";

import { Container } from "@/components/ui/Container";
import { CheckCircle2, ArrowRight, Zap, Shield, Globe, Star, BarChart3, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function BusinessPricingPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business" className="hover:text-gold">
            Business Hub
          </Link>
          <span>/</span>
          <span className="text-white">Pricing</span>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            No hidden fees. No setup costs. Pay only for what you use.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Starter */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <p className="text-sm text-muted-foreground">For small businesses</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">Free</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Up to $10,000/month volume</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>0.5% transaction fee</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Email support</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>API access</span>
              </li>
            </ul>
            <Link
              href="/business/register"
              className="block w-full text-center py-3 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Professional */}
          <div className="luxury-border rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 p-8 backdrop-blur-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-black text-xs font-semibold">
              Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <p className="text-sm text-muted-foreground">For growing businesses</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Up to $100,000/month volume</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>1.0% transaction fee</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Webhook notifications</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Custom branding</span>
              </li>
            </ul>
            <Link
              href="/business/register"
              className="block w-full text-center py-3 rounded-lg bg-gold text-black hover:bg-gold/90 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <p className="text-sm text-muted-foreground">For large organizations</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Unlimited volume</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Custom transaction fees</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>SLA guarantee</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>On-premise deployment</span>
              </li>
            </ul>
            <Link
              href="mailto:admin@nexarnetwork.org"
              className="block w-full text-center py-3 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Transaction Fees */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Transaction Fees by Currency</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Save on fees by using NXR - our native token with the lowest transaction cost.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gold/30 rounded-xl p-6 bg-gold/10">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-gold" />
                <h3 className="text-white font-medium">NXR (Best Value)</h3>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Transaction Fee</span>
                <span className="text-gold font-bold text-lg">0.25%</span>
              </div>
              <p className="text-xs text-muted-foreground">Lowest fees with our native token</p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-3">Stablecoins</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">USDT/USDC</span>
                  <span className="text-gold font-medium">0.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DAI/BUSD</span>
                  <span className="text-gold font-medium">0.5%</span>
                </div>
              </div>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-3">Layer 1 Tokens</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BNB</span>
                  <span className="text-gold font-medium">0.75%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ETH</span>
                  <span className="text-gold font-medium">0.75%</span>
                </div>
              </div>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-3">Major Cryptocurrencies</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BTC</span>
                  <span className="text-gold font-medium">1.0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Other ERC-20</span>
                  <span className="text-gold font-medium">0.75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Included in All Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Zap className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Instant Settlement</h3>
                <p className="text-sm text-muted-foreground">
                  Receive payments instantly with real-time confirmation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Bank-Grade Security</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise security with fraud detection
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Globe className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Multi-Currency</h3>
                <p className="text-sm text-muted-foreground">
                  Accept payments in multiple currencies
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <BarChart3 className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and reporting
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Clock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Real-Time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Live payment status updates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Users className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">
                  Round-the-clock customer support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}