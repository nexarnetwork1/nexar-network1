"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreMarketplaceProfileAction } from "@/modules/stores/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { StoreMarketplaceProfile, StoreSettings } from "@/types";

type Props = {
  settings: StoreSettings;
};

export function StoreMarketplaceProfileForm({ settings }: Props) {
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
    const result = await updateStoreMarketplaceProfileAction(new FormData(e.currentTarget));
    if (!result.success) setError(result.error ?? "Update failed");
    else {
      setSuccess(true);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-2xl space-y-4 rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="font-heading text-lg font-semibold">Storefront customization</h3>
      <Input name="bannerUrl" label="Banner image URL" defaultValue={profile.banner_url ?? ""} />
      <Input name="description" label="Store description" defaultValue={profile.description ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="primaryColor" label="Primary color" defaultValue={profile.primary_color ?? "#D4AF37"} />
        <Input name="secondaryColor" label="Secondary color" defaultValue={profile.secondary_color ?? "#1a1a1a"} />
      </div>
      <Input name="website" label="Website" defaultValue={profile.website ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="facebook" label="Facebook" defaultValue={profile.facebook ?? ""} />
        <Input name="instagram" label="Instagram" defaultValue={profile.instagram ?? ""} />
        <Input name="twitter" label="X (Twitter)" defaultValue={profile.twitter ?? ""} />
        <Input name="tiktok" label="TikTok" defaultValue={profile.tiktok ?? ""} />
      </div>
      <Input name="businessPhone" label="Business phone" defaultValue={profile.business_phone ?? ""} />
      <Input name="businessEmail" label="Business email" defaultValue={profile.business_email ?? ""} />
      <Input name="businessAddress" label="Business address" defaultValue={profile.business_address ?? ""} />
      <Input name="businessHours" label="Business hours (e.g. Mon-Fri 9-5)" defaultValue={profile.business_hours ? Object.values(profile.business_hours).join(", ") : ""} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={profile.featured} />
        Request featured store placement
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Storefront saved</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save storefront"}
      </Button>
    </form>
  );
}
