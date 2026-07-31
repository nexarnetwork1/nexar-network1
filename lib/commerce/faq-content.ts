import { merchantCommerceConfig } from "@/config/merchant-commerce";
import { platformFeesConfig } from "@/config/platform-fees";
import { formatPlatformFeePercent } from "@/lib/commerce/payment-fees";
import type { CommerceFaqItem } from "@/lib/commerce/types";

const { storeCreation, subscription } = merchantCommerceConfig;

export const COMMERCE_FAQ_ITEMS: CommerceFaqItem[] = [
  {
    id: "create-store",
    question: "How do I create a store on Nexar Commerce?",
    answer:
      "Choose Create Account in the Nexar Commerce sign-in popup and select Merchant. Complete onboarding with your business details, upload branding, add products, and connect your wallet. Once your store is approved, it appears in the marketplace directory.",
  },
  {
    id: "store-price",
    question: "What does store creation cost?",
    answer: `Store creation is a one-time ${storeCreation.amountUsd} ${storeCreation.currency} activation fee. This unlocks your merchant dashboard, catalog tools, order management, and marketplace listing capabilities.`,
  },
  {
    id: "subscriptions",
    question: "What subscription plans are available for merchants?",
    answer: `Merchants can choose a ${subscription.monthly.label.toLowerCase()} plan at $${subscription.monthly.amountUsd}/${subscription.monthly.currency} per month or a ${subscription.yearly.label.toLowerCase()} plan at $${subscription.yearly.amountUsd}/${subscription.yearly.currency} per year (${subscription.yearly.description.toLowerCase()}). Both plans include full dashboard access, analytics, and payment tools.`,
  },
  {
    id: "payment-methods",
    question: "Which payment methods can customers use at checkout?",
    answer:
      "Customers can pay with NXR, major stablecoins and crypto assets (USDT, USDC, BNB, ETH, BTC), or card where enabled. All methods settle through Nexar Commerce with transparent platform fees shown before payment confirmation.",
  },
  {
    id: "wallets",
    question: "Which wallets are supported?",
    answer:
      "Nexar Commerce supports MetaMask, Trust Wallet, Binance Wallet, and WalletConnect-compatible wallets on BNB Smart Chain. Connect your wallet during sign-in or at checkout to pay with crypto or receive merchant payouts.",
  },
  {
    id: "merchant-fees",
    question: "What are the merchant platform fees?",
    answer: `NXR payments carry a ${formatPlatformFeePercent("NXR")} platform fee. Other supported crypto payments are ${formatPlatformFeePercent("USDT")}. Card payments are ${platformFeesConfig.cardFeePercent}%. Fees are calculated automatically at checkout with a minimum of $${platformFeesConfig.minFeeAmount} ${platformFeesConfig.currency} when applicable.`,
  },
  {
    id: "checkout",
    question: "How does customer checkout work?",
    answer:
      "Add items to your cart from any marketplace store, review totals and fees, then sign in or create a customer account. Choose your payment method, connect a wallet if paying with crypto, and confirm. You receive an order confirmation and can track status from your customer dashboard.",
  },
  {
    id: "orders",
    question: "What is the order process after purchase?",
    answer:
      "After checkout, the merchant is notified and prepares fulfillment. Order status updates appear in your customer account under Orders. Merchants manage fulfillment, shipping or digital delivery, and refunds from their dashboard. Support notifications keep both parties informed throughout the lifecycle.",
  },
];
