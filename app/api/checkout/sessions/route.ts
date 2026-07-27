// ============================================================
// NEXAR NETWORK - PAYMENT SESSION API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { PaymentSessionEngine } from '@/lib/services/payment-session.service';
import { withRateLimit } from '@/lib/auth/middleware';
import { loggingService } from '@/lib/database';
import { addSecurityHeaders, handleCors } from '@/lib/middleware/security';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'payment_session_create', 20);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { invoice_id, customer_email, supported_currencies } = body;

    // Validate required fields
    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Create payment session
    const session = await PaymentSessionEngine.createPaymentSession(invoice_id, {
      customer_email,
      supported_currencies,
    });

    // Generate checkout URL
    const checkoutUrl = PaymentSessionEngine.generateCheckoutUrl(session.session_id);

    const response = NextResponse.json({
      success: true,
      session: {
        id: session.id,
        session_id: session.session_id,
        status: session.status,
        checkout_url: checkoutUrl,
        expires_at: session.expires_at,
        supported_currencies: session.supported_currencies,
      },
    }, { status: 201 });
    
    return addSecurityHeaders(response);

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'checkout',
      message: `Payment session creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
