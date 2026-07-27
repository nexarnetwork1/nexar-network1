export type CronAuthResult =
  | { authorized: true }
  | { authorized: false; status: 401 };

export function verifyCronSecret(
  request: Request,
  secret = process.env.CRON_SECRET
): CronAuthResult {
  if (!secret) {
    return { authorized: false, status: 401 };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return { authorized: false, status: 401 };
  }

  return { authorized: true };
}

export function cronUnauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
