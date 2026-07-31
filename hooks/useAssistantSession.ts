"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "nxr-assistant-session";

export type AssistantSessionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: { label: string; href: string }[];
  actions?: { label: string; href: string; kind?: "navigate" | "prompt"; prompt?: string }[];
  navigateTo?: string;
  topic?: string;
  entityRef?: string;
};

type StoredSession = {
  messages: AssistantSessionMessage[];
  unreadCount: number;
};

function readSession(): StoredSession {
  if (typeof window === "undefined") {
    return { messages: [], unreadCount: 0 };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { messages: [], unreadCount: 0 };
    const parsed = JSON.parse(raw) as StoredSession;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      unreadCount: typeof parsed.unreadCount === "number" ? parsed.unreadCount : 0,
    };
  } catch {
    return { messages: [], unreadCount: 0 };
  }
}

function writeSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage quota or private mode — ignore
  }
}

export function useAssistantSession() {
  const [messages, setMessages] = useState<AssistantSessionMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    const session = readSession();
    setMessages(session.messages);
    setUnreadCount(session.unreadCount);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeSession({ messages, unreadCount });
  }, [messages, unreadCount, hydrated]);

  const setPanelOpen = useCallback((open: boolean) => {
    openRef.current = open;
    if (open) {
      setUnreadCount(0);
    }
  }, []);

  const appendMessage = useCallback((message: AssistantSessionMessage) => {
    setMessages((prev) => [...prev, message]);
    if (message.role === "assistant" && !openRef.current) {
      setUnreadCount((count) => count + 1);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<AssistantSessionMessage>) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [],
  );

  return {
    messages,
    setMessages,
    unreadCount,
    appendMessage,
    updateMessage,
    clearMessages,
    setPanelOpen,
    hydrated,
  };
}
