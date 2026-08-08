"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  revokeSessionAction,
  revokeOtherSessionsAction,
} from "@/modules/auth/actions";
import { Button } from "@/components/ui/Button";
import type { UserSessionRecord } from "@/modules/auth/session";

type ActiveSessionsPanelProps = {
  sessions: UserSessionRecord[];
};

function formatAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Mobile")) return "Mobile browser";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return ua.slice(0, 48);
}

export function ActiveSessionsPanel({ sessions }: ActiveSessionsPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function revokeOne(sessionId: string) {
    setLoadingId(sessionId);
    setError(null);
    const result = await revokeSessionAction(sessionId);
    if (!result.success) {
      setError(result.error ?? "Could not revoke session");
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  async function revokeOthers() {
    setLoadingId("all");
    setError(null);
    const result = await revokeOtherSessionsAction();
    if (!result.success) {
      setError(result.error ?? "Could not revoke sessions");
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted">No active sessions recorded.</p>;
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <ul className="space-y-3">
        {sessions.map((session, index) => (
          <li
            key={session.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">
                {formatAgent(session.user_agent)}
                {index === 0 && (
                  <span className="ml-2 text-xs text-success">Current</span>
                )}
              </p>
              <p className="text-xs text-muted">
                {session.ip_address ? String(session.ip_address) : "Unknown IP"} ·{" "}
                {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loadingId === session.id}
                onClick={() => revokeOne(session.id)}
              >
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>

      {sessions.length > 1 && (
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          disabled={loadingId === "all"}
          onClick={revokeOthers}
        >
          Sign out other devices
        </Button>
      )}
    </div>
  );
}
