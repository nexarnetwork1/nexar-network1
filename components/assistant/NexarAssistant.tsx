"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bot, Send, Sparkles, X } from "lucide-react";
import { askGlobalAssistantAction } from "@/modules/ai/actions";
import { ASSISTANT_SUGGESTED_PROMPTS } from "@/modules/ai/site-knowledge";
import type { ConversationTurn, GlobalAssistantAction, GlobalAssistantLink } from "@/modules/ai/types";
import { parseRouteContext } from "@/modules/ai/global-assistant/context";
import { useAssistantSession } from "@/hooks/useAssistantSession";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
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

export function NexarAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([...ASSISTANT_SUGGESTED_PROMPTS]);
  const [hash, setHash] = useState("");
  const [assistantMode, setAssistantMode] = useState<"demo" | "openai" | null>(null);
  const { messages, unreadCount, appendMessage, updateMessage, setPanelOpen, hydrated } =
    useAssistantSession();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pageContext = useMemo(
    () => parseRouteContext(pathname, hash || undefined),
    [pathname, hash],
  );

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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setInput("");
      const userMessageId = createId();
      appendMessage({ id: userMessageId, role: "user", content: trimmed });
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
      }) => {
        if (result.suggestedPrompts?.length) {
          setSuggestedPrompts(result.suggestedPrompts);
        }
        if (result.mode) setAssistantMode(result.mode);

        if (streamStarted) {
          updateMessage(assistantId, {
            content: result.content,
            links: result.links,
            actions: result.actions,
            navigateTo: result.navigateTo,
            topic: result.matchedTopic,
          });
        } else {
          appendMessage({
            id: assistantId,
            role: "assistant",
            content: result.content,
            links: result.links,
            actions: result.actions,
            navigateTo: result.navigateTo,
            topic: result.matchedTopic,
          });
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
            content: "Nexar Assistant is temporarily unavailable. Please try again.",
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

  const panelTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  const panelInitial = isMobile ? { y: "100%" } : { x: "100%" };
  const panelAnimate = isMobile ? { y: 0 } : { x: 0 };
  const panelExit = isMobile ? { y: "100%" } : { x: "100%" };

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
                ? `Open Nexar Assistant, ${unreadCount} unread`
                : "Open Nexar Assistant"
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
              aria-label="Close assistant backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-[124] bg-black/45 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="nexar-assistant-title"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={panelTransition}
              className={cn(
                "fixed z-[125] flex flex-col border-border/80 bg-chrome/95 shadow-2xl shadow-black/50 backdrop-blur-2xl",
                isMobile
                  ? "inset-x-0 bottom-0 top-auto max-h-[min(90vh,640px)] rounded-t-2xl border-t"
                  : "inset-y-0 right-0 w-full max-w-[min(100vw,24rem)] border-l",
              )}
            >
              <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                    <Bot className="h-5 w-5 text-gold" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 id="nexar-assistant-title" className="font-heading text-sm font-semibold text-white">
                      Nexar Assistant
                    </h2>
                    <p className="truncate text-[11px] text-muted">
                      {pageContext.label} ·{" "}
                      {assistantMode === "openai" ? "AI powered" : "Enterprise guide"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close Nexar Assistant"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted transition-colors hover:border-gold/30 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </header>

              <div className="border-b border-border/50 px-4 py-2">
                <p className="truncate text-[10px] tracking-wide text-gold/80 uppercase">
                  Context: {pageContext.label}
                </p>
              </div>

              <div
                ref={listRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
                data-scroll-lock-scrollable
              >
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                    <p className="text-sm leading-relaxed text-white/90">
                      Hi — I&apos;m your Nexar Assistant. I know where you are on the site and can
                      help with NXR, marketplace, merchants, and navigation. Try &quot;Explain this
                      section&quot; on any page.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-gold/25 hover:text-white"
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
                  />
                ))}

                {loading ? (
                  <div className="max-w-[85%] nxr-card px-4 py-3">
                    <div className="flex gap-1.5" aria-busy="true" aria-label="Assistant is typing">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/70" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/50 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-gold/30 [animation-delay:240ms]" />
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="border-t border-border/70 p-4">
                {messages.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {suggestedPrompts.slice(0, 4).map((prompt) => (
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
                  className="flex items-end gap-2"
                >
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
                    rows={2}
                    placeholder="Ask about Nexar, NXR, marketplace…"
                    className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-white outline-none placeholder:text-muted focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold text-background transition-opacity disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-muted">
                  Enter to send · Shift+Enter for new line · Esc to close ·{" "}
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
  };
  onNavigate: (href: string) => void;
  onAction: (action: GlobalAssistantAction) => void;
};

function AssistantBubble({ message, onNavigate, onAction }: AssistantBubbleProps) {
  const actionHrefs = new Set(message.actions?.map((a) => a.href) ?? []);

  return (
    <div
      className={cn(
        "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        message.role === "user"
          ? "ml-auto bg-gold/15 text-white"
          : "border border-border/60 bg-card/50 text-white/90",
      )}
    >
      {message.topic && message.role === "assistant" ? (
        <p className="mb-1 text-[10px] tracking-wide text-gold uppercase">{message.topic}</p>
      ) : null}
      <p className="whitespace-pre-wrap">{message.content}</p>

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
  );
}
