export { env, isProduction, isDevelopment, type AppEnvironment } from "./env";
export { supabaseConfig } from "./supabase";
export { authConfig, type AuthProvider } from "./auth";
export { walletConfig } from "./wallet";
export { treasuryConfig } from "./treasury";
export { blockchainConfig } from "./blockchain";
export { paymentsConfig, type PaymentMethodType } from "./payments";
export { exchangeRatesConfig } from "./exchange-rates";
export { platformFeesConfig } from "./platform-fees";
export { merchantPromotionsConfig } from "./merchant-promotions";
export { securityConfig } from "./security";
export { loggingConfig, type LogLevel } from "./logging";
export { emailConfig, type EmailTemplate } from "./email";
export { notificationsConfig, type NotificationChannel } from "./notifications";

export const appConfig = {
  name: "Nexar Network",
  version: "0.1.0",
  supportEmail: "support@nexarnetwork.com",
} as const;
