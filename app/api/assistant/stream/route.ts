import { z } from "zod";
import { sanitizeUserMessage, isEmptyAfterSanitize } from "@/lib/ai/memory";
import { checkAssistantRateLimit } from "@/lib/ai/rate-limit";
import { getAssistantProvider, type StreamEvent } from "@/lib/ai/provider";
import { demoGlobalAssistantProvider } from "@/modules/ai/global-assistant/provider";
import { enrichAssistantContext } from "@/modules/ai/global-assistant/enrich-context";
import { assertSameOrigin, crossOriginForbiddenResponse } from "@/lib/security/origin-check";

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  pathname: z.string().max(200).optional(),
  hash: z.string().max(100).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
        topic: z.string().max(120).optional(),
        entityRef: z.string().max(200).optional(),
      }),
    )
    .max(12)
    .optional(),
});

function encodeSse(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  if (!assertSameOrigin(request)) return crossOriginForbiddenResponse();

  const { allowed } = await checkAssistantRateLimit();
  if (!allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const sanitized = sanitizeUserMessage(parsed.data.message);
  if (isEmptyAfterSanitize(sanitized)) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  const context = await enrichAssistantContext({
    pathname: parsed.data.pathname,
    hash: parsed.data.hash,
    conversationHistory: parsed.data.conversationHistory,
  });

  const provider = getAssistantProvider();
  const abortSignal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const generator = provider.stream(sanitized, context, abortSignal);

        for await (const event of generator) {
          if (abortSignal.aborted) break;
          controller.enqueue(encoder.encode(encodeSse(event)));

          if (event.type === "error") {
            const fallback = await demoGlobalAssistantProvider.respond(sanitized, context);
            controller.enqueue(
              encoder.encode(
                encodeSse({
                  type: "done",
                  result: {
                    ...fallback,
                    content: `${fallback.content}\n\n_Note: AI service temporarily unavailable — showing cached guidance._`,
                    mode: "demo",
                  },
                }),
              ),
            );
            break;
          }
        }
      } catch {
        if (!abortSignal.aborted) {
          const fallback = await demoGlobalAssistantProvider.respond(sanitized, context);
          controller.enqueue(
            encoder.encode(
              encodeSse({
                type: "done",
                result: {
                  ...fallback,
                  content: `${fallback.content}\n\n_Note: AI service temporarily unavailable — showing cached guidance._`,
                  mode: "demo",
                },
              }),
            ),
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
