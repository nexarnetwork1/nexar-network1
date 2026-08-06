/**
 * ATLAS Connect — security contracts.
 * Encrypted-ready messages/files, audit, device/session history,
 * spam detection hooks, malware scan status, permission audit.
 */

export type ConnectMalwareScanStatus =
  | "pending"
  | "clean"
  | "infected"
  | "error"
  | "skipped";

export type ConnectEncryptionState = {
  isEncrypted: boolean;
  encryptionKeyId: string | null;
};

export type ConnectSpamSignal = {
  messageBody: string | null;
  senderUserId: string | null;
  recentMessageCount?: number;
  linkCount?: number;
};

export type ConnectSpamAssessment = {
  isSpam: boolean;
  score: number;
  reasons: string[];
};

export type ConnectPermissionAuditEntry = {
  actorUserId: string;
  permission: string;
  granted: boolean;
  workspaceId: string;
  resourceType?: string;
  resourceId?: string;
  occurredAt: string;
};

/** Heuristic spam scoring — foundation only; ML plugs in later. */
export function assessMessageSpam(signal: ConnectSpamSignal): ConnectSpamAssessment {
  const reasons: string[] = [];
  let score = 0;
  const body = signal.messageBody ?? "";

  if (/(viagra|crypto airdrop|double your|click here now)/i.test(body)) {
    score += 0.7;
    reasons.push("Known spam phrases");
  }
  const links = signal.linkCount ?? (body.match(/https?:\/\//gi)?.length ?? 0);
  if (links >= 3) {
    score += 0.25;
    reasons.push("Excessive links");
  }
  if ((signal.recentMessageCount ?? 0) > 40) {
    score += 0.2;
    reasons.push("Burst sending");
  }
  if (!signal.senderUserId) {
    score += 0.05;
    reasons.push("Anonymous sender");
  }

  return {
    isSpam: score >= 0.6,
    score: Math.min(1, score),
    reasons,
  };
}

export function encryptionReadyDefaults(): ConnectEncryptionState {
  return { isEncrypted: false, encryptionKeyId: null };
}

export function buildPermissionAuditEntry(input: {
  actorUserId: string;
  permission: string;
  granted: boolean;
  workspaceId: string;
  resourceType?: string;
  resourceId?: string;
}): ConnectPermissionAuditEntry {
  return {
    ...input,
    occurredAt: new Date().toISOString(),
  };
}

/** Whether malware scan status blocks download/share. */
export function isAttachmentSafeToShare(status: ConnectMalwareScanStatus): boolean {
  return status === "clean" || status === "skipped";
}
