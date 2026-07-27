import Link from "next/link";

const settingsSections = [
  { title: "Platform fees & treasury", href: "/admin/platform-fees", description: "Fee rates, treasury wallet address, token config" },
  { title: "Exchange rates", href: "/admin/exchange-rates", description: "USD, EUR, EGP, crypto rates" },
  { title: "Supported currencies", href: "/admin/currencies", description: "Enable or disable payment currencies" },
  { title: "Merchant promotions", href: "/admin/promotions", description: "Fee discounts and expiration" },
  { title: "Security", href: "/admin/security", description: "Security config and event logs" },
  { title: "Contact inbox", href: "/admin/contact", description: "Public contact form messages" },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Settings</h1>
      <p className="mt-2 text-zinc-400">Central hub for platform configuration</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-white/10 bg-zinc-900 p-6 transition hover:border-yellow-500/30"
          >
            <h2 className="font-semibold text-yellow-400">{section.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
