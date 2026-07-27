// ============================================================
// NEXAR NETWORK - PAYMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateMerchant,
  withLogging,
  withRateLimit,
  isErrorResponse,
} from '@/lib/auth/middleware';
import { paymentService, loggingService } from '@/lib/database';
import { PaymentEngine } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const rateLimitResult = await withRateLimit(request, 'payment_create', 30);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const {
      invoice_id,
      payment_session_id,
      customer_id,
      to_address,
      amount,
      currency,
      from_address,
    } = body;

    if (!invoice_id || !to_address || !amount || !currency) {
      return NextResponse.json(
        { error: 'Invoice ID, to address, amount, and currency are required' },
        { status: 400 }
      );
    }

    const payment = await PaymentEngine.createPayment({
      invoice_id,
      payment_session_id,
      merchant_id: auth.merchantId,
      customer_id,
      to_address,
      amount: parseFloat(amount),
      currency,
      from_address,
    });

    await withLogging(request, 'payment_created', 'payment', payment.id, {
      userId: auth.userId,
      merchantId: auth.merchantId,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        invoice_id: payment.invoice_id,
        amount: payment.amount,
        currency: payment.currency,
        to_address: payment.to_address,
        from_address: payment.from_address,
        status: payment.status,
        confirmations: payment.confirmations,
        required_confirmations: payment.required_confirmations,
        created_at: payment.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'payment',
      message: `Payment creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const payments = await paymentService.getPaymentsByMerchant(
      auth.merchantId,
      status,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        limit,
        offset,
        total: payments.length,
      },
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'payment',
      message: `Payments retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
