"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import type { CommerceFaqItem } from "@/lib/commerce/types";
import { cn } from "@/lib/utils/cn";

type FaqSectionProps = {
  items: CommerceFaqItem[];
};

export function FaqSection({ items }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <SectionShell
      id="faq"
      eyebrow="Support"
      title="Frequently asked questions"
      description="Dynamic answers sourced from live platform announcements and commerce activity records."
      align="center"
    >
      {items.length ? (
        <div className="mx-auto max-w-3xl space-y-3">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/40 backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-heading text-sm font-medium text-white sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-gold transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="border-t border-border/60 px-5 py-4 text-sm leading-relaxed text-muted">
                        {item.answer}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">FAQ content will populate from platform announcements.</p>
      )}
    </SectionShell>
  );
}
