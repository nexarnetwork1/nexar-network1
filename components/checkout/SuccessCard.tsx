"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Download, ExternalLink, Share2, Receipt, Calendar, Clock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Currency, type Money } from "@/shared/payments";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { BlockchainNetwork, getTransactionExplorerUrl } from "@/shared/payments/network";

interface SuccessCardProps {
  transactionId: string;
  amount: Money;
  currency: Currency;
  invoiceNumber?: string;
  merchantName?: string;
  merchantLogo?: string;
  network?: BlockchainNetwork;
  transactionHash?: string;
  paymentDate?: Date;
  explorerUrl?: string;
  returnUrl?: string;
}

export function SuccessCard({
  transactionId,
  amount,
  currency,
  invoiceNumber,
  merchantName = "Merchant",
  merchantLogo,
  network = BlockchainNetwork.BNB_SMART_CHAIN,
  transactionHash,
  paymentDate = new Date(),
  explorerUrl,
  returnUrl,
}: SuccessCardProps) {
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const { success } = useToast();

  const handleCopyTx = async () => {
    try {
      await navigator.clipboard.writeText(transactionHash || transactionId);
      setCopiedTx(true);
      success("Transaction ID copied to clipboard");
      setTimeout(() => setCopiedTx(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleCopyInvoice = async () => {
    if (!invoiceNumber) return;
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopiedInvoice(true);
      success("Invoice number copied to clipboard");
      setTimeout(() => setCopiedInvoice(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownloadReceipt = () => {
    success("Receipt download will be available soon");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Successful',
          text: `Payment of ${amount.amount} ${currency} completed successfully`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    } else {
      success("Share functionality coming soon");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const txExplorerUrl = explorerUrl || (transactionHash ? getTransactionExplorerUrl(network, transactionHash) : undefined);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Payment Successful</h2>
        <p className="text-muted-foreground">Your payment has been processed successfully</p>
      </div>

      {/* Receipt Card */}
      <div className="rounded-xl border border-border bg-background/50 p-6 space-y-6">
        {/* Merchant Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-border/50">
          {merchantLogo ? (
            <img src={merchantLogo} alt={merchantName} className="h-12 w-12 rounded-lg" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
              <Building2 className="h-6 w-6 text-gold" />
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Paid to</p>
            <p className="text-lg font-semibold text-white">{merchantName}</p>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-2">Amount Paid</p>
          <p className="text-4xl font-bold text-white mb-1">
            {amount.amount} {currency}
          </p>
          <p className="text-sm text-muted-foreground">
            {network}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          {/* Invoice Number */}
          {invoiceNumber && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Invoice</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{invoiceNumber}</span>
                <button
                  onClick={handleCopyInvoice}
                  className="text-gold hover:text-gold/80 transition-colors"
                  aria-label="Copy invoice number"
                >
                  {copiedInvoice ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Transaction ID */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Transaction ID</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white">{transactionHash || transactionId}</span>
              <button
                onClick={handleCopyTx}
                className="text-gold hover:text-gold/80 transition-colors"
                aria-label="Copy transaction ID"
              >
                {copiedTx ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Payment Date</span>
            </div>
            <span className="text-sm text-white">{formatDate(paymentDate)}</span>
          </div>

          {/* Explorer Link */}
          {txExplorerUrl && (
            <a
              href={txExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-gold hover:text-gold/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">View on Explorer</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
          <button
            onClick={handleDownloadReceipt}
            className="flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-medium text-gold hover:bg-gold/20 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Receipt</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          {returnUrl && (
            <a
              href={returnUrl}
              className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-medium text-black hover:bg-gold/90 transition-colors"
            >
              <span>Return to Merchant</span>
            </a>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 rounded-lg bg-gold/5 border border-gold/20 p-4">
        <p className="text-xs text-gold text-center">
          🔒 This payment was processed securely by Nexar Network. Save this receipt for your records.
        </p>
      </div>
    </div>
  );
}
