"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Copy,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { askGlobalAssistantAction } from "@/modules/ai/actions";
import { ASSISTANT_SUGGESTED_PROMPTS } from "@/modules/ai/site-knowledge";
import type {
  AssistantCard,
  ConversationTurn,
  GlobalAssistantAction,
  GlobalAssistantLink,
} from "@/modules/ai/types";
import { parseRouteContext } from "@/modules/ai/client-context";
import { inferLoadingMessage } from "@/modules/ai/client-ui";
import { useAssistantSession } from "@/hooks/useAssistantSession";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { AssistantMarkdown } from "@/components/assistant/AssistantMarkdown";
import { AssistantCards } from "@/components/assistant/AssistantCards";
import { cn } from "@/lib/utils/cn";

function createId(): string {
  return crypto.randomUUID();
}

function toConversationHistory(
  messages: { role: "user" | "assistant"; content: string; topic?: string; entityRef?: string }[],
): ConversationTurn[] {
  return messages.map(({ role, content, topic, entityRef }) => ({
    role,
    content,
    topic,
    entityRef,
  }));
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function NexarAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Thinking…");
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([...ASSISTANT_SUGGESTED_PROMPTS]);
  const [hash, setHash] = useState("");
  const [assistantMode, setAssistantMode] = useState<"demo" | "openai" | null>(null);
  const {
    messages,
    unreadCount,
    appendMessage,
    updateMessage,
    clearMessages,
    setPanelOpen,
    hydrated,
  } = useAssistantSession();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");

  const pageContext = useMemo(
    () => parseRouteContext(pathname, hash || undefined),
    [pathname, hash],
  );

  const contextualPrompts = useMemo(() => {
    const pageSpecific =
      pageContext.pageType === "market"
        ? ["What is the NXR price?", "Convert 100 NXR to USD"]
        : pageContext.pageType === "whitepaper"
          ? ["Explain tokenomics", "Explain this section"]
          : pageContext.pageType === "atlas"
            ? ["What can I do in ATLAS?", "Open Marketplace"]
            : pageContext.pageType === "marketplace"
              ? ["Find a product", "How does checkout work?"]
              : [];

    return [...pageSpecific, ...suggestedPrompts].slice(0, 6);
  }, [pageContext.pageType, suggestedPrompts]);

  useScrollLock(open);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nxr:assistant-open", onOpen);
    return () => window.removeEventListener("nxr:assistant-open", onOpen);
  }, []);

  useEffect(() => {
    setPanelOpen(open);
  }, [open, setPanelOpen]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, loading, reducedMotion]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setInput("");
      lastUserMessageRef.current = trimmed;
      setLoadingMessage(inferLoadingMessage(trimmed));
      appendMessage({ id: createId(), role: "user", content: trimmed });
      setLoading(true);

      const history = toConversationHistory(
        messages.map(({ role, content, topic, entityRef }) => ({
          role,
          content,
          topic,
          entityRef,
        })),
      );

      const payload = {
        message: trimmed,
        pathname,
        hash: hash || undefined,
        conversationHistory: history,
      };

      const assistantId = createId();
      let streamStarted = false;
      let streamCompleted = false;

      const finalizeAssistant = (result: {
        content: string;
        links?: GlobalAssistantLink[];
        actions?: GlobalAssistantAction[];
        navigateTo?: string;
        suggestedPrompts?: string[];
        matchedTopic?: string;
        mode?: "demo" | "openai";
        cards?: AssistantCard[];
      }) => {
        if (result.suggestedPrompts?.length) {
          setSuggestedPrompts(result.suggestedPrompts);
        }
        if (result.mode) setAssistantMode(result.mode);

        const patch = {
          content: result.content,
          links: result.links,
          actions: result.actions,
          navigateTo: result.navigateTo,
          topic: result.matchedTopic,
          cards: result.cards,
        };

        if (streamStarted) {
          updateMessage(assistantId, patch);
        } else {
          appendMessage({ id: assistantId, role: "assistant", ...patch });
        }
      };

      try {
        const response = await fetch("/api/assistant/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let content = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done || controller.signal.aborted) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6)) as {
                  type: string;
                  text?: string;
                  result?: {
                    content: string;
                    links?: GlobalAssistantLink[];
                    actions?: GlobalAssistantAction[];
                    navigateTo?: string;
                    suggestedPrompts?: string[];
                    matchedTopic?: string;
                    mode?: "demo" | "openai";
                    cards?: AssistantCard[];
                  };
                };

                if (event.type === "delta" && event.text) {
                  if (!streamStarted) {
                    appendMessage({ id: assistantId, role: "assistant", content: "" });
                    streamStarted = true;
                  }
                  content += event.text;
                  updateMessage(assistantId, { content });
                }

                if (event.type === "done" && event.result) {
                  streamCompleted = true;
                  finalizeAssistant(event.result);
                }
              } catch {
                // skip malformed SSE frames
              }
            }
          }

          if (streamCompleted) return;
        }

        const result = await askGlobalAssistantAction(payload);
        if (controller.signal.aborted) return;

        if (!result.success) {
          appendMessage({
            id: createId(),
            role: "assistant",
            content: result.error ?? "Something went wrong. Please try again.",
          });
          return;
        }

        finalizeAssistant(result);
      } catch {
        if (controller.signal.aborted) return;
        if (streamCompleted) return;

        try {
          const result = await askGlobalAssistantAction(payload);
          if (!result.success) {
            appendMessage({
              id: createId(),
              role: "assistant",
              content: result.error ?? "Something went wrong. Please try again.",
            });
            return;
          }
          finalizeAssistant(result);
        } catch {
          appendMessage({
            id: createId(),
            role: "assistant",
            content: "ATLAS AI is temporarily unavailable. Please try again.",
          });
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      }
    },
    [appendMessage, hash, loading, messages, pathname, updateMessage],
  );

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleAction = useCallback(
    (action: GlobalAssistantAction) => {
      if (action.kind === "prompt" && action.prompt) {
        void sendMessage(action.prompt);
        return;
      }
      navigate(action.href);
    },
    [navigate, sendMessage],
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      void sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  const panelTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  const panelInitial = isMobile ? { y: "100%" } : { x: "100%", opacity: 0.96 };
  const panelAnimate = isMobile ? { y: 0 } : { x: 0, opacity: 1 };
  const panelExit = isMobile ? { y: "100%" } : { x: "100%", opacity: 0.96 };

  if (!hydrated) return null;

  return (
    <>
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="fab"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            aria-label={
              unreadCount > 0
                ? `Open ATLAS AI, ${unreadCount} unread`
                : "Open ATLAS AI"
            }
            onClick={() => setOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-[125] flex h-14 w-14 items-center justify-center rounded-full",
              "border border-gold/35 bg-gradient-to-br from-gold via-gold-secondary to-gold-hover",
              "text-background shadow-[0_8px_32px_-4px_rgba(212,175,55,0.55)]",
              "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <Sparkles className="h-6 w-6" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-semibold text-gold ring-2 ring-gold/40">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close ATLAS AI backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-[124] bg-black/50 backdrop-blur-[3px]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="atlas-ai-title"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={panelTransition}
              className={cn(
                "fixed z-[125] flex flex-col overflow-hidden border-border/80 bg-[#0a0a0c]/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75)] backdrop-blur-2xl",
                isMobile
                  ? "inset-x-0 bottom-0 top-[var(--nxr-header-offset,4rem)] rounded-t-[1.25rem] border-t pb-[env(safe-area-inset-bottom)]"
                  : "inset-y-4 right-4 w-[min(100vw-2rem,35rem)] rounded-[1.25rem] border",
              )}
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                    <Sparkles className="h-5 w-5 text-gold" aria-hidden />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0c] bg-emerald-500" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 id="atlas-ai-title" className="font-heading text-base font-semibold tracking-tight text-white">
                      ATLAS AI
                    </h2>
                    <p className="truncate text-[11px] text-muted">
                      Nexar Intelligence · {pageContext.label}
                      {assistantMode === "openai" ? " · Live" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {messages.length > 0 ? (
                    <>
                      <button
                        type="button"
                        aria-label="New conversation"
                        title="New conversation"
                        onClick={() => clearMessages()}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:border-gold/30 hover:text-white"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Clear conversation"
                        title="Clear conversation"
                        onClick={() => clearMessages()}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:border-gold/30 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Close ATLAS AI"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:border-gold/30 hover:text-white"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </header>

              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
                data-scroll-lock-scrollable
              >
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-gold/15 bg-gradient-to-br from-gold/[0.06] to-transparent p-5">
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-gold uppercase">
                      ATLAS AI
                    </p>
                    <p className="mt-2 font-heading text-lg font-semibold text-white">
                      Your intelligence layer for Nexar.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Ask me about Nexar, ATLAS, NXR, the Marketplace, the Whitepaper, live market
                      information, or the page you&apos;re currently viewing.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {contextualPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-xl border border-border/70 bg-black/30 px-3 py-2.5 text-left text-xs text-white/90 transition-colors hover:border-gold/25 hover:bg-gold/5"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <AssistantBubble
                    key={message.id}
                    message={message}
                    onNavigate={navigate}
                    onAction={handleAction}
                    onRetry={handleRetry}
                  />
                ))}

                {loading ? (
                  <div className="max-w-[90%] rounded-2xl border border-border/50 bg-card/40 px-4 py-3">
                    <p className="mb-2 text-xs text-gold/80">{loadingMessage}</p>
                    <div className="flex gap-1.5" aria-busy="true" aria-label="ATLAS AI is thinking">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/70" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/50 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/30 [animation-delay:240ms]" />
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-border/60 bg-[#0a0a0c]/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
                {messages.length > 0 && !loading ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {contextualPrompts.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={loading}
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] text-muted transition-colors hover:border-gold/25 hover:text-white disabled:opacity-40"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(input);
                  }}
                  className="flex items-end gap-2 rounded-2xl border border-border/70 bg-black/40 p-2 focus-within:border-gold/30"
                >
                  <span
                    className="mb-2 ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted"
                    aria-hidden
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                    rows={1}
                    placeholder="Ask ATLAS anything…"
                    className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold text-background transition-opacity disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-muted">
                  Enter to send · Shift+Enter for new line ·{" "}
                  <Link href="/whitepaper" className="text-gold/80 hover:text-gold">
                    Whitepaper
                  </Link>
                </p>
              </footer>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

type AssistantBubbleProps = {
  message: {
    role: "user" | "assistant";
    content: string;
    topic?: string;
    navigateTo?: string;
    links?: GlobalAssistantLink[];
    actions?: GlobalAssistantAction[];
    cards?: AssistantCard[];
  };
  onNavigate: (href: string) => void;
  onAction: (action: GlobalAssistantAction) => void;
  onRetry: () => void;
};

function AssistantBubble({ message, onNavigate, onAction, onRetry }: AssistantBubbleProps) {
  const [copied, setCopied] = useState(false);
  const actionHrefs = new Set(message.actions?.map((a) => a.href) ?? []);
  const isRtl = message.role === "assistant" && containsArabic(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div
      className={cn(
        "group max-w-[92%]",
        message.role === "user" ? "ml-auto" : "mr-auto",
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-3",
          message.role === "user"
            ? "bg-gold/12 text-white"
            : "border border-border/50 bg-card/35 text-white/90",
        )}
        dir={message.role === "user" && containsArabic(message.content) ? "rtl" : isRtl ? "rtl" : "ltr"}
      >
        {message.topic && message.role === "assistant" ? (
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">
            {message.topic}
          </p>
        ) : null}

        {message.role === "assistant" ? (
          <AssistantMarkdown content={message.content || "…"} dir={isRtl ? "rtl" : "ltr"} />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        )}

        {message.role === "assistant" && message.cards?.length ? (
          <AssistantCards cards={message.cards} onNavigate={onNavigate} />
        ) : null}

        {message.role === "assistant" && message.navigateTo ? (
          <button
            type="button"
            onClick={() => onNavigate(message.navigateTo!)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/15"
          >
            Go there
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}

        {message.role === "assistant" && message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.slice(0, 5).map((action) => (
              <button
                key={`action-${action.href}-${action.label}`}
                type="button"
                onClick={() => onAction(action)}
                className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-[11px] font-medium text-gold transition-colors hover:bg-gold/10"
              >
                {action.label}
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        {message.role === "assistant" && message.links?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.links
              .filter((link) => !actionHrefs.has(link.href))
              .slice(0, 4)
              .map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => onNavigate(link.href)}
                  className="rounded-full border border-border/70 px-3 py-1 text-[11px] text-muted transition-colors hover:border-gold/25 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      {message.role === "assistant" && message.content ? (
        <div className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted hover:text-white"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
