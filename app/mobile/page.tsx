"use client";

import { Container } from "@/components/ui/Container";
import { Smartphone, Clock } from "lucide-react";

export default function MobilePage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-20">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mx-auto mb-6">
            <Smartphone className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Mobile App Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're building native iOS and Android applications to help you manage payments on the go. 
            Stay tuned for an enhanced mobile experience.
          </p>
          
          <div className="bg-card/50 border border-border/50 rounded-xl p-8 max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-semibold text-white">Planned Features</h3>
            </div>
            <ul className="space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Real-time payment notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>On-the-go invoice management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Quick payment acceptance via QR codes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Multi-wallet management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Advanced analytics dashboard</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            In the meantime, use our web platform at <a href="/business" className="text-gold hover:underline">Business Hub</a> for full functionality.
          </p>
        </div>
      </div>
    </Container>
  );
}
