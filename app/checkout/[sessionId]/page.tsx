"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Loader2, Copy } from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/checkout/sessions/${sessionId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Session not found: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setSession(data.session);
          setWalletAddress(data.payment_details?.wallet_address || "");
          setPaymentStatus(data.session?.status || "pending");
        } else {
          setError(data.error || 'Failed to load payment session');
        }
        setLoading(false);
      })
      .catch(error => {
        setError(error instanceof Error ? error.message : 'Failed to load payment session');
        setLoading(false);
      });
  }, [sessionId]);

  // Poll for payment status
  useEffect(() => {
    if (session && paymentStatus === "pending") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/checkout/sessions/${sessionId}`);
          const data = await response.json();
          
          if (data.success && data.session) {
            const newStatus = data.session.status;
            if (newStatus === 'completed') {
              setPaymentStatus("completed");
              clearInterval(interval);
            } else if (newStatus === 'failed' || newStatus === 'expired') {
              setPaymentStatus(newStatus);
              clearInterval(interval);
            }
          }
        } catch (error) {
          // Continue polling on error
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [session, paymentStatus, sessionId]);

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading payment session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-400 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Payment Session Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The payment session you\'re looking for doesn\'t exist'}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-green-400 mb-4">
            <CheckCircle2 className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Payment Successful</h2>
          <p className="text-muted-foreground mb-6">Your payment has been processed successfully.</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed" || paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-400 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {paymentStatus === "expired" ? "Payment Expired" : "Payment Failed"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {paymentStatus === "expired" 
              ? "This payment session has expired." 
              : "The payment could not be processed."}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gold">Nexar Network</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Order Info */}
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-white mb-2">Complete Payment</h1>
            <p className="text-sm text-muted-foreground">
              Order #{session.invoice_number || session.id}
            </p>
          </div>

          {/* Amount */}
          <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
            <p className="text-3xl font-bold text-white">
              {session.amount} {session.currency}
            </p>
          </div>

          {/* Wallet Address */}
          {walletAddress && (
            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground mb-3">Send payment to this address</p>
              <div className="bg-black/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-gold break-all">{walletAddress}</p>
                  <button
                    onClick={handleCopyAddress}
                    className="ml-2 p-2 hover:bg-white/10 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Send exactly {session.amount} {session.currency}
              </p>
            </div>
          )}

          {/* Expiry */}
          {session.expires_at && (
            <div className="luxury-border rounded-xl bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Expires: {new Date(session.expires_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${
              paymentStatus === 'pending' ? 'bg-yellow-400' : 'bg-green-400'
            }`} />
            <span className="capitalize">{paymentStatus}</span>
          </div>
        </div>
      </main>
    </div>
  );
}