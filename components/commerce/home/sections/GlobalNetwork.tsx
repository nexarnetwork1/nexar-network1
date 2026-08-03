"use client";

import { motion } from "framer-motion";
import { Activity, MapPin, Radio } from "lucide-react";
import { NexarGlobe } from "@/components/commerce/home/globe/NexarGlobe";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { useCommerceActivity } from "@/hooks/commerce/use-commerce-api";
import type { CommerceActivityEvent, CommerceCountry } from "@/lib/commerce/types";

type GlobalNetworkProps = {
  countryCodes: string[];
  countries: CommerceCountry[];
  initialActivity: CommerceActivityEvent[];
};

function formatActivity(type: string) {
  return type.replace(/_/g, " ");
}

export function GlobalNetwork({
  countryCodes,
  countries,
  initialActivity,
}: GlobalNetworkProps) {
  const { data: activity = initialActivity } = useCommerceActivity(20);

  return (
    <SectionShell
      id="global-network"
      eyebrow="Global commerce"
      title="Global commerce network"
      description="Live merchant regions, buyer activity, and cross-border transaction paths across the Nexar Network — powered by real platform data."
      className="overflow-hidden"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <NexarGlobe
          countryCodes={countryCodes}
          activity={activity}
          className="min-h-[420px] lg:min-h-[560px]"
        />

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <motion.div
              whileHover={{ y: -3 }}
              className="nxr-card p-5"
            >
              <div className="mb-2 flex items-center gap-2 text-gold">
                <MapPin className="h-4 w-4" />
                <span className="text-xs tracking-wide uppercase">Active countries</span>
              </div>
              <p className="font-mono text-3xl text-white">{countries.length}</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="nxr-card p-5"
            >
              <div className="mb-2 flex items-center gap-2 text-gold">
                <Radio className="h-4 w-4" />
                <span className="text-xs tracking-wide uppercase">Live regions</span>
              </div>
              <p className="font-mono text-3xl text-white">{countryCodes.length}</p>
            </motion.div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <Activity className="h-4 w-4" />
              <span className="text-xs tracking-wide uppercase">Realtime events</span>
            </div>
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {activity.length ? (
                activity.slice(0, 12).map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-background/30 px-3 py-2.5 text-sm"
                  >
                    <span className="capitalize text-white">
                      {formatActivity(event.activity_type)}
                    </span>
                    <time className="shrink-0 text-[11px] text-muted">
                      {new Date(event.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted">Waiting for network activity…</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
