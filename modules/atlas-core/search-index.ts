/**
 * ATLAS Core — search index helpers (pure).
 */

export type SearchDocumentDraft = {
  entityType: string;
  entityId: string;
  businessId?: string;
  title: string;
  body?: string;
  keywords?: string[];
  isPublished?: boolean;
  rankBoost?: number;
  metadata?: Record<string, unknown>;
};

export function buildSearchDocumentFromEvent(input: {
  entityType: string;
  entityId: string;
  businessId?: string | null;
  payload: Record<string, unknown>;
  titleKey: string;
}): SearchDocumentDraft | null {
  const title =
    (input.payload[input.titleKey] as string | undefined) ??
    (input.payload.name as string | undefined) ??
    (input.payload.title as string | undefined) ??
    (input.payload.displayName as string | undefined) ??
    (input.payload.slug as string | undefined);
  if (!title || !input.entityId) return null;
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    businessId: input.businessId ?? undefined,
    title,
    body: (input.payload.description as string | undefined) ?? undefined,
    keywords: Array.isArray(input.payload.keywords)
      ? (input.payload.keywords as string[])
      : [],
    isPublished: true,
    metadata: { source: "domain_event" },
  };
}

export function matchSearchQuery(
  documents: Array<{ title: string; body?: string | null }>,
  query: string,
): typeof documents {
  const q = query.trim().toLowerCase();
  if (!q) return documents;
  return documents.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      (d.body ?? "").toLowerCase().includes(q),
  );
}
