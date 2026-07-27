import { createHash, randomBytes } from "crypto";
import { publicApiConfig, type ApiScope } from "@/config/public-api";

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = randomBytes(24).toString("hex");
  const key = `${publicApiConfig.keyPrefix}${raw}`;
  const prefix = key.slice(0, 12);
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

export function validateApiScopes(requested: string[], allowed: ApiScope[]): boolean {
  return requested.every((scope) => allowed.includes(scope as ApiScope));
}

export { publicApiConfig };
