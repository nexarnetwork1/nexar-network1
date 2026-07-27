"use client";

import { Container } from "@/components/ui/Container";
import { Link as LinkIcon, QrCode, Share2, Copy, CheckCircle2, ArrowRight, ExternalLink, BarChart3, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default function PaymentLinksPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business" className="hover:text-gold">
            Business Hub
          </Link>
          <span>/</span>
          <span className="text-white">Payment Links</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Payment Links
          </h1>
          <p className="text-lg text-muted">
            Create shareable payment links for quick and easy payments
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-gold/20 shrink-0">
              <Clock className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Payment Links Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Payment link functionality is currently under development. In the meantime, you can create 
                payment links using our invoice system.
              </p>
              <Link
                href="/dashboard/invoices"
                className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm font-medium"
              >
                <span>Create Invoice Instead</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <Share2 className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Share Anywhere</h3>
            <p className="text-sm text-muted-foreground">
              Share payment links via email, social media, or any messaging platform
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <QrCode className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">QR Codes</h3>
            <p className="text-sm text-muted-foreground">
              Generate QR codes for instant in-person payments
            </p>
          </div>

          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 mb-4">
              <BarChart3 className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Track Conversions</h3>
            <p className="text-sm text-muted-foreground">
              Monitor link performance and payment conversions
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12 opacity-60">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-semibold text-white">How Payment Links Will Work</h2>
            <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 mx-auto mb-4">
                <span className="text-gold font-bold">1</span>
              </div>
              <h3 className="text-white font-medium mb-2">Create Link</h3>
              <p className="text-sm text-muted-foreground">
                Set amount and currency
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 mx-auto mb-4">
                <span className="text-gold font-bold">2</span>
              </div>
              <h3 className="text-white font-medium mb-2">Share</h3>
              <p className="text-sm text-muted-foreground">
                Copy link or QR code
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 mx-auto mb-4">
                <span className="text-gold font-bold">3</span>
              </div>
              <h3 className="text-white font-medium mb-2">Customer Pays</h3>
              <p className="text-sm text-muted-foreground">
                Click and complete payment
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 mx-auto mb-4">
                <span className="text-gold font-bold">4</span>
              </div>
              <h3 className="text-white font-medium mb-2">Receive Funds</h3>
              <p className="text-sm text-muted-foreground">
                Instant settlement
              </p>
            </div>
          </div>
        </div>

        {/* Link Types */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12 opacity-60">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-semibold text-white">Link Types</h2>
            <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <FileText className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white">One-Time Payment</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Fixed amount for single transactions. Perfect for product sales or service payments.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Fixed amount</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Single use</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Expiry options</span>
                </li>
              </ul>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gold/20">
                  <ExternalLink className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white">Open Amount</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Let customers choose their payment amount. Ideal for donations or tips.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Customer sets amount</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Minimum amount</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>Recurring use</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl opacity-60">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-semibold text-white">Advanced Features</h2>
            <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Clock className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Expiry Control</h3>
                <p className="text-sm text-muted-foreground">
                  Set custom expiry times for payment links from 1 hour to 30 days
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Copy className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Custom Metadata</h3>
                <p className="text-sm text-muted-foreground">
                  Add custom fields to track payments and reconcile with your systems
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Webhook Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive instant notifications when payments are completed
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
                  Track link performance, conversion rates, and payment history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            <span>Create Payment Link</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Container>
  );
}