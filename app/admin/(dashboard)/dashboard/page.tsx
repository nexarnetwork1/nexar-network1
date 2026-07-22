"use client";

import Link from "next/link";

const cards = [
  {
    title: "News",
    value: "0",
    href: "/admin/news",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    title: "Announcements",
    value: "0",
    href: "/admin/announcements",
    color: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    title: "Partners",
    value: "0",
    href: "/admin/partners",
    color: "from-green-500/20 to-green-500/5",
  },
  {
    title: "Roadmap",
    value: "0",
    href: "/admin/roadmap",
    color: "from-purple-500/20 to-purple-500/5",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-yellow-400">
            Nexar CMS
          </h1>

          <p className="mt-2 text-zinc-400">
            Welcome back, Founder 👋
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-6 transition hover:scale-[1.02]`}
            >
              <p className="text-zinc-400">
                {card.title}
              </p>

              <h2 className="mt-4 text-5xl font-bold">
                {card.value}
              </h2>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-yellow-400">
              Project Status
            </h2>

            <div className="mt-6 space-y-4">
              <Status label="Website" value="Online" />

              <Status label="Supabase" value="Connected" />

              <Status label="Authentication" value="Working" />

              <Status label="CMS" value="Active" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-yellow-400">
              Quick Actions
            </h2>

            <div className="mt-6 grid gap-3">
              <Quick href="/admin/news" text="Manage News" />
              <Quick href="/admin/announcements" text="Manage Announcements" />
              <Quick href="/admin/partners" text="Manage Partners" />
              <Quick href="/admin/roadmap" text="Manage Roadmap" />
              <Quick href="/admin/settings" text="Site Settings" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Status({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-4">
      <span>{label}</span>

      <span className="font-semibold text-green-400">
        {value}
      </span>
    </div>
  );
}

function Quick({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 transition hover:bg-yellow-500/20"
    >
      {text}
    </Link>
  );
}
