// ============================================================
// NEXAR NETWORK - AUTHENTICATION API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { AuthService, IpService } from '@/lib/auth';
import { sessionService, loggingService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionData = await AuthService.validateSession(token);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Logout user
    await AuthService.logoutUser(sessionData.session.id);

    // Get client IP
    const ip = IpService.getClientIp(request);

    // Log audit event
    await loggingService.createAuditLog({
      user_id: sessionData.user.id,
      action: 'user_logged_out',
      entity_type: 'user',
      entity_id: sessionData.user.id,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'auth',
      message: `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
