"use client";

import { Container } from "@/components/ui/Container";
import { CheckCircle2, ArrowRight, Zap, Code, Terminal, Play, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function QuickStartPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business/documentation" className="hover:text-gold">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-white">Quick Start</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Quick Start Guide
          </h1>
          <p className="text-lg text-muted">
            Get started with Nexar Network in under 5 minutes
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {/* Step 1 */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                <span className="text-gold font-bold">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Create a Merchant Account</h2>
                <p className="text-muted-foreground mb-4">
                  Sign up for a merchant account to get your API credentials
                </p>
                <Link
                  href="/business/register"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium"
                >
                  <span>Register Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                <span className="text-gold font-bold">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Get Your API Key</h2>
                <p className="text-muted-foreground mb-4">
                  Navigate to your API Keys section and generate your API credentials
                </p>
                <Link
                  href="/merchant/api-keys"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium"
                >
                  <span>Get API Keys</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                <span className="text-gold font-bold">3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Install the SDK</h2>
                <p className="text-muted-foreground mb-4">
                  Install the Nexar Network SDK for your preferred programming language
                </p>
                <div className="space-y-3">
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <span className="text-muted">npm install @nexar/network</span>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <span className="text-muted">pip install nexar-network</span>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <span className="text-muted">composer require nexar/network</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                <span className="text-gold font-bold">4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Create Your First Invoice</h2>
                <p className="text-muted-foreground mb-4">
                  Use the API to create your first payment invoice
                </p>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
                  <pre className="text-muted">
{`const nexar = new Nexar({ apiKey: 'your_api_key' });

const invoice = await nexar.invoices.create({
  amount: 100.00,
  currency: 'USD',
  description: 'First payment',
});

console.log(invoice.payment_url);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="luxury-border rounded-2xl bg-card/40 p-8 backdrop-blur-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                <span className="text-gold font-bold">5</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Test in Sandbox</h2>
                <p className="text-muted-foreground mb-4">
                  Test your integration in sandbox mode before going live
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span>No real transactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span>Instant payment simulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span>Full API functionality</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Complete Example</h2>
          <div className="bg-black/50 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-muted">
{`import { Nexar } from '@nexar/network';

// Initialize the client
const nexar = new Nexar({
  apiKey: 'your_api_key',
  environment: 'sandbox',
});

// Create an invoice
const invoice = await nexar.invoices.create({
  amount: 100.00,
  currency: 'USD',
  description: 'Product purchase',
  customer_email: 'customer@example.com',
});

// Get the payment URL
console.log('Payment URL:', invoice.payment_url);

// Check payment status
const status = await nexar.invoices.getStatus(invoice.id);
console.log('Status:', status.status);`}
            </pre>
            </div>
        </div>

        {/* Next Steps */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/api"
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <BookOpen className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">API Documentation</h3>
                <p className="text-sm text-muted-foreground">Complete API reference</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </Link>

            <Link
              href="/docs/developer"
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Terminal className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Developer Guide</h3>
                <p className="text-sm text-muted-foreground">Best practices</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </Link>

            <Link
              href="/business/sdks"
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Code className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">SDK Reference</h3>
                <p className="text-sm text-muted-foreground">Language-specific guides</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </Link>

            <Link
              href="/business/documentation"
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:border-gold/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-gold/20">
                <Play className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Tutorials</h3>
                <p className="text-sm text-muted-foreground">Step-by-step guides</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}