import { z } from "zod";

export const cryptoPaymentMethods = ["NXR", "BNB", "USDT"] as const;
export const paymentMethods = [...cryptoPaymentMethods, "card"] as const;

export type CryptoPaymentMethod = (typeof cryptoPaymentMethods)[number];
export type PaymentMethodCode = (typeof paymentMethods)[number];

export const initiatePaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  method: z.enum(paymentMethods, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
});

export const verifyPaymentSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
