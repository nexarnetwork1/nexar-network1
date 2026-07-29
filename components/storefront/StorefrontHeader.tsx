"use client";

import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, Heart, Package, Star, Users } from "lucide-react";
import { toggleFollowStoreAction } from "@/modules/marketplace/storefront/actions";
import type { StorefrontStore } from "@/modules/marketplace/storefront/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type StorefrontHeaderProps = {
  store: StorefrontStore;
  description?: string | null;
};

export function StorefrontHeader({ store, description }: StorefrontHeaderProps) {
  const profile = store.settings?.marketplace_profile ?? {};
  const banner = profile.banner_url ?? store.branding?.banner_url;
  const primary = profile.primary_color ?? store.branding?.primary_color ?? "#D4AF37";

  return (
    <header className="relative overflow-hidden rounded-3xl border border-border/70">
      <div
        className="h-48 bg-cover bg-center sm:h-64 lg:h-72"
        style={{
          backgroundColor: profile.secondary_color ?? "#0b0b0b",
          backgroundImage: banner ? `url(${banner})` : undefined,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="relative px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-background bg-surface sm:h-24 sm:w-24">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-gold">
                  {store.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                  {store.name}
                </h1>
                {store.is_verified && (
                  <BadgeCheck className="h-5 w-5 text-gold" aria-label="Verified store" />
                )}
              </div>
              <p className="mt-1 text-sm text-muted">@{store.slug}</p>
            </div>
          </div>
          <FollowButton storeId={store.id} initialFollowing={store.is_following} primaryColor={primary} />
        </div>

        {description ? (
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          <Stat icon={Star} label="Rating" value={store.trust?.avg_rating?.toFixed(1) ?? "0.0"} />
          <Stat icon={Users} label="Followers" value={String(store.follower_count)} live={store.id} />
          <Stat icon={Package} label="Products" value={String(store.product_count)} />
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  live,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  live?: string;
}) {
  const [liveCount, setLiveCount] = useState<string | null>(null);
  const display = live && liveCount != null ? liveCount : value;

  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`store-followers-${live}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_followers", filter: `store_id=eq.${live}` },
        async () => {
          const { count: c } = await supabase
            .from("store_followers")
            .select("*", { count: "exact", head: true })
            .eq("store_id", live);
          setLiveCount(String(c ?? 0));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [live]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 px-3 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-gold" />
      <p className="mt-1 font-mono text-lg text-white">{display}</p>
      <p className="text-[10px] tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

function FollowButton({
  storeId,
  initialFollowing,
  primaryColor,
}: {
  storeId: string;
  initialFollowing: boolean;
  primaryColor: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleFollowStoreAction(storeId);
          if (result.success && result.following != null) setFollowing(result.following);
        })
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all",
        following
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-border text-white hover:border-gold/30",
      )}
      style={!following ? { backgroundColor: primaryColor, color: "#050505", borderColor: primaryColor } : undefined}
    >
      <Heart className={cn("h-4 w-4", following && "fill-current")} />
      {following ? "Following" : "Follow store"}
    </button>
  );
}
