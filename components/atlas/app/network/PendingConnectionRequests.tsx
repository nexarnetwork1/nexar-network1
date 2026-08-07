"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { NetworkConnection, NetworkProfile } from "@/modules/atlas-network/types";
import {
  acceptConnectionAction,
  declineConnectionAction,
  fetchPendingConnectionsAction,
} from "@/modules/atlas-network/actions";

type PendingRequest = NetworkConnection & { requester?: NetworkProfile | null };

export function PendingConnectionRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchPendingConnectionsAction();
        setRequests(data);
      } catch {
        setRequests([]);
      } finally {
        setLoaded(true);
      }
    });
  }, []);

  const handleAccept = (connectionId: string) => {
    startTransition(async () => {
      try {
        await acceptConnectionAction({ connectionId });
        setRequests((prev) => prev.filter((r) => r.id !== connectionId));
        toast.success("Connection accepted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  const handleDecline = (connectionId: string) => {
    startTransition(async () => {
      try {
        await declineConnectionAction({ connectionId });
        setRequests((prev) => prev.filter((r) => r.id !== connectionId));
        toast.success("Request declined");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  if (!loaded || requests.length === 0) return null;

  return (
    <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 space-y-3">
      <h3 className="font-semibold text-sm">Connection requests</h3>
      {requests.map((req) => (
        <div key={req.id} className="flex items-center gap-3">
          {req.requester ? (
            <Link href={`/atlas/network/${req.requester.slug}`} className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{req.requester.display_name}</p>
              {req.message && <p className="text-xs text-muted truncate">{req.message}</p>}
            </Link>
          ) : (
            <p className="flex-1 text-sm text-muted">Connection request</p>
          )}
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              disabled={pending}
              onClick={() => handleAccept(req.id)}
              className="px-2 py-1 rounded text-xs bg-gold text-background"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleDecline(req.id)}
              className="px-2 py-1 rounded text-xs border border-white/10"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
    </div>
  );
}
