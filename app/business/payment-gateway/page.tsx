"use client";

import { Container } from "@/components/ui/Container";
import { CreditCard, Zap, Shield, Globe, Clock, CheckCircle2, ArrowRight, Lock, BarChart3, Settings, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PaymentGatewayPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business" className="hover:text-gold">
            Business Hub
          </Link>
          <span>/</span>
          <span className="text-white">Payment Gateway</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Payment Gateway
          </h1>
          <p className="text-lg text-muted">
            Enterprise-grade payment processing for your business
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <Zap className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Settlement</h3>
            <p className="text-sm text-muted-foreground">
              Receive payments instantly with real-time blockchain confirmation
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <Shield className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Processing</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security with fraud detection and prevention
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <Globe className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Currency</h3>
            <p className="text-sm text-muted-foreground">
              Accept payments in NXR, USDT, USDC, BNB and other cryptocurrencies
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <Clock className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Live payment status updates with instant notifications
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <BarChart3 className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive analytics and reporting for all transactions
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <RefreshCw className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Auto-Conversion</h3>
            <p className="text-sm text-muted-foreground">
              Automatic currency conversion at competitive rates
            </p>
          </div>
        </div>

        {/* Supported Currencies */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Supported Currencies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'NXR', symbol: '₦' },
              { name: 'USDT', symbol: '₮' },
              { name: 'USDC', symbol: '$' },
              { name: 'BNB', symbol: 'B' },
              { name: 'ETH', symbol: 'Ξ' },
              { name: 'BTC', symbol: '₿' },
              { name: 'EUR', symbol: '€' },
              { name: 'GBP', symbol: '£' },
            ].map((currency) => (
              <div key={currency.name} className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/30">
                <div className="p-2 rounded-lg bg-gold/20">
                  <span className="text-gold font-bold">{currency.symbol}</span>
                </div>
                <span className="text-white font-medium">{currency.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Options */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Integration Options</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-lg font-semibold text-white mb-3">API Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integrate payment processing directly into your application with our REST API
              </p>
              <Link
                href="/docs/api"
                className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium"
              >
                <span>View API Documentation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-lg font-semibold text-white mb-3">No-Code Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use our hosted checkout pages without any development work
              </p>
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium"
              >
                <span>Learn About Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Fee Structure</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
              <div>
                <h4 className="text-white font-medium">Crypto Payments</h4>
                <p className="text-sm text-muted-foreground">NXR, USDT, USDC, BNB, ETH, BTC</p>
              </div>
              <span className="text-gold font-semibold">0.5%</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
              <div>
                <h4 className="text-white font-medium">Fiat Payments</h4>
                <p className="text-sm text-muted-foreground">EUR, GBP, USD</p>
              </div>
              <span className="text-gold font-semibold">1.5%</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
              <div>
                <h4 className="text-white font-medium">Invoice Processing</h4>
                <p className="text-sm text-muted-foreground">Automated invoice generation and tracking</p>
              </div>
              <span className="text-gold font-semibold">$0.10 per invoice</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
              <div>
                <h4 className="text-white font-medium">Webhook Notifications</h4>
                <p className="text-sm text-muted-foreground">Real-time payment notifications</p>
              </div>
              <span className="text-gold font-semibold">Free</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}