import { z } from "zod";

export const tickerAnnouncementSchema = z
  .object({
    message: z.string().trim().min(1, "Message is required").max(500),
    isEnabled: z.boolean().default(true),
    priority: z.coerce.number().int().min(0).max(100).default(0),
    startsAt: z.string().optional().nullable(),
    endsAt: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return new Date(data.startsAt) <= new Date(data.endsAt);
    },
    { message: "End date must be after start date", path: ["endsAt"] }
  );

export const reorderTickerSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export type TickerAnnouncementInput = z.infer<typeof tickerAnnouncementSchema>;
