// ============================================================
// NEXAR NETWORK - AUTHENTICATION API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { AuthService, ValidationService, SanitizationService, IpService } from '@/lib/auth';
import { loggingService, merchantService } from '@/lib/database';
import { addSecurityHeaders, handleCors } from '@/lib/middleware/security';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = SanitizationService.sanitizeEmail(email);
    const sanitizedFullName = full_name ? SanitizationService.sanitizeString(full_name) : undefined;

    // Validate email
    if (!ValidationService.validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = ValidationService.validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid password', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Register user
    const { user, session } = await AuthService.registerUser({
      email: sanitizedEmail,
      password,
      full_name: sanitizedFullName,
    });

    // Automatically create merchant account
    let merchant = null;
    try {
      merchant = await merchantService.createMerchant(user.id, {
        business_name: `${sanitizedFullName || sanitizedEmail.split('@')[0]}'s Business`,
        business_type: 'other',
        support_email: sanitizedEmail,
      });
    } catch (merchantError) {
      // Log but don't fail registration if merchant creation fails
      await loggingService.createSystemLog({
        level: 'warning',
        category: 'merchant',
        message: `Failed to create merchant for user ${sanitizedEmail}: ${merchantError instanceof Error ? merchantError.message : 'Unknown error'}`,
        user_id: user.id,
      });
    }

    // Get client IP
    const ip = IpService.getClientIp(request);

    // Log system event
    await loggingService.createSystemLog({
      level: 'info',
      category: 'auth',
      message: `New user registered: ${sanitizedEmail}`,
      user_id: user.id,
      ip_address: ip,
    });

    // Return response (excluding sensitive data)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
      merchant: merchant ? {
        id: merchant.id,
        business_name: merchant.business_name,
        status: merchant.status,
        is_verified: merchant.is_verified,
      } : null,
      session: {
        id: session.id,
        token: session.token,
        expires_at: session.expires_at,
      },
    }, { status: 201 });
    
    return addSecurityHeaders(response);

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'auth',
      message: `Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    
    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
