// ============================================================
// NEXAR NETWORK - WALLET MANAGEMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withLogging, withRateLimit, isErrorResponse } from '@/lib/auth/middleware';
import { merchantService, walletService, loggingService } from '@/lib/database';
import { ValidationService, SanitizationService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'wallet_create', 10);
    if (rateLimitResult) return rateLimitResult;

    // Authentication
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const userId = authResult.userId;

    // Get merchant
    const merchant = await merchantService.getMerchantByUserId(userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { currency, address, is_default } = body;

    // Validate required fields
    if (!currency || !address) {
      return NextResponse.json(
        { error: 'Currency and address are required' },
        { status: 400 }
      );
    }

    // Validate currency
    if (!ValidationService.validateCurrency(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedCurrency = SanitizationService.sanitizeCurrency(currency);
    const sanitizedAddress = SanitizationService.sanitizeString(address);

    // Check if wallet already exists for this currency
    const existingWallet = await walletService.getWalletByCurrency(merchant.id, sanitizedCurrency);
    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists for this currency' },
        { status: 409 }
      );
    }

    // Create wallet
    const wallet = await walletService.createWallet({
      merchant_id: merchant.id,
      currency: sanitizedCurrency,
      address: sanitizedAddress,
      is_default: is_default || false,
    });

    // Log audit event
    await withLogging(request, 'wallet_created', 'wallet', wallet.id);

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        currency: wallet.currency,
        address: wallet.address,
        is_default: wallet.is_default,
        is_active: wallet.is_active,
        created_at: wallet.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'wallet',
      message: `Wallet creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const userId = authResult.userId;

    // Get merchant
    const merchant = await merchantService.getMerchantByUserId(userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get wallets
    const wallets = await walletService.getWalletsByMerchant(merchant.id);

    return NextResponse.json({
      success: true,
      wallets,
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'wallet',
      message: `Wallets retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
