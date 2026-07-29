import {
  FaDiscord,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { StoreMarketplaceProfile } from "@/types";
import type { StoreBranding } from "@/modules/marketplace/storefront/types";

const LINKS = [
  { key: "website", icon: FaGlobe, label: "Website" },
  { key: "facebook", icon: FaFacebook, label: "Facebook" },
  { key: "instagram", icon: FaInstagram, label: "Instagram" },
  { key: "twitter", icon: FaXTwitter, label: "X" },
  { key: "tiktok", icon: FaTiktok, label: "TikTok" },
  { key: "linkedin", icon: FaLinkedin, label: "LinkedIn" },
  { key: "youtube", icon: FaYoutube, label: "YouTube" },
  { key: "telegram", icon: FaTelegram, label: "Telegram" },
  { key: "discord", icon: FaDiscord, label: "Discord" },
] as const;

type Props = {
  profile: StoreMarketplaceProfile;
  branding?: StoreBranding | null;
};

export function StoreSocialLinks({ profile, branding }: Props) {
  const social = branding?.social_links ?? {};
  const items = LINKS.map(({ key, icon: Icon, label }) => {
    const href =
      (profile as Record<string, string | null | undefined>)[key] ??
      social[key] ??
      null;
    if (!href) return null;
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-gold/30 hover:text-gold"
      >
        <Icon className="h-4 w-4" />
      </a>
    );
  }).filter(Boolean);

  if (!items.length) return null;

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-white">Connect</h2>
      <div className="mt-4 flex flex-wrap gap-2">{items}</div>
    </section>
  );
}

export function StoreContact({ profile }: { profile: StoreMarketplaceProfile }) {
  const rows = [
    { label: "Email", value: profile.business_email },
    { label: "Phone", value: profile.business_phone },
    { label: "Address", value: profile.business_address },
  ].filter((r) => r.value);

  if (!rows.length) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/30 p-6">
      <h2 className="font-heading text-lg font-semibold text-white">Contact</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs tracking-wide text-muted uppercase">{row.label}</dt>
            <dd className="mt-1 text-white">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StorePolicies({ profile }: { profile: StoreMarketplaceProfile }) {
  const sections = [
    { title: "Privacy", body: profile.privacy_policy },
    { title: "Refunds", body: profile.refund_policy },
    { title: "Shipping", body: profile.shipping_policy },
    { title: "Terms", body: profile.terms },
  ].filter((s) => s.body);

  if (!sections.length && !profile.policies) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold text-white">Policies</h2>
      {sections.map((s) => (
        <div key={s.title} className="rounded-xl border border-border/60 bg-surface/30 p-4">
          <h3 className="text-sm font-medium text-gold">{s.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{s.body}</p>
        </div>
      ))}
      {profile.policies && (
        <div className="rounded-xl border border-border/60 bg-surface/30 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{profile.policies}</p>
        </div>
      )}
    </section>
  );
}
