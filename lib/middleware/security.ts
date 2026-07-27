// ============================================================
// NEXAR NETWORK - SECURITY MIDDLEWARE
// Security headers and CORS configuration
// ============================================================

import { NextResponse } from 'next/server';

export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'force-once-site',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers to the existing response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function getCorsHeaders(allowedOrigins: string[] = ['*']) {
  return {
    'Access-Control-Allow-Origin': allowedOrigins.join(', '),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(request: Request, allowedOrigins: string[] = ['*']): NextResponse {
  const origin = request.headers.get('origin');
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(allowedOrigins),
    });
  }
  
  return new NextResponse('Unauthorized', { status: 401 });
}

export async function withSecurityHeaders(request: Request, handler: () => Promise<NextResponse>): Promise<NextResponse> {
  const response = await handler();
  return addSecurityHeaders(response);
}