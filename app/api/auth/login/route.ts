// ============================================================
// NEXAR NETWORK - AUTHENTICATION API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { AuthService, ValidationService, SanitizationService, IpService } from '@/lib/auth';
import { loggingService } from '@/lib/database';
import { addSecurityHeaders, handleCors } from '@/lib/middleware/security';
import { 
  handleApiError, 
  getStatusCode, 
  logError, 
  ValidationError, 
  AuthenticationError 
} from '@/lib/errors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = SanitizationService.sanitizeEmail(email);

    // Validate email
    if (!ValidationService.validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client info
    const ip = IpService.getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Login user
    const { user, session } = await AuthService.loginUser({
      email: sanitizedEmail,
      password,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Log system event
    await loggingService.createSystemLog({
      level: 'info',
      category: 'auth',
      message: `User logged in: ${sanitizedEmail}`,
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
        last_login_at: user.last_login_at,
      },
      session: {
        id: session.id,
        token: session.token,
        expires_at: session.expires_at,
      },
    });
    
    return addSecurityHeaders(response);

  } catch (error) {
    logError(error, { action: 'login' });
    
    // Log system event (graceful degradation)
    try {
      await loggingService.createSystemLog({
        level: 'error',
        category: 'auth',
        message: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } catch (loggingError) {
      // Silently fail if logging is unavailable
    }

    if (error instanceof Error && error.message === 'Invalid credentials') {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    if (error instanceof Error && error.message === 'Account is disabled') {
      const response = NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
      return addSecurityHeaders(response);
    }

    const errorResponse = handleApiError(error);
    const response = NextResponse.json(errorResponse, { status: getStatusCode(error) });
    return addSecurityHeaders(response);
  }
}
