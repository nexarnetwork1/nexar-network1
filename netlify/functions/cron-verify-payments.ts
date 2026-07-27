import type { Config } from "@netlify/functions";
import { callCron } from "./lib/call-cron";

export default async () => callCron("/api/cron/verify-payments");

export const config: Config = {
  schedule: "*/2 * * * *",
};
