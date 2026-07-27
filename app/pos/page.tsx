"use client";

import { Container } from "@/components/ui/Container";
import { Monitor, Clock } from "lucide-react";

export default function POSPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-20">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mx-auto mb-6">
            <Monitor className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Point of Sale Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're building a comprehensive Point of Sale system for in-person payments. 
            Accept crypto payments at physical locations with ease.
          </p>
          
          <div className="bg-card/50 border border-border/50 rounded-xl p-8 max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-semibold text-white">Planned Features</h3>
            </div>
            <ul className="space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>QR code payment acceptance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Hardware terminal integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Real-time transaction processing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Inventory management integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Receipt generation and printing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Staff management and permissions</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            In the meantime, use our <a href="/business/payment-links" className="text-gold hover:underline">Payment Links</a> for simple payment collection.
          </p>
        </div>
      </div>
    </Container>
  );
}
