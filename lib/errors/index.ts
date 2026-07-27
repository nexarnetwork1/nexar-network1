// ============================================================
// NEXAR NETWORK - ERROR HANDLING
// Standardized error handling utilities
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export function handleApiError(error: unknown): { error: string; code: string; details?: Record<string, any> } {
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
    };
  }
  
  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

export function getStatusCode(error: unknown): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  
  return 500;
}

export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };
  
  console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
  
  // TODO: Send to logging service when available
  // try {
  //   await loggingService.createSystemLog('error', errorInfo);
  // } catch (loggingError) {
  //   console.error('Failed to log error:', loggingError);
  // }
}