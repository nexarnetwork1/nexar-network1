import "server-only";

import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { publishDomainEvent } from "@/domains";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { BCRYPT_ROUNDS_HQ } from "./constants";
import {
  getBootstrapState,
  getPlatformOwnerByEmail,
  insertPlatformOwner,
  markBootstrapComplete,
  seedDefaultWebsitePages,
} from "./repository";
import { HQ_WEBSITE_PAGE_KEYS, NEXAR_NETWORK_BUSINESS } from "./types";

export type BootstrapWizardInput = {
  email: string;
  password: string;
  fullName?: string;
};

/**
 * One-time platform initialization via Platform Owner Wizard.
 * Password is bcrypt-hashed immediately — never stored plaintext.
 * Idempotent when bootstrap already completed.
 */
export async function runPlatformOwnerWizard(
  input: BootstrapWizardInput,
): Promise<{
  bootstrapped: boolean;
  alreadyComplete: boolean;
  platformOwnerUserId: string | null;
  nexarBusinessId: string | null;
}> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !email.includes("@")) {
    throw new Error("Valid owner email is required");
  }
  if (!password || password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    throw new Error("Server database is not configured");
  }

  const state = await getBootstrapState();
  if (state?.completed) {
    return {
      bootstrapped: false,
      alreadyComplete: true,
      platformOwnerUserId: state.platformOwnerUserId,
      nexarBusinessId: state.nexarBusinessId,
    };
  }

  let owner = await getPlatformOwnerByEmail(email);
  let userId = owner?.userId ?? null;

  if (!userId) {
    const { data: existingUser } = await admin
      .from("authjs_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser?.id) {
      userId = existingUser.id as string;
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS_HQ);
      await admin
        .from("authjs_users")
        .update({
          password: passwordHash,
          emailVerified: new Date().toISOString(),
          name: input.fullName ?? "NEXAR Platform Owner",
        })
        .eq("id", userId);
    } else {
      userId = randomUUID();
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS_HQ);

      const { error: userError } = await admin.from("authjs_users").insert({
        id: userId,
        email,
        name: input.fullName ?? "NEXAR Platform Owner",
        password: passwordHash,
        emailVerified: new Date().toISOString(),
      });
      if (userError) {
        throw new Error(`HQ bootstrap user: ${userError.message}`);
      }
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: input.fullName ?? "NEXAR Platform Owner",
      role: "platform_owner",
      profile_completed: true,
    });
    if (profileError) {
      const { error: retry } = await admin.from("profiles").upsert({
        id: userId,
        email,
        full_name: input.fullName ?? "NEXAR Platform Owner",
        role: "super_admin",
        profile_completed: true,
      });
      if (retry) {
        throw new Error(`HQ bootstrap profile: ${profileError.message}`);
      }
      await admin
        .from("profiles")
        .update({ role: "platform_owner" })
        .eq("id", userId);
    }

    const existingOwner = await getPlatformOwnerByEmail(email);
    owner =
      existingOwner ??
      (await insertPlatformOwner({ userId: userId!, email }));
  }

  let businessId = state?.nexarBusinessId ?? null;
  if (!businessId) {
    const { data: existingBiz } = await admin
      .from("businesses")
      .select("id")
      .eq("slug", NEXAR_NETWORK_BUSINESS.slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingBiz?.id) {
      businessId = existingBiz.id as string;
    } else {
      const { createBusinessForUser } = await import(
        "@/modules/business-hub/service"
      );
      const business = await createBusinessForUser(userId!, {
        legalName: NEXAR_NETWORK_BUSINESS.legalName,
        displayName: NEXAR_NETWORK_BUSINESS.displayName,
        slug: NEXAR_NETWORK_BUSINESS.slug,
        businessType: "platform",
      });
      businessId = business.id;
      await admin
        .from("businesses")
        .update({
          metadata: {
            source: "nexar_hq_bootstrap",
            isPlatformBusiness: true,
          },
        })
        .eq("id", businessId);
    }
  }

  let workspaceId = state?.nexarWorkspaceId ?? null;
  try {
    const { ensureBusinessConnect } = await import(
      "@/modules/atlas-connect/service"
    );
    const ws = await ensureBusinessConnect({
      businessId: businessId!,
      ownerUserId: userId!,
      displayName: "NEXAR NETWORK",
      slug: "nexar-network",
    });
    workspaceId = ws.id;
  } catch {
    /* non-fatal */
  }

  await seedDefaultWebsitePages(
    HQ_WEBSITE_PAGE_KEYS.map((key) => ({
      slug: key.replace(/_/g, "-"),
      title: key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      path: key === "home" ? "/" : `/${key.replace(/_/g, "-")}`,
      pageType: key.startsWith("email") ? "email" : "marketing",
    })),
  );

  await markBootstrapComplete({
    platformOwnerUserId: userId!,
    nexarBusinessId: businessId!,
    nexarWorkspaceId: workspaceId,
    metadata: {
      email,
      hqEnabled: true,
      passwordHashed: true,
      mustChangePassword: true,
      mustEnable2fa: true,
      wizard: true,
    },
  });

  await publishDomainEvent({
    id: randomUUID(),
    name: "hq.bootstrapped",
    occurredAt: new Date(),
    actorId: userId,
    businessId,
    payload: {
      platformOwnerUserId: userId,
      nexarBusinessId: businessId,
      nexarWorkspaceId: workspaceId,
    },
    correlationId: randomUUID(),
  });

  return {
    bootstrapped: true,
    alreadyComplete: false,
    platformOwnerUserId: userId,
    nexarBusinessId: businessId,
  };
}

/**
 * @deprecated Auto-bootstrap without wizard credentials is removed.
 * Use runPlatformOwnerWizard from /admin/setup.
 */
export async function ensureNexarHqBootstrap(): Promise<{
  bootstrapped: boolean;
  alreadyComplete: boolean;
  platformOwnerUserId: string | null;
  nexarBusinessId: string | null;
}> {
  const state = await getBootstrapState();
  if (state?.completed) {
    return {
      bootstrapped: false,
      alreadyComplete: true,
      platformOwnerUserId: state.platformOwnerUserId,
      nexarBusinessId: state.nexarBusinessId,
    };
  }
  return {
    bootstrapped: false,
    alreadyComplete: false,
    platformOwnerUserId: null,
    nexarBusinessId: null,
  };
}
