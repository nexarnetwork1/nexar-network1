import { describe, expect, it } from "vitest";
import {
  NXR_CONSUMES,
  NXR_EVENT_HANDLERS,
  NXR_UTILITIES,
  LOYALTY_TIER_THRESHOLDS,
} from "@/modules/atlas-nxr/types";
import {
  applyTransfer,
  applyDebit,
  convertNxrToFiat,
  checkRateLimit,
} from "@/modules/atlas-nxr/ledger";
import {
  computeRewardAmount,
  resolveLoyaltyTier,
  computeCashback,
} from "@/modules/atlas-nxr/rewards";
import {
  buildSubscriptionIntent,
  buildMarketplaceIntent,
  buildAiCreditIntent,
  developerRevenueShare,
  DEFAULT_PREMIUM_PRICES,
} from "@/modules/atlas-nxr/billing";
import {
  createEmptyBlockchainRegistry,
  assertBlockchainOptional,
} from "@/modules/atlas-nxr/blockchain-adapters";
import {
  ensureNxrAccountSchema,
  transferNxrSchema,
  payWithNxrSchema,
} from "@/modules/atlas-nxr/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_NXR_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS NXR bounded context", () => {
  it("thickens nxrToken as digital economy", () => {
    expect(BOUNDED_CONTEXTS.nxrToken.id).toBe("nxr_token");
    expect(BOUNDED_CONTEXTS.nxrToken.atlasModule).toBe("nxr");
    expect(BOUNDED_CONTEXTS.nxrToken.owns).toContain("NxrTransaction");
    expect(BOUNDED_CONTEXTS.nxrToken.owns).toContain("NxrReward");
  });

  it("never owns fiat Wallet masters", () => {
    expect(ownerOf("Wallet")).toBe("wallet");
    expect(ownerOf("LedgerEntry")).toBe("wallet");
    expect(ownerOf("NxrTransaction")).toBe("nxrToken");
    expect(ownerOf("NxrLoyaltyAccount")).toBe("nxrToken");
    expect(NXR_CONSUMES).toContain("Wallet");
  });

  it("declares NXR module as digital_economy without blockchain requirement", () => {
    expect(ATLAS_NXR_MODULE.role).toBe("digital_economy");
    expect(ATLAS_NXR_MODULE.blockchainRequired).toBe(false);
    expect(ATLAS_NXR_MODULE.internalModulePath).toBe("modules/atlas-nxr");
    expect(ATLAS_NXR_MODULE.chainAdapters).toContain("ethereum");
  });

  it("maps nxr nav to nxrToken", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "nxr");
    expect(m?.boundedContext).toBe("nxrToken");
    expect(m?.status).toBe("foundation");
  });
});

describe("ATLAS NXR ledger & rewards", () => {
  it("applies transfers and rejects insufficient balance", () => {
    const ok = applyTransfer({ fromBalance: 100, toBalance: 10, amount: 25 });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.fromNext).toBe(75);
      expect(ok.toNext).toBe(35);
    }
    expect(applyDebit(5, 10).ok).toBe(false);
    expect(convertNxrToFiat(10, 0.1)).toBe(1);
    expect(
      checkRateLimit({
        count: 10,
        amountTotal: 0,
        maxCount: 10,
        maxAmount: 1000,
        nextAmount: 1,
      }).allowed,
    ).toBe(false);
  });

  it("computes rewards and loyalty tiers", () => {
    const reward = computeRewardAmount(
      {
        code: "marketplace_purchase",
        kind: "marketplace",
        amount: 0,
        percentOfAmount: 0.01,
        maxPerUser: null,
        isActive: true,
      },
      200,
    );
    expect(reward?.amount).toBe(2);
    expect(resolveLoyaltyTier(600)).toBe("gold");
    expect(computeCashback(100, 0.005)).toBe(0.5);
    expect(LOYALTY_TIER_THRESHOLDS.some((t) => t.tier === "enterprise")).toBe(
      true,
    );
  });

  it("builds optional billing intents", () => {
    expect(buildSubscriptionIntent({ planCode: "pro", amountNxr: 50 }).optional).toBe(
      true,
    );
    expect(buildMarketplaceIntent({ orderId: "o1", amountNxr: 20 }).utility).toBe(
      "marketplace",
    );
    expect(buildAiCreditIntent({ credits: 10 }).amountNxr).toBe(10);
    expect(developerRevenueShare({ grossNxr: 100 }).developer).toBe(70);
    expect(DEFAULT_PREMIUM_PRICES.verified_badge).toBe(50);
    expect(NXR_UTILITIES).toContain("ai_credits");
  });

  it("keeps blockchain adapters empty and optional", () => {
    const registry = createEmptyBlockchainRegistry();
    expect(registry.ethereum).toBeUndefined();
    expect(() =>
      assertBlockchainOptional(false, registry, "ethereum"),
    ).toThrow(/disabled/);
  });
});

describe("ATLAS NXR validators, events, permissions", () => {
  it("validates account and transfer inputs", () => {
    expect(() =>
      ensureNxrAccountSchema.parse({
        kind: "personal",
        userId: "00000000-0000-4000-8000-000000000001",
      }),
    ).not.toThrow();
    expect(() =>
      transferNxrSchema.parse({
        fromAccountId: "00000000-0000-4000-8000-000000000001",
        toAccountId: "00000000-0000-4000-8000-000000000002",
        amount: 5,
      }),
    ).not.toThrow();
    expect(() =>
      payWithNxrSchema.parse({
        payerAccountId: "00000000-0000-4000-8000-000000000001",
        amount: 10,
        utility: "subscription",
      }),
    ).not.toThrow();
  });

  it("catalogs nxr domain events", () => {
    expect(DOMAIN_EVENTS).toContain("nxr.wallet_created");
    expect(DOMAIN_EVENTS).toContain("nxr.token_transferred");
    expect(DOMAIN_EVENTS).toContain("nxr.reward_granted");
    expect(DOMAIN_EVENTS).toContain("nxr.subscription_paid");
    expect(DOMAIN_EVENTS).toContain("nxr.premium_activated");
  });

  it("registers provision and reward handlers", () => {
    expect(NXR_EVENT_HANDLERS["business.created"].action).toBe("provision");
    expect(NXR_EVENT_HANDLERS["order.paid"].action).toBe("reward");
    expect(NXR_EVENT_HANDLERS["business.verification_approved"]).toBeDefined();
  });

  it("grants nxr permissions to customer and merchant", () => {
    expect(
      hasPermission(permissionsForPlatformRole("customer"), "nxr:pay"),
    ).toBe(true);
    expect(
      hasPermission(permissionsForPlatformRole("merchant"), "nxr:account:manage"),
    ).toBe(true);
  });
});
