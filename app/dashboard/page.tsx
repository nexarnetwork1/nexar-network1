import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/redirect";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(commerceAuthHref({ auth: "signin", redirect: "/dashboard" }));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_completed) {
    redirect("/auth/complete-profile");
  }

  redirect(getDashboardPath(profile.role));
}
