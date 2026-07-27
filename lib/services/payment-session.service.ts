// ============================================================
// NEXAR NETWORK - PAYMENT SESSION SERVICE
// Phase 5: Core Platform Implementation
// ============================================================

import { paymentSessionService, invoiceService, walletService } from '@/lib/database';
import { InvoiceEngine } from './invoice.service';
import type { PaymentSession, Invoice } from '@/types/database';

export class PaymentSessionEngine {
  static async createPaymentSession(
    invoiceId: string,
    data: {
      customer_email?: string;
      supported_currencies?: string[];
    }
  ): Promise<PaymentSession> {
    // Validate invoice
    const validation = await InvoiceEngine.validateInvoiceForPayment(invoiceId);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid invoice');
    }

    const invoice = validation.invoice!;

    // Create payment session request
    const sessionData: any = {
      invoice_id: invoiceId,
      customer_email: data.customer_email,
      supported_currencies: data.supported_currencies,
    };

    // Create payment session
    const session = await paymentSessionService.createPaymentSession(
      invoiceId,
      invoice.merchant_id,
      sessionData
    );

    return session;
  }

  static async getPaymentSession(sessionId: string): Promise<PaymentSession | null> {
    return paymentSessionService.getPaymentSessionBySessionId(sessionId);
  }

  static async selectCurrency(
    sessionId: string,
    currency: string
  ): Promise<{ session: PaymentSession; cryptoAmount: number; exchangeRate: number }> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    if (!session) {
      throw new Error('Payment session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Payment session is not pending');
    }

    // Get invoice
    const invoice = await invoiceService.getInvoiceById(session.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate crypto amount
    const { amount, rate } = await InvoiceEngine.calculateCryptoAmount(
      invoice.amount,
      invoice.currency,
      currency
    );

    // Update session
    const updatedSession = await paymentSessionService.updatePaymentSession(session.id, {
      selected_currency: currency,
      crypto_amount: amount,
      exchange_rate: rate,
    });

    // Update invoice with crypto details
    await InvoiceEngine.updateInvoiceWithCryptoDetails(invoice.id, currency);

    return {
      session: updatedSession,
      cryptoAmount: amount,
      exchangeRate: rate,
    };
  }

  static async getPaymentDetails(sessionId: string): Promise<{
    session: PaymentSession;
    invoice: Invoice;
    walletAddress: string;
    timeRemaining: number;
  }> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    if (!session) {
      throw new Error('Payment session not found');
    }

    const invoice = await invoiceService.getInvoiceById(session.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get wallet address for selected currency or default to NXR
    const wallet = await walletService.getWalletByCurrency(
      session.merchant_id,
      session.selected_currency || 'NXR'
    );

    if (!wallet) {
      // Try to get any wallet as fallback
      const allWallets = await walletService.getWalletsByMerchant(session.merchant_id);
      if (allWallets.length > 0) {
        // Use the first available wallet
        const fallbackWallet = allWallets[0];
        // Update session with fallback currency
        await paymentSessionService.updatePaymentSession(session.id, {
          selected_currency: fallbackWallet.currency,
        });
      } else {
        throw new Error('No wallet found for merchant. Please add a wallet in your merchant settings.');
      }
    }

    // Recalculate with potentially updated session
    const updatedSession = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    const finalWallet = wallet || await walletService.getWalletByCurrency(
      session.merchant_id,
      updatedSession?.selected_currency || session.selected_currency || 'NXR'
    );

    // Calculate time remaining
    const now = new Date();
    const sessionToUse = updatedSession || session;
    const expiresAt = new Date(sessionToUse.expires_at);
    const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return {
      session: sessionToUse,
      invoice,
      walletAddress: finalWallet?.address || '',
      timeRemaining,
    };
  }

  static async completePaymentSession(sessionId: string): Promise<PaymentSession> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    if (!session) {
      throw new Error('Payment session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Payment session is not pending');
    }

    // Mark invoice as paid
    await InvoiceEngine.updateInvoiceStatus(session.invoice_id, 'paid');

    // Complete session
    return paymentSessionService.completePaymentSession(session.id);
  }

  static async expirePaymentSession(sessionId: string): Promise<PaymentSession> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    if (!session) {
      throw new Error('Payment session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Payment session is not pending');
    }

    // Mark invoice as expired
    await InvoiceEngine.updateInvoiceStatus(session.invoice_id, 'expired');

    // Update session
    return paymentSessionService.updatePaymentSession(session.id, {
      status: 'expired',
    });
  }

  static async checkSessionExpiration(sessionId: string): Promise<boolean> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    if (!session) return false;

    if (session.status !== 'pending') return false;

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      await this.expirePaymentSession(sessionId);
      return true;
    }

    return false;
  }

  static generateCheckoutUrl(sessionId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/${sessionId}`;
  }

  static async getSupportedCurrencies(): Promise<string[]> {
    return ['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH'];
  }

  static async validatePaymentSession(sessionId: string): Promise<{
    valid: boolean;
    session?: PaymentSession;
    error?: string;
  }> {
    const session = await paymentSessionService.getPaymentSessionBySessionId(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Payment session not found' };
    }

    if (session.status !== 'pending') {
      return { valid: false, error: `Payment session is ${session.status}` };
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      await this.expirePaymentSession(sessionId);
      return { valid: false, error: 'Payment session has expired' };
    }

    return { valid: true, session };
  }
}
