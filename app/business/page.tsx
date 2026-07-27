import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ArrowRight, Shield, Zap, Globe, Lock, CheckCircle2, ChevronRight, LogIn } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Business Hub - Nexar Network",
  description: "Enterprise-grade payment infrastructure for the digital economy. Fast, secure, and transparent payment solutions.",
};

export default function BusinessHubPage() {
  return (
    <Container>
      <div className="max-w-6xl mx-auto py-20 min-h-screen">
          {/* Features Grid */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Process payments in milliseconds with our optimized infrastructure and blockchain integration.",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description: "Bank-grade security with end-to-end encryption, fraud detection, and compliance-ready architecture.",
                },
                {
                  icon: Globe,
                  title: "Global Reach",
                  description: "Accept payments in multiple currencies across multiple blockchain networks worldwide.",
                },
                {
                  icon: Lock,
                  title: "Regulatory Ready",
                  description: "Built-in compliance features for KYC, AML, and regional payment regulations.",
                },
                {
                  icon: CheckCircle2,
                  title: "99.9% Uptime",
                  description: "Infrastructure designed for high availability with redundant systems and automatic failover.",
                },
                {
                  icon: ArrowRight,
                  title: "Easy Integration",
                  description: "Simple payment gateway integration with checkout links, invoices, and API access.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/50 bg-background/50 p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 mb-4">
                    <feature.icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Product Sections */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Merchant Platform */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Zap className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Merchant Platform</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Complete payment infrastructure for merchants of all sizes. From startups to enterprise.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Payment Gateway Integration",
                    "Smart Checkout Experience",
                    "Invoice & Billing System",
                    "Payment Links & Buttons",
                    "Real-time Analytics",
                    "Multi-currency Support",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-white">
                      <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/business/merchant-dashboard"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm font-medium"
                >
                  <span>Explore Merchant Platform</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Payment Solutions */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Globe className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Payment Solutions</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Flexible payment options to suit your business needs and customer preferences.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Instant Crypto Payments",
                    "Payment Links Generation",
                    "Invoice Management",
                    "Subscription Billing",
                    "Multi-wallet Support",
                    "Automatic Settlement",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-white">
                      <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/business/pricing"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm font-medium"
                >
                  <span>View Pricing</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Payments?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using Nexar Network for their payment infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/business/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                <span>Start Accepting Payments</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/business/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
              >
                <LogIn className="h-4 w-4" />
                <span>Business Login</span>
              </Link>
            </div>
          </section>
        </div>
    </Container>
  );
}