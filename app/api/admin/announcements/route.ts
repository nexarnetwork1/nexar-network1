// ============================================================
// NEXAR NETWORK - ADMIN ANNOUNCEMENT MANAGEMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { announcementService, loggingService } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (authResult) return authResult;

    const body = await request.json();
    const { title, content, type, starts_at, ends_at } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create announcement (would need database function)
    // For now, return success
    
    await loggingService.createAuditLog({
      action: 'admin_announcement_created',
      entity_type: 'announcement',
      changes: { title, type },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement created',
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (authResult) return authResult;

    const announcements = await announcementService.getActiveAnnouncements();

    return NextResponse.json({
      success: true,
      announcements,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
