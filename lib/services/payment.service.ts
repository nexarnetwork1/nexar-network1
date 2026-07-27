// ============================================================
// NEXAR NETWORK - PAYMENT ENGINE
// Phase 5: Core Platform Implementation
// ============================================================

import { paymentService, receiptService, invoiceService, loggingService } from '@/lib/database';
import { PaymentSessionEngine } from './payment-session.service';
import type { Payment, Invoice } from '@/types/database';

export class PaymentEngine {
  static async createPayment(data: {
    invoice_id: string;
    payment_session_id?: string;
    merchant_id: string;
    customer_id?: string;
    to_address: string;
    amount: number;
    currency: string;
    from_address?: string;
  }): Promise<Payment> {
    // Validate invoice exists and is pending
    const invoice = await invoiceService.getInvoiceById(data.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'pending') {
      throw new Error(`Invoice is ${invoice.status}, cannot create payment`);
    }

    // Create payment record
    const payment = await paymentService.createPayment(data);

    // Log payment creation
    await loggingService.createSystemLog({
      level: 'info',
      category: 'payment',
      message: `Payment created for invoice ${data.invoice_id}`,
      merchant_id: data.merchant_id,
      metadata: {
        payment_id: payment.id,
        amount: data.amount,
        currency: data.currency,
      },
    });

    return payment;
  }

  static async detectPayment(
    transactionHash: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    currency: string
  ): Promise<Payment | null> {
    // Check if payment already exists
    const existingPayment = await paymentService.getPaymentsByMerchant(
      '', // We'll need to search by transaction hash
      'pending'
    );

    // In production, we would query by transaction_hash
    // For now, we'll create a new payment if not found

    return null;
  }

  static async confirmPayment(
    paymentId: string,
    transactionHash: string,
    blockNumber?: number
  ): Promise<{ payment: Payment; receipt: any }> {
    // Get payment
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'confirmed') {
      throw new Error('Payment already confirmed');
    }

    // Update payment status
    const updatedPayment = await paymentService.confirmPayment(paymentId, transactionHash);

    if (blockNumber) {
      await paymentService.updatePayment(paymentId, { block_number: blockNumber });
    }

    // Get invoice
    const invoice = await invoiceService.getInvoiceById(payment.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Mark invoice as paid
    await invoiceService.markInvoiceAsPaid(invoice.id);

    // Complete payment session if exists
    if (payment.payment_session_id) {
      try {
        await PaymentSessionEngine.completePaymentSession(payment.payment_session_id);
      } catch (error) {
        // Failed to complete payment session, but payment was confirmed
        // This is logged elsewhere
      }
    }

    // Create receipt
    const receipt = await receiptService.createReceipt({
      payment_id: payment.id,
      invoice_id: invoice.id,
      amount: payment.amount,
      currency: payment.currency,
      merchant_name: invoice.description || 'Merchant',
      customer_name: payment.from_address || 'Customer',
    });

    // Log payment confirmation
    await loggingService.createSystemLog({
      level: 'info',
      category: 'payment',
      message: `Payment confirmed: ${transactionHash}`,
      merchant_id: payment.merchant_id,
      metadata: {
        payment_id: payment.id,
        invoice_id: invoice.id,
        amount: payment.amount,
        currency: payment.currency,
      },
    });

    return {
      payment: updatedPayment,
      receipt,
    };
  }

  static async updatePaymentConfirmations(
    paymentId: string,
    confirmations: number
  ): Promise<Payment> {
    const payment = await paymentService.updatePaymentConfirmations(paymentId, confirmations);

    // If enough confirmations, auto-confirm
    if (confirmations >= payment.required_confirmations && payment.status !== 'confirmed') {
      if (payment.transaction_hash) {
        await this.confirmPayment(paymentId, payment.transaction_hash);
      }
    }

    return payment;
  }

  static async failPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'confirmed') {
      throw new Error('Cannot fail a confirmed payment');
    }

    const updatedPayment = await paymentService.updatePayment(paymentId, {
      status: 'failed',
    });

    // Log payment failure
    await loggingService.createSystemLog({
      level: 'warning',
      category: 'payment',
      message: `Payment failed: ${reason || 'Unknown reason'}`,
      merchant_id: payment.merchant_id,
      metadata: {
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        reason,
      },
    });

    return updatedPayment;
  }

  static async getPaymentStatus(paymentId: string): Promise<{
    payment: Payment;
    invoice?: Invoice;
    confirmations_remaining: number;
  }> {
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const invoice = await invoiceService.getInvoiceById(payment.invoice_id);
    const confirmations_remaining = Math.max(0, payment.required_confirmations - payment.confirmations);

    return {
      payment,
      invoice: invoice || undefined,
      confirmations_remaining,
    };
  }

  static async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return paymentService.getPaymentsByMerchant(invoice.merchant_id);
  }

  static async validatePaymentAmount(
    expectedAmount: number,
    receivedAmount: number,
    tolerancePercent: number = 1
  ): Promise<boolean> {
    const tolerance = expectedAmount * (tolerancePercent / 100);
    const minAmount = expectedAmount - tolerance;
    const maxAmount = expectedAmount + tolerance;

    return receivedAmount >= minAmount && receivedAmount <= maxAmount;
  }

  static async processPaymentNotification(data: {
    transaction_hash: string;
    from_address: string;
    to_address: string;
    amount: number;
    currency: string;
    block_number?: number;
    confirmations?: number;
  }): Promise<{ processed: boolean; payment_id?: string }> {
    try {
      // Find pending payment matching this transaction
      // In production, this would query by transaction_hash or wallet address
      const pendingPayments = await paymentService.getPaymentsByMerchant(
        '', // We need to implement search by to_address
        'pending'
      );

      // For now, return not processed
      return { processed: false };
    } catch (error) {
      return { processed: false };
    }
  }

  static async refundPayment(
    paymentId: string,
    reason?: string
  ): Promise<Payment> {
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'confirmed') {
      throw new Error('Can only refund confirmed payments');
    }

    // Get invoice
    const invoice = await invoiceService.getInvoiceById(payment.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Mark invoice as refunded
    await invoiceService.updateInvoice(invoice.id, {
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    });

    // Update payment status
    const updatedPayment = await paymentService.updatePayment(paymentId, {
      status: 'failed', // Or create a separate refund status
    });

    // Log refund
    await loggingService.createSystemLog({
      level: 'warning',
      category: 'payment',
      message: `Payment refunded: ${reason || 'No reason provided'}`,
      merchant_id: payment.merchant_id,
      metadata: {
        payment_id: payment.id,
        invoice_id: invoice.id,
        amount: payment.amount,
        reason,
      },
    });

    return updatedPayment;
  }

  static async getPaymentStatistics(merchantId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<{
    total_payments: number;
    total_amount: number;
    confirmed_payments: number;
    pending_payments: number;
    failed_payments: number;
    average_confirmation_time: number;
  }> {
    const payments = await paymentService.getPaymentsByMerchant(merchantId);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const periodPayments = payments.filter(p => new Date(p.created_at) >= startDate);

    const total_payments = periodPayments.length;
    const total_amount = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const confirmed_payments = periodPayments.filter(p => p.status === 'confirmed').length;
    const pending_payments = periodPayments.filter(p => p.status === 'pending').length;
    const failed_payments = periodPayments.filter(p => p.status === 'failed').length;

    // Calculate average confirmation time (placeholder)
    const average_confirmation_time = 0;

    return {
      total_payments,
      total_amount,
      confirmed_payments,
      pending_payments,
      failed_payments,
      average_confirmation_time,
    };
  }
}
