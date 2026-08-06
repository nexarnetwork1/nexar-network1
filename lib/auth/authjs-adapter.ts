import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";

type DbUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
  password?: string | null;
};

type DbAccount = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

type DbSession = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
};

function toAdapterUser(row: DbUser): AdapterUser & { password?: string | null } {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    emailVerified: row.emailVerified ? new Date(row.emailVerified) : null,
    image: row.image,
    password: row.password,
  };
}

/**
 * Auth.js adapter backed by Supabase service-role PostgREST against
 * public.authjs_* tables (same Postgres). Used when DATABASE_URL is unset;
 * PrismaAdapter is preferred when DATABASE_URL is configured.
 */
export function SupabaseAuthjsAdapter(): Adapter {
  const db = () => createAdminClient();

  return {
    async createUser(user) {
      const { data, error } = await db()
        .from("authjs_users")
        .insert({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          image: user.image,
        })
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "createUser failed");
      return toAdapterUser(data as DbUser);
    },

    async getUser(id) {
      const { data } = await db()
        .from("authjs_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return data ? toAdapterUser(data as DbUser) : null;
    },

    async getUserByEmail(email) {
      const { data } = await db()
        .from("authjs_users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      return data ? toAdapterUser(data as DbUser) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { data: account } = await db()
        .from("authjs_accounts")
        .select("userId")
        .eq("provider", provider)
        .eq("providerAccountId", providerAccountId)
        .maybeSingle();
      if (!account) return null;
      const { data: user } = await db()
        .from("authjs_users")
        .select("*")
        .eq("id", (account as { userId: string }).userId)
        .maybeSingle();
      return user ? toAdapterUser(user as DbUser) : null;
    },

    async updateUser(user) {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (user.name !== undefined) patch.name = user.name;
      if (user.email !== undefined) patch.email = user.email;
      if (user.emailVerified !== undefined) {
        patch.emailVerified = user.emailVerified?.toISOString() ?? null;
      }
      if (user.image !== undefined) patch.image = user.image;
      const { data, error } = await db()
        .from("authjs_users")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "updateUser failed");
      return toAdapterUser(data as DbUser);
    },

    async deleteUser(userId) {
      await db().from("authjs_users").delete().eq("id", userId);
    },

    async linkAccount(account) {
      const { error } = await db().from("authjs_accounts").insert({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token ?? null,
        access_token: account.access_token ?? null,
        expires_at: account.expires_at ?? null,
        token_type: account.token_type ?? null,
        scope: account.scope ?? null,
        id_token: account.id_token ?? null,
        session_state: account.session_state ?? null,
      });
      if (error) throw new Error(error.message);
      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db()
        .from("authjs_accounts")
        .delete()
        .eq("provider", provider)
        .eq("providerAccountId", providerAccountId);
    },

    async createSession(session) {
      const { data, error } = await db()
        .from("authjs_sessions")
        .insert({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        })
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "createSession failed");
      const row = data as DbSession;
      return {
        sessionToken: row.sessionToken,
        userId: row.userId,
        expires: new Date(row.expires),
      } satisfies AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const { data: session } = await db()
        .from("authjs_sessions")
        .select("*")
        .eq("sessionToken", sessionToken)
        .maybeSingle();
      if (!session) return null;
      const row = session as DbSession;
      if (new Date(row.expires) < new Date()) {
        await db().from("authjs_sessions").delete().eq("sessionToken", sessionToken);
        return null;
      }
      const { data: user } = await db()
        .from("authjs_users")
        .select("*")
        .eq("id", row.userId)
        .maybeSingle();
      if (!user) return null;
      return {
        session: {
          sessionToken: row.sessionToken,
          userId: row.userId,
          expires: new Date(row.expires),
        },
        user: toAdapterUser(user as DbUser),
      };
    },

    async updateSession(session) {
      const patch: Record<string, unknown> = {};
      if (session.expires) patch.expires = session.expires.toISOString();
      if (session.userId) patch.userId = session.userId;
      const { data, error } = await db()
        .from("authjs_sessions")
        .update(patch)
        .eq("sessionToken", session.sessionToken)
        .select("*")
        .single();
      if (error || !data) return null;
      const row = data as DbSession;
      return {
        sessionToken: row.sessionToken,
        userId: row.userId,
        expires: new Date(row.expires),
      };
    },

    async deleteSession(sessionToken) {
      await db().from("authjs_sessions").delete().eq("sessionToken", sessionToken);
    },

    async createVerificationToken(token) {
      const { data, error } = await db()
        .from("authjs_verification_tokens")
        .insert({
          identifier: token.identifier,
          token: token.token,
          expires: token.expires.toISOString(),
        })
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "createVerificationToken failed");
      const row = data as {
        identifier: string;
        token: string;
        expires: string;
      };
      return {
        identifier: row.identifier,
        token: row.token,
        expires: new Date(row.expires),
      } satisfies VerificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const { data } = await db()
        .from("authjs_verification_tokens")
        .select("*")
        .eq("identifier", identifier)
        .eq("token", token)
        .maybeSingle();
      if (!data) return null;
      await db()
        .from("authjs_verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token);
      const row = data as { identifier: string; token: string; expires: string };
      return {
        identifier: row.identifier,
        token: row.token,
        expires: new Date(row.expires),
      };
    },
  };
}

export async function setUserPassword(userId: string, passwordHash: string) {
  const { error } = await createAdminClient()
    .from("authjs_users")
    .update({ password: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function getUserPasswordHash(email: string): Promise<{
  id: string;
  password: string | null;
  emailVerified: string | null;
  name: string | null;
  email: string;
} | null> {
  const { data } = await createAdminClient()
    .from("authjs_users")
    .select("id, password, emailVerified, name, email")
    .eq("email", email)
    .maybeSingle();
  if (!data?.email) return null;
  return data as {
    id: string;
    password: string | null;
    emailVerified: string | null;
    name: string | null;
    email: string;
  };
}
