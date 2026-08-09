"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  Compass,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils/cn";

type EntryAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  hrefAuthed: string;
  hrefGuest: string;
};

const ENTRY_ACTIONS: EntryAction[] = [
  {
    id: "use-nexar",
    title: "Use Nexar",
    description:
      "Join the Nexar ecosystem — sign in and enter your ATLAS workspace to connect, discover, and operate.",
    icon: Sparkles,
    hrefAuthed: "/atlas",
    hrefGuest: "/login?redirect=%2Fatlas",
  },
  {
    id: "sell-online",
    title: "Sell Online",
    description:
      "Register as a merchant, launch your store, and sell through Nexar Commerce with crypto and card payments.",
    icon: ShoppingBag,
    hrefAuthed: "/merchant",
    hrefGuest: "/login?mode=register&redirect=%2Fmerchant",
  },
  {
    id: "manage-business",
    title: "Manage Business",
    description:
      "Run your company from ATLAS — business profile, team tools, and operating modules in one workspace.",
    icon: Building2,
    hrefAuthed: "/atlas/business",
    hrefGuest: "/login?redirect=%2Fatlas%2Fbusiness",
  },
  {
    id: "explore-atlas",
    title: "Explore ATLAS",
    description:
      "Browse the Business Operating System — network, marketplace, jobs, events, and more.",
    icon: Compass,
    hrefAuthed: "/atlas",
    hrefGuest: "/atlas",
  },
];

export function UserEntrySection() {
  const { data: session, status } = useSession();
  const isAuthed = Boolean(session?.user?.id);

  return (
    <section
      id="user-entry"
      className="section-padding relative scroll-mt-[var(--nxr-header-offset)]"
      aria-label="What are you looking to do?"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      <Container>
        <Reveal className="mb-10 sm:mb-12">
          <SectionHeading
            eyebrow="Get started"
            title="What are you looking to do?"
            description="Choose how you want to use Nexar Network. Each path connects to the existing platform — no separate accounts or products."
            align="center"
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRY_ACTIONS.map((action, index) => {
            const href =
              status === "loading"
                ? action.hrefGuest
                : isAuthed
                  ? action.hrefAuthed
                  : action.hrefGuest;
            const Icon = action.icon;

            return (
              <Reveal key={action.id} delay={index * 0.05}>
                <Link
                  href={href}
                  className={cn(
                    "group flex h-full flex-col nxr-card p-6 transition-colors duration-200",
                    "hover:border-gold/25 hover:bg-card-hover",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface/80 transition-colors group-hover:border-gold/30">
                    <Icon
                      className="h-5 w-5 text-gold"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {action.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                    {action.description}
                  </p>
                  <span className="mt-5 text-xs font-semibold tracking-[0.08em] text-gold uppercase transition-colors group-hover:text-gold-hover">
                    Continue
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
