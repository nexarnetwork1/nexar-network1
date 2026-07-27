// ============================================================
// NEXAR NETWORK - PRICE SERVICE API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { PriceService } from '@/lib/services/price.service';
import { withRateLimit } from '@/lib/auth/middleware';
import { loggingService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'prices_get', 100);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');

    // If specific currency pair requested
    if (from && to) {
      const { rate, timestamp } = await PriceService.getExchangeRate(from, to);

      if (amount) {
        const { amount: convertedAmount, rate: conversionRate } = await PriceService.convertAmount(
          parseFloat(amount),
          from,
          to
        );

        return NextResponse.json({
          success: true,
          from,
          to,
          amount: parseFloat(amount),
          converted_amount: convertedAmount,
          rate: conversionRate,
          timestamp,
        });
      }

      return NextResponse.json({
        success: true,
        from,
        to,
        rate,
        timestamp,
      });
    }

    // Return all exchange rates
    const rates = await PriceService.getAllExchangeRates();

    return NextResponse.json({
      success: true,
      rates,
      supported_currencies: PriceService.getSupportedCurrencies(),
      cache_size: PriceService.getCacheSize(),
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'price',
      message: `Price service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication required for admin operations
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // In production, verify admin token here
    // For now, we'll allow it

    const body = await request.json();
    const { action } = body;

    if (action === 'refresh') {
      await PriceService.refreshExchangeRates();
      
      return NextResponse.json({
        success: true,
        message: 'Exchange rates refreshed successfully',
      });
    }

    if (action === 'clear_cache') {
      PriceService.clearCache();
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'price',
      message: `Price service admin error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
