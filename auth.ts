import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { SupabaseAuthjsAdapter } from "@/lib/auth/authjs-adapter";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export type AppSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: UserRole;
  profileCompleted?: boolean;
  emailVerified?: Date | null;
};

function resolveAdapter(): Adapter {
  if (process.env.DATABASE_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
      const prisma = new PrismaClient();
      return PrismaAdapter(prisma) as Adapter;
    } catch {
      // Fall through to REST adapter
    }
  }
  return SupabaseAuthjsAdapter();
}

async function loadProfile(userId: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", userId)
    .maybeSingle();
  return data as { role: UserRole; profile_completed: boolean } | null;
}

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET);

const githubConfigured =
  Boolean(process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID) &&
  Boolean(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET);

async function ensureOAuthProfile(user: {
  id?: string;
  email?: string | null;
  name?: string | null;
}) {
  if (!user.email || !user.id) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!existing) {
    await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.name,
      role: "customer",
      profile_completed: false,
    });
  }
  await admin
    .from("authjs_users")
    .update({
      emailVerified: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .is("emailVerified", null);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: resolveAdapter(),
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/marketplace",
    error: "/marketplace",
    verifyRequest: "/verify-email",
    newUser: "/auth/complete-profile",
  },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID!,
            clientSecret:
              process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(githubConfigured
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID!,
            clientSecret:
              process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        (account?.provider === "google" || account?.provider === "github") &&
        user.email &&
        user.id
      ) {
        await ensureOAuthProfile(user);
      }
      return true;
    },
    async session({ session, user }) {
      const profile = await loadProfile(user.id);
      const appUser = session.user as AppSessionUser;
      appUser.id = user.id;
      appUser.role = profile?.role ?? "customer";
      appUser.profileCompleted = profile?.profile_completed ?? false;
      appUser.emailVerified = user.emailVerified;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!existing) {
        await admin.from("profiles").insert({
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: "customer",
          profile_completed: false,
        });
      }
    },
  },
});
