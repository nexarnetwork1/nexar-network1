"use client";

import { useState, useTransition } from "react";
import { Loader2, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  requestConnectionAction,
  acceptConnectionAction,
  declineConnectionAction,
  removeConnectionAction,
} from "@/modules/atlas-network/actions";
import type { NetworkConnectionStatus } from "@/modules/atlas-network/types";

type ConnectButtonProps = {
  targetProfileId: string;
  connectionStatus: NetworkConnectionStatus | null;
  pendingConnectionId?: string | null;
  isOwner?: boolean;
  isIncomingPending?: boolean;
  session: boolean;
  onAuth: () => void;
  className?: string;
};

export function ConnectButton({
  targetProfileId,
  connectionStatus,
  pendingConnectionId,
  isOwner,
  isIncomingPending,
  session,
  onAuth,
  className,
}: ConnectButtonProps) {
  const [status, setStatus] = useState(connectionStatus);
  const [connectionId, setConnectionId] = useState(pendingConnectionId);
  const [pending, startTransition] = useTransition();

  if (isOwner) return null;

  const handleConnect = () => {
    if (!session) return onAuth();
    startTransition(async () => {
      try {
        await requestConnectionAction({
          recipientProfileId: targetProfileId,
          connectionKind: "professional",
        });
        setStatus("pending");
        toast.success("Connection request sent");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Request failed");
      }
    });
  };

  const handleAccept = () => {
    if (!connectionId) return;
    startTransition(async () => {
      try {
        await acceptConnectionAction({ connectionId });
        setStatus("accepted");
        toast.success("Connection accepted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to accept");
      }
    });
  };

  const handleDecline = () => {
    if (!connectionId) return;
    startTransition(async () => {
      try {
        await declineConnectionAction({ connectionId });
        setStatus("declined");
        toast.success("Request declined");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to decline");
      }
    });
  };

  const handleRemove = () => {
    if (!connectionId) return;
    startTransition(async () => {
      try {
        await removeConnectionAction({ connectionId });
        setStatus(null);
        setConnectionId(null);
        toast.success("Connection removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove");
      }
    });
  };

  if (status === "accepted") {
    return (
      <button
        type="button"
        disabled={pending || !connectionId}
        onClick={handleRemove}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-success/30 bg-success/10 text-success text-sm hover:bg-success/15 disabled:opacity-60",
          className,
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
        Connected
      </button>
    );
  }

  if (status === "pending" && isIncomingPending && connectionId) {
    return (
      <div className={cn("flex gap-2", className)}>
        <button
          type="button"
          disabled={pending}
          onClick={handleAccept}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-background text-sm font-medium"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDecline}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm"
        >
          <UserX className="h-4 w-4" />
          Decline
        </button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-muted text-sm", className)}>
        <Clock className="h-4 w-4" />
        Pending
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleConnect}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10 disabled:opacity-60",
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
      Connect
    </button>
  );
}
