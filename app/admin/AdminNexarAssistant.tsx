"use client";

import { NexarAssistant } from "@/components/assistant/NexarAssistant";

/** Global assistant on admin routes (admin layout is isolated from root AppProviders). */
export function AdminNexarAssistant() {
  return <NexarAssistant />;
}
