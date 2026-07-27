import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ArrowRight, CheckCircle2, Shield, Zap, Clock, Globe } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nexar Checkout - Professional Payment Experience",
  description: "Enterprise-grade checkout experience for businesses. Fast, secure, and transparent payment processing.",
};

export default function CheckoutPage() {
  return (
    <Container>
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-gold">Professional Payment Experience</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Future of <span className="text-gold">Checkout</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Provide your customers with a seamless, secure, and professional payment experience.
            Built for scale, designed for conversion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/business"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
            >
              <span>Learn More</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Nexar Checkout?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for conversion, designed for trust, optimized for performance.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Complete checkout in under 30 seconds with optimized performance and instant QR generation.",
            },
            {
              icon: Shield,
              title: "Bank-Grade Security",
              description: "Enterprise security with end-to-end encryption, fraud detection, and secure payment processing.",
            },
            {
              icon: Globe,
              title: "Multi-Currency",
              description: "Accept payments in NXR, USDT, USDC, BNB and more across multiple blockchain networks.",
            },
            {
              icon: Clock,
              title: "Real-Time Updates",
              description: "Live payment status updates with instant confirmation and transaction tracking.",
            },
            {
              icon: CheckCircle2,
              title: "Professional Receipts",
              description: "Automated receipt generation with invoice numbers, transaction details, and download options.",
            },
            {
              icon: ArrowRight,
              title: "Developer Friendly",
              description: "Easy integration with comprehensive APIs, webhooks, and developer documentation.",
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

      {/* Integration Section */}
      <section className="py-20 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Easy Integration</h3>
            <p className="text-muted-foreground mb-6">
              Integrate Nexar Checkout into your business in minutes with our developer-friendly APIs and SDKs.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Simple REST API",
                "Webhook notifications",
                "Custom branding options",
                "Multi-currency support",
                "Real-time status updates",
                "Comprehensive documentation",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm font-medium"
            >
              <span>View Developer Documentation</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Get Started Today</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of businesses already using Nexar Network for their payment infrastructure.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Free to get started",
                "No hidden fees",
                "24/7 support",
                "Enterprise-ready",
                "99.9% uptime",
                "Instant activation",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors text-sm font-medium"
            >
              <span>Explore Business Hub</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}