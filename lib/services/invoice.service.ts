// ============================================================
// NEXAR NETWORK - INVOICE SERVICE
// Phase 5: Core Platform Implementation
// ============================================================

import { invoiceService, paymentSessionService, exchangeRateService } from '@/lib/database';
import { ValidationService, SanitizationService } from '@/lib/auth';
import QRCode from 'qrcode';
import type { CreateInvoiceRequest, Invoice } from '@/types/database';

export class InvoiceEngine {
  static async createInvoice(
    merchantId: string,
    data: CreateInvoiceRequest
  ): Promise<{ invoice: Invoice; qrCodeUrl: string; paymentUrl: string }> {
    // Validate amount
    if (!ValidationService.validateAmount(data.amount)) {
      throw new Error('Invalid amount');
    }

    // Validate currency
    if (data.currency && !ValidationService.validateCurrency(data.currency)) {
      throw new Error('Invalid currency');
    }

    // Sanitize input
    const sanitizedData: CreateInvoiceRequest = {
      ...data,
      description: data.description ? SanitizationService.sanitizeString(data.description) : undefined,
      customer_email: data.customer_email ? SanitizationService.sanitizeEmail(data.customer_email) : undefined,
    };

    // Create invoice
    const invoice = await invoiceService.createInvoice(merchantId, sanitizedData);

    // Create payment session and generate checkout URL
    const session = await paymentSessionService.createPaymentSession(
      invoice.id,
      merchantId,
      { customer_email: data.customer_email }
    );
    const paymentUrl = this.generateCheckoutUrl(session.session_id);

    // Generate QR code
    const qrCodeUrl = await this.generateQRCode(paymentUrl);

    // Update invoice with URLs
    await invoiceService.updateInvoice(invoice.id, {
      payment_url: paymentUrl,
      qr_code_url: qrCodeUrl,
    });

    return {
      invoice: { ...invoice, payment_url: paymentUrl, qr_code_url: qrCodeUrl },
      qrCodeUrl,
      paymentUrl,
    };
  }

  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return invoiceService.getInvoiceById(invoiceId);
  }

  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    return invoiceService.getInvoiceByNumber(invoiceNumber);
  }

  static async getInvoicesByMerchant(
    merchantId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<Invoice[]> {
    return invoiceService.getInvoicesByMerchant(merchantId, status, limit, offset);
  }

  static async updateInvoiceStatus(
    invoiceId: string,
    status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'
  ): Promise<Invoice> {
    switch (status) {
      case 'paid':
        return invoiceService.markInvoiceAsPaid(invoiceId);
      case 'expired':
        return invoiceService.markInvoiceAsExpired(invoiceId);
      case 'cancelled':
        return invoiceService.cancelInvoice(invoiceId);
      default:
        return invoiceService.updateInvoice(invoiceId, { status });
    }
  }

  static async calculateCryptoAmount(
    fiatAmount: number,
    fiatCurrency: string,
    cryptoCurrency: string
  ): Promise<{ amount: number; rate: number }> {
    // Get exchange rate
    const rate = await exchangeRateService.getExchangeRate(fiatCurrency, cryptoCurrency);
    
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fiatCurrency} to ${cryptoCurrency}`);
    }

    const cryptoAmount = fiatAmount * rate.rate;

    return {
      amount: cryptoAmount,
      rate: rate.rate,
    };
  }

  static async updateInvoiceWithCryptoDetails(
    invoiceId: string,
    cryptoCurrency: string
  ): Promise<Invoice> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate crypto amount
    const { amount, rate } = await this.calculateCryptoAmount(
      invoice.amount,
      invoice.currency,
      cryptoCurrency
    );

    // Update invoice
    return invoiceService.updateInvoice(invoiceId, {
      crypto_currency: cryptoCurrency,
      crypto_amount: amount,
      exchange_rate: rate,
    });
  }

  static generateCheckoutUrl(sessionId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/${sessionId}`;
  }

  static async generateQRCode(url: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  static async checkInvoiceExpiration(invoiceId: string): Promise<boolean> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) return false;

    if (invoice.status !== 'pending') return false;

    const now = new Date();
    const expiresAt = new Date(invoice.expires_at);

    if (now > expiresAt) {
      await this.updateInvoiceStatus(invoiceId, 'expired');
      return true;
    }

    return false;
  }

  static async cancelInvoice(invoiceId: string, reason?: string): Promise<Invoice> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot cancel a paid invoice');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Invoice is already cancelled');
    }

    const updatedInvoice = await invoiceService.cancelInvoice(invoiceId);

    // Update with cancellation reason if provided
    if (reason) {
      await invoiceService.updateInvoice(invoiceId, {
        notes: reason,
      });
    }

    return updatedInvoice;
  }

  static async refundInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'paid') {
      throw new Error('Can only refund paid invoices');
    }

    return invoiceService.updateInvoice(invoiceId, {
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    });
  }

  static getInvoiceStatusSummary(invoices: Invoice[]): Record<string, number> {
    return invoices.reduce((summary, invoice) => {
      summary[invoice.status] = (summary[invoice.status] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);
  }

  static async validateInvoiceForPayment(invoiceId: string): Promise<{
    valid: boolean;
    invoice?: Invoice;
    error?: string;
  }> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    
    if (!invoice) {
      return { valid: false, error: 'Invoice not found' };
    }

    if (invoice.status !== 'pending') {
      return { valid: false, error: `Invoice is ${invoice.status}` };
    }

    const now = new Date();
    const expiresAt = new Date(invoice.expires_at);

    if (now > expiresAt) {
      await this.updateInvoiceStatus(invoiceId, 'expired');
      return { valid: false, error: 'Invoice has expired' };
    }

    return { valid: true, invoice };
  }
}
