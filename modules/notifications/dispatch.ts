import { createNotification } from "./repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationsConfig } from "@/config/notifications";
import type { NotificationType } from "@/types";

type DispatchParams = {
  event: string;
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
  email?: { to: string; subject?: string };
};

export async function isChannelEnabled(
  userId: string,
  channel: string,
  eventType: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("event_type", eventType)
    .maybeSingle();

  if (!data) return true;
  return data.enabled;
}

export async function dispatchNotification(params: DispatchParams): Promise<void> {
  const inAppEnabled = await isChannelEnabled(params.userId, "in_app", params.event);

  if (inAppEnabled && notificationsConfig.activeChannels.includes("in_app")) {
    await createNotification({
      userId: params.userId,
      type: params.type ?? "system",
      title: params.title,
      body: params.body,
      metadata: { event: params.event, ...params.metadata },
    }).catch(() => undefined);
  }

  if (params.email && notificationsConfig.activeChannels.includes("email")) {
    const emailEnabled = await isChannelEnabled(params.userId, "email", params.event);
    if (emailEnabled) {
      const { sendEmail } = await import("@/lib/email/send");
      await sendEmail({
        to: params.email.to,
        subject: params.email.subject ?? params.title,
        html: `<p>${params.body}</p>`,
      }).catch(() => undefined);
    }
  }
}

export async function dispatchBulkNotification(
  userIds: string[],
  params: Omit<DispatchParams, "userId">
): Promise<void> {
  await Promise.all(userIds.map((userId) => dispatchNotification({ ...params, userId })));
}
