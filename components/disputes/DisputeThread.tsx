"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DisputeEvidence, DisputeMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  sendDisputeMessageFormAction,
  uploadDisputeEvidenceFormAction,
} from "@/modules/disputes/actions";

type DisputeThreadProps = {
  disputeId: string;
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
  canReply: boolean;
};

export function DisputeThread({ disputeId, messages, evidence, canReply }: DisputeThreadProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");

  function sendMessage() {
    if (!message.trim()) return;
    startTransition(async () => {
      await sendDisputeMessageFormAction(disputeId, message.trim());
      setMessage("");
      router.refresh();
    });
  }

  function uploadEvidence() {
    if (!evidenceUrl.trim()) return;
    startTransition(async () => {
      await uploadDisputeEvidenceFormAction({
        disputeId,
        fileUrl: evidenceUrl.trim(),
        description: evidenceDesc.trim() || undefined,
      });
      setEvidenceUrl("");
      setEvidenceDesc("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <div className="mt-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted">
                {m.sender_role} · {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-white">{m.message}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
        </div>
        {canReply && (
          <div className="mt-4 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" onClick={sendMessage} disabled={pending}>
              Send
            </Button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Evidence</h2>
        <ul className="mt-4 space-y-2">
          {evidence.map((e) => (
            <li key={e.id}>
              <a href={e.file_url} className="text-gold hover:underline" target="_blank" rel="noreferrer">
                {e.description ?? e.file_url}
              </a>
            </li>
          ))}
        </ul>
        {canReply && (
          <div className="mt-4 space-y-2">
            <input
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="Evidence file URL"
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
            />
            <input
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" variant="ghost" onClick={uploadEvidence} disabled={pending}>
              Upload evidence
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
