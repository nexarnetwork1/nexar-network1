import type { Config } from "@netlify/functions";
import { callCron } from "./lib/call-cron";

export default async () => callCron("/api/cron/retry-settlements");

export const config: Config = {
  schedule: "*/15 * * * *",
};
