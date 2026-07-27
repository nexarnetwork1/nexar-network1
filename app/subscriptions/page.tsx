"use client";

import { Container } from "@/components/ui/Container";
import { RefreshCw, Clock } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-20">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mx-auto mb-6">
            <RefreshCw className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Subscriptions Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're building a powerful subscription and recurring payment system to help you manage 
            recurring billing for your customers. Stay tuned for automated subscription management.
          </p>
          
          <div className="bg-card/50 border border-border/50 rounded-xl p-8 max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-semibold text-white">Planned Features</h3>
            </div>
            <ul className="space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Automated recurring billing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Flexible billing cycles (daily, weekly, monthly, yearly)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Automatic payment retries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Subscription analytics and reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Customer self-service portal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Webhook notifications for subscription events</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            In the meantime, use our <a href="/dashboard/invoices" className="text-gold hover:underline">invoice system</a> for one-time payments.
          </p>
        </div>
      </div>
    </Container>
  );
}
