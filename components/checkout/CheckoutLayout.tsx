"use client";

import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Shield, Zap, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PaymentSession, type PaymentMetadata } from "@/shared/payments";

interface CheckoutPaymentMetadata extends PaymentMetadata {
  merchantName?: string;
  merchantLogo?: string;
  isVerifiedMerchant?: boolean;
}

interface CheckoutLayoutProps {
  children: ReactNode;
  session?: PaymentSession & { metadata?: CheckoutPaymentMetadata };
  loading?: boolean;
}

export function CheckoutLayout({ children, session, loading }: CheckoutLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div className="h-6 w-px bg-border/50" />
              <div>
                <p className="text-xs text-muted-foreground">Powered by</p>
                <p className="text-sm font-semibold text-gold">Nexar Network</p>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-gold" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-gold" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-gold" />
                <span>Protected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Merchant Info Bar */}
          {session?.metadata?.merchantName && (
            <div className="mb-6 rounded-lg border border-border/50 bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {session.metadata.merchantLogo ? (
                    <img 
                      src={session.metadata.merchantLogo} 
                      alt={session.metadata.merchantName}
                      className="h-10 w-10 rounded-lg"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                      <span className="text-sm font-semibold text-gold">
                        {session.metadata.merchantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Payment to</p>
                    <p className="text-sm font-semibold text-white">{session.metadata.merchantName}</p>
                  </div>
                </div>
                {session.metadata.isVerifiedMerchant !== false && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Verified</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkout Content */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-6 md:p-8">
            {children}
          </div>

          {/* Nexar Branding Footer */}
          <div className="mt-6 rounded-lg border border-gold/20 bg-gradient-to-r from-gold/10 to-gold/5 p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
                  <Logo />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gold">Building the Future of Global Payments</p>
                  <p className="text-xs text-muted-foreground">Fast • Secure • Transparent</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Instant Settlement</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Session Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nexar Network</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
