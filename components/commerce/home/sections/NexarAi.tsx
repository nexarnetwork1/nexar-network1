"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Globe2,
  Hash,
  LineChart,
  Search,
  Sparkles,
  Tags,
  Type,
  Wand2,
} from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { Button } from "@/components/ui/Button";
import { generateMerchantAssistantAction } from "@/modules/ai";
import type { MerchantAssistantTask } from "@/modules/ai";
import { cn } from "@/lib/utils/cn";

type AssistantTask = MerchantAssistantTask;

const TASKS: {
  id: AssistantTask;
  icon: typeof Wand2;
  label: string;
  placeholder: string;
  examples: string[];
}[] = [
  {
    id: "title",
    icon: Type,
    label: "Product titles",
    placeholder: "Wireless noise-cancelling headphones",
    examples: [
      "Premium wireless earbuds with ANC",
      "Luxury leather wallet — men's collection",
    ],
  },
  {
    id: "description",
    icon: Wand2,
    label: "Descriptions",
    placeholder: "Premium audio gear for commuters",
    examples: [
      "Highlight comfort, battery life, and premium materials",
      "Describe a limited-edition summer fragrance line",
    ],
  },
  {
    id: "seo",
    icon: Search,
    label: "SEO",
    placeholder: "Bluetooth headphones UAE",
    examples: ["Meta title + description for smartwatch store", "SEO for organic skincare brand"],
  },
  {
    id: "keywords",
    icon: Hash,
    label: "Keywords",
    placeholder: "headphones, wireless, premium audio",
    examples: ["Long-tail keywords for crypto hardware wallet", "Buyer-intent keywords for sneakers"],
  },
  {
    id: "tags",
    icon: Tags,
    label: "Product tags",
    placeholder: "Electronics, Audio, Bestseller",
    examples: ["Tags for handmade jewelry collection", "Seasonal tags for winter apparel"],
  },
  {
    id: "marketing",
    icon: Sparkles,
    label: "Marketing copy",
    placeholder: "Launch campaign for new collection",
    examples: ["Email headline for flash sale", "Instagram caption for product launch"],
  },
  {
    id: "translation",
    icon: Globe2,
    label: "Translation",
    placeholder: "Translate product page to Arabic",
    examples: ["Translate hero section to French", "Localize checkout trust badges for MENA"],
  },
  {
    id: "sales",
    icon: LineChart,
    label: "Sales suggestions",
    placeholder: "Low conversion on summer collection",
    examples: ["Upsell ideas for cart abandonment", "Bundle offers for slow-moving SKUs"],
  },
  {
    id: "optimization",
    icon: Bot,
    label: "Store optimization",
    placeholder: "Improve storefront conversion",
    examples: ["Homepage layout suggestions for fashion store", "Trust signals for new merchant"],
  },
];

export function NexarAi() {
  const [activeTask, setActiveTask] = useState<AssistantTask>("title");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "openai" | null>(null);
  const [loading, setLoading] = useState(false);

  const current = useMemo(
    () => TASKS.find((task) => task.id === activeTask) ?? TASKS[0],
    [activeTask],
  );

  const generate = useCallback(async () => {
    setLoading(true);
    setOutput(null);
    setMode(null);
    try {
      const result = await generateMerchantAssistantAction(activeTask, input);
      if (!result.success) {
        setOutput(result.error ?? "Assistant is temporarily unavailable.");
        return;
      }
      setOutput(result.content ?? "");
      setMode(result.mode ?? "demo");
    } catch {
      setOutput("Demo assistant is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTask, input]);

  return (
    <SectionShell
      id="nexar-ai"
      eyebrow="Merchant Assistant"
      title="Nexar AI Copilot"
      description="Your storefront assistant — pick a task, try an example prompt, and generate product copy, SEO, tags, and growth ideas. Demo mode is active; OpenAI can be connected later without changing this workflow."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Assistant capabilities">
            {TASKS.map((task) => {
              const Icon = task.icon;
              const selected = activeTask === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveTask(task.id);
                    setOutput(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs tracking-wide transition-all",
                    selected
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border/70 bg-card/30 text-muted hover:border-gold/20 hover:text-white",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {task.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur-md">
            <label htmlFor="ai-assistant-input" className="text-sm font-medium text-white">
              {current.label}
            </label>
            <p className="mt-1 text-xs text-muted">
              I&apos;ll draft {current.label.toLowerCase()} based on your product or store context.
              Edit the prompt below or tap an example to get started.
            </p>
            <textarea
              id="ai-assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={current.placeholder}
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:ring-2 focus:ring-gold/15"
            />
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Example prompts">
              {current.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-border/70 bg-background/40 px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-gold/25 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void generate()} disabled={loading}>
                {loading ? "Generating…" : "Generate"}
              </Button>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-[11px] text-gold">
                <Bot className="h-3.5 w-3.5" aria-hidden />
                {mode === "openai" ? "AI powered" : "Demo mode · OpenAI ready"}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[320px] flex-col rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card/40 to-surface/20 p-6 backdrop-blur-md"
          role="tabpanel"
          aria-live="polite"
        >
          <p className="text-[11px] tracking-[0.2em] text-gold uppercase">Assistant output</p>
          {loading ? (
            <div className="mt-6 space-y-3" aria-busy="true">
              <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
            </div>
          ) : output ? (
            <pre className="mt-4 flex-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90">
              {output}
            </pre>
          ) : (
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
              Hi — I&apos;m your Nexar merchant assistant. Choose a task above, tap an example
              prompt, and I&apos;ll generate titles, descriptions, SEO metadata, tags, and
              merchandising suggestions for your storefront.
            </p>
          )}
        </motion.div>
      </div>
    </SectionShell>
  );
}
