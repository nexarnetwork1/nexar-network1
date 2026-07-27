import { listUserSessions } from "@/modules/auth/session";
import { ActiveSessionsPanel } from "./ActiveSessionsPanel";

export async function ActiveSessionsSection() {
  const sessions = await listUserSessions();
  return <ActiveSessionsPanel sessions={sessions} />;
}
