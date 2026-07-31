import { COMMERCE_API_V1 } from "@/modules/marketplace/shared/constants";
import type {
  CommerceActivityEvent,
  CommerceBrand,
  LiveMetricsPayload,
  MarketplaceStatisticsPayload,
} from "./types";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Commerce API ${res.status}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function fetchLiveMetrics(): Promise<{
  payload: LiveMetricsPayload;
  updated_at: string;
}> {
  const res = await fetch(`${COMMERCE_API_V1}/statistics/live`, {
    cache: "no-store",
  });
  return parseResponse(res);
}

export async function fetchMarketplaceStatistics(
  limit = 24,
): Promise<MarketplaceStatisticsPayload> {
  const res = await fetch(
    `${COMMERCE_API_V1}/statistics/marketplace?limit=${limit}`,
    { next: { revalidate: 30 } },
  );
  return parseResponse(res);
}

export async function fetchBrands(limit = 50): Promise<CommerceBrand[]> {
  const res = await fetch(`${COMMERCE_API_V1}/brands?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  return parseResponse(res);
}

export async function fetchActivity(
  limit = 30,
): Promise<CommerceActivityEvent[]> {
  const res = await fetch(`${COMMERCE_API_V1}/activity?limit=${limit}`, {
    cache: "no-store",
  });
  return parseResponse(res);
}

export const commerceQueryKeys = {
  live: ["commerce", "live"] as const,
  marketplace: (limit: number) => ["commerce", "marketplace", limit] as const,
  brands: (limit: number) => ["commerce", "brands", limit] as const,
  activity: (limit: number) => ["commerce", "activity", limit] as const,
};
