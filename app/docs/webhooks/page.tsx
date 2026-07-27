"use client";

import { Container } from "@/components/ui/Container";
import { Webhook, Zap, CheckCircle2, ArrowRight, Code, Shield, Clock, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function WebhooksPage() {
  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/business/documentation" className="hover:text-gold">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-white">Webhooks</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl mb-4">
            Webhooks
          </h1>
          <p className="text-lg text-muted">
            Real-time notifications for payment events and status updates
          </p>
        </div>

        {/* What are Webhooks */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">What are Webhooks?</h2>
          <p className="text-muted-foreground mb-6">
            Webhooks allow you to receive real-time notifications when payment events occur. 
            Instead of polling the API for status updates, Nexar Network will send HTTP POST 
            requests to your specified endpoint with event data.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Zap className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Real-Time</h3>
                <p className="text-sm text-muted-foreground">
                  Instant notifications as events happen
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Signature verification for authenticity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gold/20 shrink-0">
                <RefreshCw className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic retry on failure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Events */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Supported Events</h2>
          <div className="space-y-4">
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-white font-medium">payment.completed</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent when a payment is successfully completed
              </p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <h3 className="text-white font-medium">payment.pending</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent when a payment is initiated but not yet confirmed
              </p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-red-400" />
                <h3 className="text-white font-medium">payment.expired</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent when a payment session expires without completion
              </p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <h3 className="text-white font-medium">invoice.created</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent when a new invoice is created
              </p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="h-5 w-5 text-purple-400" />
                <h3 className="text-white font-medium">invoice.updated</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent when an invoice status changes
              </p>
            </div>
          </div>
        </div>

        {/* Webhook Payload */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Webhook Payload</h2>
          <div className="bg-black/50 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-muted">
{`{
  "event": "payment.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "payment_id": "pay_1234567890",
    "invoice_id": "inv_1234567890",
    "amount": 100.00,
    "currency": "USD",
    "status": "completed",
    "transaction_hash": "0x...",
    "customer_email": "customer@example.com"
  }
}`}
            </pre>
            </div>
        </div>

        {/* Signature Verification */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Signature Verification</h2>
          <p className="text-muted-foreground mb-6">
            Each webhook includes a signature in the <code className="text-gold">X-Nexar-Signature</code> header. 
            Verify this signature to ensure the webhook is authentic.
          </p>
          <div className="bg-black/50 rounded-lg p-6 font-mono text-sm overflow-x-auto mb-6">
            <pre className="text-muted">
{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}
            </pre>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              <span>Use your webhook secret key for verification</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              <span>Compare signatures using constant-time comparison</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              <span>Reject webhooks with invalid signatures</span>
            </li>
          </ul>
        </div>

        {/* Retry Policy */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Retry Policy</h2>
          <p className="text-muted-foreground mb-6">
            If your webhook endpoint returns a non-2xx status code or times out, we will automatically retry the delivery.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-2">Total Retries</h3>
              <p className="text-2xl font-bold text-gold">5</p>
              <p className="text-sm text-muted-foreground">Maximum attempts</p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-2">Initial Delay</h3>
              <p className="text-2xl font-bold text-gold">1s</p>
              <p className="text-sm text-muted-foreground">First retry delay</p>
            </div>

            <div className="border border-border/50 rounded-xl p-6 bg-card/30">
              <h3 className="text-white font-medium mb-2">Max Delay</h3>
              <p className="text-2xl font-bold text-gold">1h</p>
              <p className="text-sm text-muted-foreground">Maximum delay</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}