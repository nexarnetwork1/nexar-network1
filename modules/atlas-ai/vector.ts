/**
 * ATLAS AI — vector layer (pure, provider-agnostic).
 * Production embeddings come from AiModel providers; stubEmbed is for tests/foundation.
 */

export type VectorSearchHit = {
  id: string;
  content: string;
  score: number;
  knowledgeId?: string | null;
  metadata?: Record<string, unknown>;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Deterministic pseudo-embedding for foundation tests (dim 32). */
export function stubEmbed(text: string, dimensions = 32): number[] {
  const out = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    out[i % dimensions] += ((code % 31) - 15) / 15;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}

export function rankBySimilarity(
  queryEmbedding: number[],
  docs: Array<{
    id: string;
    content: string;
    embedding: number[] | null;
    knowledgeId?: string | null;
    metadata?: Record<string, unknown>;
  }>,
): VectorSearchHit[] {
  return docs
    .map((doc) => {
      const embedding = doc.embedding ?? stubEmbed(doc.content);
      return {
        id: doc.id,
        content: doc.content,
        score: cosineSimilarity(queryEmbedding, embedding),
        knowledgeId: doc.knowledgeId,
        metadata: doc.metadata,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Pad/truncate float arrays to 1536 for pgvector column writes. */
export function toPgVector1536(embedding: number[]): number[] {
  const out = new Array<number>(1536).fill(0);
  for (let i = 0; i < Math.min(embedding.length, 1536); i++) {
    out[i] = embedding[i];
  }
  return out;
}
