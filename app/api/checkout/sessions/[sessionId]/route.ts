// ============================================================
// NEXAR NETWORK - PAYMENT SESSION DETAILS API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { PaymentSessionEngine } from '@/lib/services/payment-session.service';
import { withRateLimit } from '@/lib/auth/middleware';
import { addSecurityHeaders, handleCors } from '@/lib/middleware/security';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'payment_session_get', 100);
    if (rateLimitResult) return rateLimitResult;

    // Get payment session details
    const details = await PaymentSessionEngine.getPaymentDetails(sessionId);

    const response = NextResponse.json({
      success: true,
      session: {
        id: details.session.id,
        session_id: details.session.session_id,
        status: details.session.status,
        selected_currency: details.session.selected_currency,
        crypto_amount: details.session.crypto_amount,
        exchange_rate: details.session.exchange_rate,
        supported_currencies: details.session.supported_currencies,
        expires_at: details.session.expires_at,
      },
      invoice: {
        id: details.invoice.id,
        invoice_number: details.invoice.invoice_number,
        description: details.invoice.description,
        amount: details.invoice.amount,
        currency: details.invoice.currency,
        status: details.invoice.status,
      },
      payment_details: {
        wallet_address: details.walletAddress,
        crypto_amount: details.session.crypto_amount,
        currency: details.session.selected_currency,
        exchange_rate: details.session.exchange_rate,
      },
      time_remaining: details.timeRemaining,
    });
    
    return addSecurityHeaders(response);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'payment_session_update', 20);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { currency } = body;

    // Validate required fields
    if (!currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }

    // Select currency
    const result = await PaymentSessionEngine.selectCurrency(sessionId, currency);

    return NextResponse.json({
      success: true,
      session: result.session,
      crypto_amount: result.cryptoAmount,
      exchange_rate: result.exchangeRate,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
