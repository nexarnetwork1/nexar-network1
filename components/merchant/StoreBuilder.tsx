"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveStoreBuilderAction } from "@/modules/stores/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { Store, StoreSettings } from "@/types";
import type { StoreBranding } from "@/modules/marketplace/storefront/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  store: Store;
  settings: StoreSettings;
  branding: StoreBranding | null;
};

const TABS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "social", label: "Social" },
  { id: "policies", label: "Policies" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StoreBuilder({ store, settings, branding }: Props) {
  const profile = settings.marketplace_profile ?? {};
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("general");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [preview, setPreview] = useState({
    primaryColor: profile.primary_color ?? branding?.primary_color ?? "#FFD15C",
    secondaryColor: profile.secondary_color ?? branding?.secondary_color ?? "#1a1a1a",
    borderRadius: profile.border_radius ?? "1rem",
    buttonStyle: profile.button_style ?? "rounded",
  });

  const bannerPreview = profile.banner_url ?? branding?.banner_url ?? "";

  const storefrontUrl = useMemo(
    () => MARKETPLACE_ROUTES.store(store.slug),
    [store.slug],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const result = await saveStoreBuilderAction(new FormData(e.currentTarget));
    if (!result.success) setError(result.error ?? "Save failed");
    else {
      setSuccess(true);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[240px_1fr_320px]">
      <nav className="space-y-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "w-full rounded-xl px-4 py-3 text-left text-sm transition-colors",
              tab === t.id
                ? "bg-gold/10 text-gold"
                : "text-muted hover:bg-surface hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
        <Link
          href={storefrontUrl}
          target="_blank"
          className="mt-4 block rounded-xl border border-border px-4 py-3 text-sm text-gold hover:border-gold/30"
        >
          View live storefront →
        </Link>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">
        {tab === "general" && (
          <section className="space-y-4 nxr-card p-6">
            <h2 className="font-heading text-lg font-semibold">General information</h2>
            <Input name="name" label="Store name" defaultValue={store.name} required />
            <Input name="slug" label="Store slug" defaultValue={store.slug} required />
            <Textarea name="description" label="Description" rows={4} defaultValue={profile.description ?? branding?.tagline ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="businessEmail" label="Contact email" defaultValue={profile.business_email ?? ""} />
              <Input name="businessPhone" label="Phone" defaultValue={profile.business_phone ?? ""} />
              <Input name="businessAddress" label="Address" defaultValue={profile.business_address ?? ""} className="sm:col-span-2" />
              <Input name="country" label="Country" defaultValue={profile.country ?? ""} />
              <Input name="language" label="Language" defaultValue={profile.language ?? "en"} />
              <Input name="timezone" label="Timezone" defaultValue={profile.timezone ?? "UTC"} className="sm:col-span-2" />
              <Input name="businessHours" label="Business hours" defaultValue={profile.business_hours ? Object.values(profile.business_hours).join(", ") : ""} className="sm:col-span-2" />
            </div>
          </section>
        )}

        {tab === "branding" && (
          <section className="space-y-4 nxr-card p-6">
            <h2 className="font-heading text-lg font-semibold">Branding</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted">Logo upload</label>
                <input type="file" name="logo" accept="image/*" className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-background" />
              </div>
              <div>
                <label className="text-xs text-muted">Banner upload</label>
                <input type="file" name="banner" accept="image/*" className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-background" />
              </div>
            </div>
            <Input name="bannerUrl" label="Banner URL (optional)" defaultValue={profile.banner_url ?? branding?.banner_url ?? ""} />
            <Input name="faviconUrl" label="Favicon URL" defaultValue={profile.favicon_url ?? ""} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted">Primary color</label>
                <input type="color" name="primaryColor" defaultValue={preview.primaryColor} onChange={(e) => setPreview((p) => ({ ...p, primaryColor: e.target.value }))} className="mt-1 h-10 w-full cursor-pointer rounded border border-border bg-transparent" />
                <Input name="primaryColorText" defaultValue={preview.primaryColor} onChange={(e) => setPreview((p) => ({ ...p, primaryColor: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted">Secondary color</label>
                <input type="color" name="secondaryColor" defaultValue={preview.secondaryColor} onChange={(e) => setPreview((p) => ({ ...p, secondaryColor: e.target.value }))} className="mt-1 h-10 w-full cursor-pointer rounded border border-border bg-transparent" />
                <Input name="secondaryColorText" defaultValue={preview.secondaryColor} />
              </div>
              <div>
                <label className="text-xs text-muted">Accent color</label>
                <Input name="accentColor" defaultValue={profile.accent_color ?? branding?.accent_color ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input name="typography" label="Typography" defaultValue={profile.typography ?? "Inter"} />
              <Input name="buttonStyle" label="Button style" defaultValue={profile.button_style ?? "rounded"} onChange={(e) => setPreview((p) => ({ ...p, buttonStyle: e.target.value }))} />
              <Input name="borderRadius" label="Border radius" defaultValue={profile.border_radius ?? "1rem"} onChange={(e) => setPreview((p) => ({ ...p, borderRadius: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={profile.featured ?? branding?.featured} />
              Request featured placement
            </label>
          </section>
        )}

        {tab === "social" && (
          <section className="space-y-4 nxr-card p-6">
            <h2 className="font-heading text-lg font-semibold">Social links</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="website" label="Website" defaultValue={profile.website ?? branding?.social_links?.website ?? ""} />
              <Input name="facebook" label="Facebook" defaultValue={profile.facebook ?? branding?.social_links?.facebook ?? ""} />
              <Input name="instagram" label="Instagram" defaultValue={profile.instagram ?? branding?.social_links?.instagram ?? ""} />
              <Input name="twitter" label="X (Twitter)" defaultValue={profile.twitter ?? branding?.social_links?.twitter ?? ""} />
              <Input name="tiktok" label="TikTok" defaultValue={profile.tiktok ?? branding?.social_links?.tiktok ?? ""} />
              <Input name="linkedin" label="LinkedIn" defaultValue={profile.linkedin ?? branding?.social_links?.linkedin ?? ""} />
              <Input name="youtube" label="YouTube" defaultValue={profile.youtube ?? branding?.social_links?.youtube ?? ""} />
              <Input name="telegram" label="Telegram" defaultValue={profile.telegram ?? branding?.social_links?.telegram ?? ""} />
              <Input name="discord" label="Discord" defaultValue={profile.discord ?? branding?.social_links?.discord ?? ""} />
            </div>
          </section>
        )}

        {tab === "policies" && (
          <section className="space-y-4 nxr-card p-6">
            <h2 className="font-heading text-lg font-semibold">Store policies</h2>
            <Textarea name="privacyPolicy" label="Privacy policy" rows={4} defaultValue={profile.privacy_policy ?? ""} />
            <Textarea name="refundPolicy" label="Refund policy" rows={4} defaultValue={profile.refund_policy ?? ""} />
            <Textarea name="shippingPolicy" label="Shipping policy" rows={4} defaultValue={profile.shipping_policy ?? ""} />
            <Textarea name="terms" label="Terms" rows={4} defaultValue={profile.terms ?? ""} />
            <Textarea name="policies" label="Additional policies" rows={3} defaultValue={profile.policies ?? branding?.policies ?? ""} />
          </section>
        )}

        {tab === "seo" && (
          <section className="space-y-4 nxr-card p-6">
            <h2 className="font-heading text-lg font-semibold">SEO</h2>
            <Input name="seoTitle" label="SEO title" defaultValue={profile.seo_title ?? store.name} />
            <Textarea name="seoDescription" label="SEO description" rows={3} defaultValue={profile.seo_description ?? profile.description ?? ""} />
            <Input name="seoKeywords" label="Keywords" defaultValue={profile.seo_keywords ?? ""} />
            <Input name="ogImage" label="OpenGraph image URL" defaultValue={profile.og_image ?? profile.banner_url ?? ""} />
            <Input name="canonicalUrl" label="Canonical URL" defaultValue={profile.canonical_url ?? ""} placeholder="https://..." />
          </section>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">Store saved successfully</p>}

        <Button type="submit" disabled={submitting} glow>
          {submitting ? "Saving…" : "Save store builder"}
        </Button>
      </form>

      <aside className="hidden xl:block">
        <div className="sticky top-24 nxr-card p-4">
          <p className="text-xs tracking-wide text-muted uppercase">Live preview</p>
          <div
            className="mt-4 overflow-hidden rounded-xl border border-border"
            style={{ borderRadius: preview.borderRadius }}
          >
            <div
              className="h-24 bg-cover bg-center"
              style={{
                backgroundColor: preview.secondaryColor,
                backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
              }}
            />
            <div className="p-4" style={{ backgroundColor: preview.secondaryColor }}>
              <div className="flex items-center gap-3">
                {store.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                )}
                <div>
                  <p className="font-heading text-sm font-semibold text-white">{store.name}</p>
                  <p className="text-xs text-white/60">/{store.slug}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 w-full py-2 text-sm font-medium text-background"
                style={{
                  backgroundColor: preview.primaryColor,
                  borderRadius: preview.buttonStyle === "pill" ? "9999px" : preview.borderRadius,
                }}
              >
                Shop now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
