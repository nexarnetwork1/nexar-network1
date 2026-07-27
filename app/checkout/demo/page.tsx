import { Container } from "@/components/ui/Container";
import { ShoppingBag, Clock } from "lucide-react";

export default function CheckoutDemoPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-20">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Checkout Demo Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're building an interactive checkout demo to help you experience our payment flow 
            before integrating. Stay tuned for a hands-on demonstration.
          </p>
          
          <div className="bg-card/50 border border-border/50 rounded-xl p-8 max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-semibold text-white">Demo Features</h3>
            </div>
            <ul className="space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Interactive payment flow simulation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Multi-currency checkout experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>QR code payment demonstration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-1">•</span>
                <span>Real-time status updates</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            In the meantime, explore our <a href="/business/pricing" className="text-gold hover:underline">pricing plans</a> or 
            read our <a href="/docs" className="text-gold hover:underline">developer documentation</a>.
          </p>
        </div>
      </div>
    </Container>
  );
}
