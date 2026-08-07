"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreAppearanceAction } from "@/modules/stores/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Store, StoreMarketplaceProfile, StoreSettings } from "@/types";

type Props = {
  store: Pick<Store, "id" | "name" | "slug" | "logo_url">;
  settings: StoreSettings;
};

export function StoreAppearanceForm({ store, settings }: Props) {
  const profile = settings.marketplace_profile ?? {};
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const result = await updateStoreAppearanceAction(new FormData(e.currentTarget));
    if (!result.success) setError(result.error ?? "Update failed");
    else {
      setSuccess(true);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 max-w-2xl space-y-6 nxr-card p-6"
    >
      <div>
        <h3 className="font-heading text-lg font-semibold">Branding</h3>
        <p className="mt-1 text-sm text-muted">Logo, banner, and theme colors for your public storefront.</p>
      </div>

      <div className="flex items-center gap-4">
        {store.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logo_url}
            alt={`${store.name} logo`}
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted">
            No logo
          </div>
        )}
        <div className="flex-1">
          <label className="text-xs text-zinc-400">Store logo</label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background"
          />
        </div>
      </div>

      <Input name="bannerUrl" label="Store banner image URL" defaultValue={profile.banner_url ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-400">Primary theme color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              name="primaryColor"
              defaultValue={profile.primary_color ?? "#D4AF37"}
              className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input name="primaryColorText" defaultValue={profile.primary_color ?? "#D4AF37"} className="flex-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Secondary theme color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              name="secondaryColor"
              defaultValue={profile.secondary_color ?? "#1a1a1a"}
              className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input name="secondaryColorText" defaultValue={profile.secondary_color ?? "#1a1a1a"} className="flex-1" />
          </div>
        </div>
      </div>

      <Textarea
        name="description"
        label="Store description"
        rows={4}
        defaultValue={profile.description ?? ""}
      />

      <div>
        <h3 className="font-heading text-base font-semibold">Social links</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input name="website" label="Website" defaultValue={profile.website ?? ""} />
          <Input name="facebook" label="Facebook" defaultValue={profile.facebook ?? ""} />
          <Input name="instagram" label="Instagram" defaultValue={profile.instagram ?? ""} />
          <Input name="twitter" label="X (Twitter)" defaultValue={profile.twitter ?? ""} />
          <Input name="tiktok" label="TikTok" defaultValue={profile.tiktok ?? ""} />
        </div>
      </div>

      <div>
        <h3 className="font-heading text-base font-semibold">Contact information</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input name="businessPhone" label="Business phone" defaultValue={profile.business_phone ?? ""} />
          <Input name="businessEmail" label="Business email" defaultValue={profile.business_email ?? ""} />
          <Input name="businessAddress" label="Business address" defaultValue={profile.business_address ?? ""} className="sm:col-span-2" />
          <Input
            name="businessHours"
            label="Business hours"
            defaultValue={profile.business_hours ? Object.values(profile.business_hours).join(", ") : ""}
            className="sm:col-span-2"
          />
        </div>
      </div>

      <Textarea
        name="policies"
        label="Store policies"
        rows={4}
        defaultValue={profile.policies ?? ""}
        placeholder="Returns, shipping, and purchase policies shown on your storefront."
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={profile.featured} />
        Request featured store placement
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Store appearance saved</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save store appearance"}
      </Button>
    </form>
  );
}
