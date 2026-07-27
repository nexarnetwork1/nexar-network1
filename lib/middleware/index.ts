// ============================================================
// NEXAR NETWORK - MIDDLEWARE
// Centralized middleware configuration
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  addSecurityHeaders, 
  handleCors 
} from './security';
import { logError, handleApiError, getStatusCode } from '@/lib/errors';

export { addSecurityHeaders, handleCors } from './security';

export async function withMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const response = await handler();
    return addSecurityHeaders(response);
  } catch (error) {
    logError(error, { 
      url: request.url,
      method: request.method 
    });
    
    const errorResponse = handleApiError(error);
    const response = NextResponse.json(errorResponse, { 
      status: getStatusCode(error) 
    });
    
    return addSecurityHeaders(response);
  }
}

export function withCorsHandler(
  request: NextRequest,
  allowedOrigins: string[] = ['*']
): NextResponse | null {
  if (request.method === 'OPTIONS') {
    return handleCors(request, allowedOrigins);
  }
  return null;
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR'
): NextResponse {
  const response = NextResponse.json(
    { error: message, code },
    { status }
  );
  return addSecurityHeaders(response);
}