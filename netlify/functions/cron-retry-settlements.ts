import type { Config } from "@netlify/functions";

async function callCron(path: string): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const baseUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL;

  if (!secret || !baseUrl) {
    console.error("CRON_SECRET or site URL not configured");
    return new Response("Cron not configured", { status: 500 });
  }

  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  console.info(`Cron ${path}: ${res.status}`, body.slice(0, 200));
  return new Response(body, { status: res.status });
}

export default async () => callCron("/api/cron/retry-settlements");

export const config: Config = {
  schedule: "*/15 * * * *",
};
