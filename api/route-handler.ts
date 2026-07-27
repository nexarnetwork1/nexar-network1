import { handleError, apiSuccessResponse } from "@/lib/errors";

export type RouteHandler = (
  request: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, { source: request.url });
    }
  };
}

export { apiSuccessResponse };
