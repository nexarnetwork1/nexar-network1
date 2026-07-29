import { z } from "zod";
import { notificationsConfig } from "@/config/notifications";
import { customerNotificationEvents } from "@/config/customer-notifications";

const customerEventTypes = customerNotificationEvents.map((item) => item.event) as [
  string,
  ...string[],
];

export const updateNotificationPreferenceSchema = z.object({
  channel: z.enum(notificationsConfig.channels),
  eventType: z.enum(customerEventTypes),
  enabled: z.boolean(),
});

export type UpdateNotificationPreferenceInput = z.infer<
  typeof updateNotificationPreferenceSchema
>;
