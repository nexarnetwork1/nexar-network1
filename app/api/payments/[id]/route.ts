// ============================================================
// NEXAR NETWORK - INDIVIDUAL PAYMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateMerchant,
  withAuth,
  withLogging,
  isErrorResponse,
} from '@/lib/auth/middleware';
import { merchantService, paymentService } from '@/lib/database';
import { PaymentEngine } from '@/lib/services/payment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.merchant_id !== auth.merchantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const status = await PaymentEngine.getPaymentStatus(id);

    return NextResponse.json({
      success: true,
      payment: status.payment,
      invoice: status.invoice,
      confirmations_remaining: status.confirmations_remaining,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const merchant = await merchantService.getMerchantByUserId(authResult.userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, transaction_hash, block_number, confirmations, reason } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updatedPayment;

    switch (action) {
      case 'confirm':
        if (!transaction_hash) {
          return NextResponse.json(
            { error: 'Transaction hash is required for confirmation' },
            { status: 400 }
          );
        }
        updatedPayment = (await PaymentEngine.confirmPayment(id, transaction_hash, block_number)).payment;
        break;

      case 'update_confirmations':
        if (confirmations === undefined) {
          return NextResponse.json(
            { error: 'Confirmations count is required' },
            { status: 400 }
          );
        }
        updatedPayment = await PaymentEngine.updatePaymentConfirmations(id, confirmations);
        break;

      case 'fail':
        updatedPayment = await PaymentEngine.failPayment(id, reason);
        break;

      case 'refund':
        updatedPayment = await PaymentEngine.refundPayment(id, reason);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await withLogging(request, `payment_${action}`, 'payment', id, {
      userId: authResult.userId,
      merchantId: merchant.id,
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
